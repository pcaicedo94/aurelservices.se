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
  const { size, address, clientEmail, serviceType, cleanType, price } = req.body;

  const data = {
    to: clientEmail,
    from: "aurelservice.noreply@gmail.com",
    replyTo: "info@aurelservice.se",
    subject: "From AurelService webpage",
    text: `Service type: ${serviceType}, Clean type: ${cleanType}, Size: ${size}, Address: ${address}, Price: ${price}`,
    html: `
      <b>Service type:</b> ${serviceType} <br /> 
      <b>Clean type:</b> ${cleanType} <br /> 
      <b>Size:</b> ${size} <br /> 
      <b>Address:</b> ${address} <br /> 
      <b>Price:</b> ${price} <br />
    `,
  };
  
  try {
    const response = await mailer.sendMail(data);
    console.log(response);
    res.status(200).send("Email sent");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error send email");
  }
};
