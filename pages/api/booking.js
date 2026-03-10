import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { cleaningType, name, email, phone, address, dateTime, totalPrice, ...rest } = req.body;

  try {
    // 1. Store booking in Supabase
    const { error: dbError } = await supabase.from("bookings").insert({
      cleaning_type: cleaningType,
      name,
      email,
      phone,
      address,
      date_time: dateTime || null,
      total_price: totalPrice || null,
      details: req.body,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      throw new Error("Database error");
    }

    // 2. Send confirmation email to customer
    await resend.emails.send({
      to: email,
      from: "Aurel Services <onboarding@resend.dev>",
      replyTo: "info@aurelservice.se",
      subject: `Bokningsbekräftelse - ${cleaningType}`,
      html: `
        <h2>Tack för din bokning!</h2>
        <p>Hej ${name},</p>
        <p>Vi har mottagit din bokning för <strong>${cleaningType}</strong>.</p>
        <p><strong>Datum och tid:</strong> ${dateTime || "Ej angiven"}</p>
        <p><strong>Adress:</strong> ${address}</p>
        <p><strong>Uppskattat pris:</strong> ${totalPrice} kr</p>
        <p>Vi återkommer med en bekräftelse inom kort.</p>
        <br/>
        <p>Med vänliga hälsningar,<br/>Aurel Städ AB</p>
      `,
    });

    // 3. Send notification email to admin
    await resend.emails.send({
      to: "pcaicedo94@gmail.com",
      from: "Aurel Services <onboarding@resend.dev>",
      replyTo: email,
      subject: `Ny bokning - ${cleaningType} - ${name}`,
      html: `
        <h2>Ny bokning mottagen</h2>
        <p><strong>Typ:</strong> ${cleaningType}</p>
        <p><strong>Namn:</strong> ${name}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Adress:</strong> ${address}</p>
        <p><strong>Datum/tid:</strong> ${dateTime || "Ej angiven"}</p>
        <p><strong>Pris:</strong> ${totalPrice} kr</p>
        <hr/>
        <p><strong>Alla detaljer:</strong></p>
        <pre>${JSON.stringify(req.body, null, 2)}</pre>
      `,
    });

    res.status(200).json({ message: "Bokning skapad! Vi skickar en bekräftelse till din e-post." });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Något gick fel. Försök igen senare." });
  }
}
