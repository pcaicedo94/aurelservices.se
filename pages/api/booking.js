import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

    // Build start/end times
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

    // 1. Check availability
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
    await transporter.sendMail({
      from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
      to: email,
      subject: `Bokningsbekräftelse - ${cleaningType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2d9070, #34a783); padding: 25px 30px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 22px;">Tack för din bokning!</h2>
          </div>
          <div style="background: #f8f9fa; padding: 25px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
            <p style="font-size: 16px;">Hej <strong>${name}</strong>,</p>
            <p>Vi har mottagit din bokning för <strong>${cleaningType}</strong>. Här är en sammanfattning:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d; width: 130px;">Datum/tid</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${dateTime ? new Date(dateTime).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" }) : "Ej angiven"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Adress</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${address}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6c757d;">Uppskattat pris</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 18px; color: #2d9070;">${totalPrice} kr</td>
              </tr>
            </table>
            <p>Vi återkommer med en bekräftelse inom kort.</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
            <p style="margin: 0; font-size: 14px;">Med vänliga hälsningar,</p>
            <p style="margin: 5px 0 0; font-weight: bold;">Aurel Städ & Allservice AB</p>
            <p style="margin: 3px 0; font-size: 13px; color: #6c757d;">Tel: 076-045 02 28 | info@aurelservice.se</p>
          </div>
        </div>
      `,
    });

    // 5. Send notification email to admin
    await transporter.sendMail({
      from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
      to: "info@aurelservice.se",
      replyTo: email,
      subject: `Ny bokning - ${cleaningType} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2d9070, #34a783); padding: 25px 30px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 22px;">Ny bokning mottagen</h2>
          </div>
          <div style="background: #f8f9fa; padding: 25px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d; width: 130px;">Tjänst</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">${cleaningType}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Kund</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; font-weight: bold;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">E-post</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;"><a href="mailto:${email}" style="color: #34a783;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Telefon</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;"><a href="tel:${phone}" style="color: #34a783;">${phone}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Adress</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${address}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Datum/tid</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${dateTime ? new Date(dateTime).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" }) : "Ej angiven"}</td>
              </tr>
              ${rest.area ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Yta</td><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${rest.area} m²</td></tr>` : ""}
              ${rest.frequency ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Frekvens</td><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${rest.frequency}</td></tr>` : ""}
              ${rest.estimatedHours ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Beräknad tid</td><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${rest.estimatedHours} timmar</td></tr>` : ""}
              ${rest.extras ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;">Tillval</td><td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">${rest.extras}</td></tr>` : ""}
              <tr>
                <td style="padding: 12px 0; color: #6c757d; font-size: 16px;">Pris</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 20px; color: #2d9070;">${totalPrice} kr</td>
              </tr>
            </table>
          </div>
          <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 15px;">Aurel Städ & Allservice AB — info@aurelservice.se</p>
        </div>
      `,
    });

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
