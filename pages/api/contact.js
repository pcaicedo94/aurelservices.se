import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
  const { size, address, clientEmail, serviceType, cleanType, price } = req.body;

  try {
    await resend.emails.send({
      to: clientEmail,
      from: "Aurel Services <noreply@aurelservice.se>",
      replyTo: "info@aurelservice.se",
      subject: "From AurelService webpage",
      html: `
        <b>Service type:</b> ${serviceType} <br />
        <b>Clean type:</b> ${cleanType} <br />
        <b>Size:</b> ${size} <br />
        <b>Address:</b> ${address} <br />
        <b>Price:</b> ${price} <br />
      `,
    });
    res.status(200).send("Email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error send email");
  }
};
