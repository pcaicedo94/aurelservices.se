import nodemailer from "nodemailer";
import { simulatedError, isLiveSite } from "./testMode.js";

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

// Staging: MAIL_REDIRECT_TO sends every message to that address instead of to
// the real recipient, so a staging deployment can exercise the real SMTP path
// — real connection, real rendering, real failure modes — without a test
// booking ever reaching the customer or info@aurelservice.se. The original
// recipient is kept in the subject so it is obvious which mail it was.
// It is refused on the live site: silently diverting customer mail there
// would be worse than any bug it could catch. See isLiveSite() for what
// counts as live — a Vercel project used only for staging does not.
export function redirectForStaging(message, env = process.env) {
  const to = env.MAIL_REDIRECT_TO;
  if (!to) return message;
  if (isLiveSite(env)) {
    console.error("MAIL_REDIRECT_TO is ignored on the live site.");
    return message;
  }
  return {
    ...message,
    to,
    subject: `[staging → ${message.to}] ${message.subject}`,
  };
}

// Outside test mode (no trace) mail goes out through Simply SMTP. In test mode
// it is only rendered and recorded in the trace; see utils/testMode.js.
export function createMailer({ trace = null } = {}) {
  return {
    async send(message) {
      if (!trace) return smtp().sendMail(redirectForStaging(message));

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
