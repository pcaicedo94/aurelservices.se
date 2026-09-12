import { escapeHtml } from "./escapeHtml";

// Shared chrome for the transactional emails, so bookings and contact messages
// look like they come from the same company.

const CELL = "padding: 10px 0; border-bottom: 1px solid #dee2e6;";
const LABEL = `${CELL} color: #6c757d;`;

export const FROM = '"Aurel Städ & Allservice" <info@aurelservice.se>';
export const ADMIN_EMAIL = "info@aurelservice.se";

export const FOOTER = `<p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 15px;">Aurel Städ &amp; Allservice AB — info@aurelservice.se</p>`;

// Every value is escaped here, so callers can pass raw form input safely.
export function row(label, value, { last = false, bold = false, href = null } = {}) {
  if (value === null || value === undefined || value === "") return "";
  const cellStyle = last ? "padding: 10px 0;" : CELL;
  const labelStyle = last ? "padding: 10px 0; color: #6c757d;" : LABEL;
  const safe = escapeHtml(value);
  const content = href
    ? `<a href="${escapeHtml(href)}" style="color: #34a783;">${safe}</a>`
    : safe;
  return `
              <tr>
                <td style="${labelStyle} width: 130px;">${escapeHtml(label)}</td>
                <td style="${cellStyle}${bold ? " font-weight: bold;" : ""}">${content}</td>
              </tr>`;
}

export function shell(heading, inner, footer = "") {
  return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2d9070, #34a783); padding: 25px 30px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 22px;">${escapeHtml(heading)}</h2>
          </div>
          <div style="background: #f8f9fa; padding: 25px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
            ${inner}
          </div>
          ${footer}
        </div>
      `;
}

export const SIGNATURE = `
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
            <p style="margin: 0; font-size: 14px;">Med vänliga hälsningar,</p>
            <p style="margin: 5px 0 0; font-weight: bold;">Aurel Städ &amp; Allservice AB</p>
            <p style="margin: 3px 0; font-size: 13px; color: #6c757d;">Tel: 076-045 02 28 | info@aurelservice.se</p>`;
