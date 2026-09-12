import nodemailer from "nodemailer";
import { simulatedError } from "./testMode.js";

// Nodemailer only connects when a message is sent, so creating the transports
// lazily once per server instance is enough.
let smtpTransport = null;
let jsonTransport = null;

function smtp() {
  smtpTransport ||= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return smtpTransport;
}

// Renders the whole message (so a malformed one still fails) but never opens
// a connection.
function json() {
  jsonTransport ||= nodemailer.createTransport({ jsonTransport: true });
  return jsonTransport;
}

// Outside test mode (no trace) mail goes out through Simply SMTP. In test mode
// it is only rendered and recorded in the trace; see utils/testMode.js.
export function createMailer({ trace = null } = {}) {
  return {
    async send(message) {
      if (!trace) return smtp().sendMail(message);

      if (trace.scenario === "mail-error") throw simulatedError("mail");

      const info = await json().sendMail(message);
      trace.mails.push({
        to: message.to,
        replyTo: message.replyTo || null,
        subject: message.subject,
        html: message.html,
      });
      console.info(`[APP_TEST_MODE] mail not sent, to: ${message.to}, subject: ${message.subject}`);
      return info;
    },
  };
}
