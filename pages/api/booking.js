import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { google } from "googleapis";

// --- PRODUCCIÓN: Nodemailer + Simply SMTP ---
// import nodemailer from "nodemailer";
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT, 10),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });
// --- FIN PRODUCCIÓN ---

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

function getEventDuration(body) {
  const hours = parseFloat(body.estimatedHours || body.hours || 2);
  return Math.max(1, hours);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { cleaningType, name, email, phone, address, dateTime, totalPrice, ...rest } = req.body;

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const durationHours = getEventDuration(req.body);

    // Build start/end times - ensure seconds are included for Google Calendar
    const startTime = dateTime.length === 16 ? `${dateTime}:00` : dateTime;
    const endDate = new Date(dateTime);
    endDate.setHours(endDate.getHours() + Math.floor(durationHours));
    endDate.setMinutes(endDate.getMinutes() + (durationHours % 1) * 60);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
    const endDay = String(endDate.getDate()).padStart(2, "0");
    const endHour = String(endDate.getHours()).padStart(2, "0");
    const endMin = String(endDate.getMinutes()).padStart(2, "0");
    const endTime = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMin}:00`;

    // 1. Check availability via events list
    const existingEvents = await calendar.events.list({
      calendarId,
      timeMin: new Date(dateTime).toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
    });

    if (existingEvents.data.items && existingEvents.data.items.length > 0) {
      return res.status(409).json({
        message: "Tyvärr är den valda tiden inte tillgänglig. Vänligen välj en annan tid.",
      });
    }

    // 2. Create Google Calendar event
    const eventDescription = [
      `Telefon: ${phone}`,
      `E-post: ${email}`,
      `Pris: ${totalPrice} kr`,
      rest.area ? `Yta: ${rest.area} m²` : null,
      rest.frequency ? `Frekvens: ${rest.frequency}` : null,
      rest.extras ? `Tillval: ${rest.extras}` : null,
      rest.rooms ? `Rum: ${rest.rooms}` : null,
      rest.numberOfUnits ? `Enheter: ${rest.numberOfUnits}` : null,
    ].filter(Boolean).join("\n");

    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `${cleaningType} - ${name}`,
        location: address,
        description: eventDescription,
        start: {
          dateTime: startTime,
          timeZone: "Europe/Stockholm",
        },
        end: {
          dateTime: endTime,
          timeZone: "Europe/Stockholm",
        },
      },
    });

    const eventId = event.data.id;

    // 3. Store booking in Supabase
    const { error: dbError } = await supabase.from("bookings").insert({
      cleaning_type: cleaningType,
      name,
      email,
      phone,
      address,
      date_time: dateTime || null,
      total_price: totalPrice || null,
      details: req.body,
      event_id: eventId,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    // 4. Send confirmation email to customer
    // --- PRUEBAS: Resend ---
    await resend.emails.send({
      from: "Aurel Services <onboarding@resend.dev>",
      to: email,
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
        <p>Med vänliga hälsningar,<br/>Aurel Städ AB<br/>Tel: 076-045 02 28<br/>info@aurelservice.se</p>
      `,
    });
    // --- PRODUCCIÓN: Nodemailer ---
    // await transporter.sendMail({
    //   from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
    //   to: email,
    //   subject: `Bokningsbekräftelse - ${cleaningType}`,
    //   html: `
    //     <h2>Tack för din bokning!</h2>
    //     <p>Hej ${name},</p>
    //     <p>Vi har mottagit din bokning för <strong>${cleaningType}</strong>.</p>
    //     <p><strong>Datum och tid:</strong> ${dateTime || "Ej angiven"}</p>
    //     <p><strong>Adress:</strong> ${address}</p>
    //     <p><strong>Uppskattat pris:</strong> ${totalPrice} kr</p>
    //     <p>Vi återkommer med en bekräftelse inom kort.</p>
    //     <br/>
    //     <p>Med vänliga hälsningar,<br/>Aurel Städ AB<br/>Tel: 076-045 02 28<br/>info@aurelservice.se</p>
    //   `,
    // });

    // 5. Send notification email to admin
    // --- PRUEBAS: Resend ---
    await resend.emails.send({
      from: "Aurel Services <onboarding@resend.dev>",
      to: "pcaicedo94@gmail.com",
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
    // --- PRODUCCIÓN: Nodemailer ---
    // await transporter.sendMail({
    //   from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
    //   to: "info@aurelservice.se",
    //   replyTo: email,
    //   subject: `Ny bokning - ${cleaningType} - ${name}`,
    //   html: `
    //     <h2>Ny bokning mottagen</h2>
    //     <p><strong>Typ:</strong> ${cleaningType}</p>
    //     <p><strong>Namn:</strong> ${name}</p>
    //     <p><strong>E-post:</strong> ${email}</p>
    //     <p><strong>Telefon:</strong> ${phone}</p>
    //     <p><strong>Adress:</strong> ${address}</p>
    //     <p><strong>Datum/tid:</strong> ${dateTime || "Ej angiven"}</p>
    //     <p><strong>Pris:</strong> ${totalPrice} kr</p>
    //     <hr/>
    //     <p><strong>Alla detaljer:</strong></p>
    //     <pre>${JSON.stringify(req.body, null, 2)}</pre>
    //   `,
    // });

    res.status(200).json({ message: "Bokning skapad! Vi skickar en bekräftelse till din e-post." });
  } catch (error) {
    const errData = error?.response?.data?.error || error?.response?.data || {};
    const errMsg = errData.message || error?.message || "Okänt fel";
    const errCode = errData.code || error?.code || "unknown";
    console.error("Booking error:", errCode, errMsg);
    console.error("Full error details:", JSON.stringify(errData, null, 2));
    res.status(500).json({ message: `Fel (${errCode}): ${errMsg}` });
  }
}
