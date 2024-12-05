const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/send-email", (req, res) => {
  const { serviceType, cleanType, size, address, email, price } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-email-password",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Service Details",
    text: `Service Type: ${serviceType}\nClean Type: ${cleanType}\nSize: ${size}\nAddress: ${address}\nPrice: ${price}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.send("Email sent: " + info.response);
  });
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
