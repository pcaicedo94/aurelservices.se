import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid-transport";

const transporter = {
  auth: {
    api_key: process.env.SENDGRID_API_KEY,
  },
};

const mailer = nodemailer.createTransport(sgTransport(transporter));

export default async (req, res) => {
  console.log(req.body);
  const { size, address, clientEmail } = req.body;

  const data = {
    to: clientEmail,
    from: "braianfilipovic@gmail.com",
    subject: "from AurelService  webpage",
    text: `${size} ${address}`,
    html: `
          <b>Size:</b> ${size} <br /> 
          <b>Address:</b> ${address} <br /> 
        `,
  };
  try {
    const response = await mailer.sendMail(data);
    console.log(response);
    res.status(200).send("Mensaje enviado");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error al enviar");
  }
};
