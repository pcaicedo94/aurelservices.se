import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async (req, res) => {
  const { name, email, phone, subject, text } = req.body;

  try {
    // Send confirmation to customer
    await transporter.sendMail({
      from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
      to: email,
      subject: "Tack för ditt meddelande - Aurel Städ & Allservice",
      html: `
        <h2>Tack för att du kontaktar oss!</h2>
        <p>Hej ${name},</p>
        <p>Vi har mottagit ditt meddelande och återkommer så snart som möjligt.</p>
        <br/>
        <p>Med vänliga hälsningar,<br/>Aurel Städ AB<br/>Tel: 076-045 02 28<br/>info@aurelservice.se</p>
      `,
    });

    // Send notification to admin
    await transporter.sendMail({
      from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
      to: "info@aurelservice.se",
      replyTo: email,
      subject: `Nytt kontaktmeddelande - ${subject}`,
      html: `
        <h2>Nytt meddelande från webbsidan</h2>
        <p><strong>Namn:</strong> ${name}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Ämne:</strong> ${subject}</p>
        <hr/>
        <p><strong>Meddelande:</strong></p>
        <p>${text}</p>
      `,
    });

    res.status(200).send("Email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error send email");
  }
};
