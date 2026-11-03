import { env } from "../../config/env.js";
import { sendEmail } from "../../config/email.js";
import { emailBrandHeader } from "../../utils/emailBranding.js";

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[character];
    });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    const url = `${env.FRONTEND_URL.replace(/\/$/, "")}/reset-password#${encodeURIComponent(token)}`;
    const safeName = escapeHtml(name);
    await sendEmail({
        to: email,
        subject: "Reset your SriPAA Growth System password",
        text: `Hello ${name},\n\nUse this link to choose a new password: ${url}\n\nThis link expires in 30 minutes and can only be used once. If you did not request it, you can ignore this email.`,
        html: `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f2f5ef;font-family:Arial,sans-serif;color:#263329"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e9dd;border-radius:16px;overflow:hidden">${emailBrandHeader()}<div style="padding:28px"><h1 style="font-size:22px;margin:0 0 12px;color:#243126">Reset your password</h1><p>Hello ${safeName},</p><p>We received a request to reset the password for your account.</p><p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#577635;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:bold">Choose a new password</a></p><p>This link expires in <strong>30 minutes</strong> and works once. If you did not request a reset, you can ignore this email.</p></div><div style="padding:18px 28px;border-top:1px solid #edf0e9;color:#718071;font-size:12px">Automated account security message.</div></div></body></html>`,
    });
}

export async function sendManagementNotification(
    recipient: string,
    subject: string,
    heading: string,
    details: string[],
) {
    const frontendUrl = env.FRONTEND_URL.replace(/\/$/, "");
    const isDailyReminder = heading.startsWith("Daily entries are missing");
    const businessDate = isDailyReminder
        ? details
              .find((line) => line.startsWith("Business date:"))
              ?.slice("Business date:".length)
              .trim()
        : undefined;
    const branchRows = isDailyReminder
        ? details
              .filter((line) => line.includes(": missing "))
              .map((line) => {
                  const separator = line.indexOf(": missing ");
                  const branch = escapeHtml(line.slice(0, separator));
                  const missing = escapeHtml(line.slice(separator + ": missing ".length));
                  return `<tr><td style="padding:15px 16px;border-bottom:1px solid #edf1e9"><strong style="display:block;color:#253125;font-size:15px">${branch}</strong><span style="display:block;margin-top:5px;color:#657264;font-size:13px;line-height:1.5">Missing: ${missing}</span></td><td align="right" style="padding:15px 16px;border-bottom:1px solid #edf1e9;white-space:nowrap"><span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#fff3e5;color:#9a5410;font-size:11px;font-weight:700">Action needed</span></td></tr>`;
              })
              .join("")
        : "";
    const genericRows = details
        .map((line) => {
            const separator = line.indexOf(":");
            const label = separator > 0 ? line.slice(0, separator) : "Details";
            const value = separator > 0 ? line.slice(separator + 1).trim() : line;
            return `<tr><td style="padding:12px 16px;border-bottom:1px solid #edf1e9;color:#708071;font-size:13px;width:36%">${escapeHtml(label)}</td><td style="padding:12px 16px;border-bottom:1px solid #edf1e9;color:#263329;font-size:14px;font-weight:600;line-height:1.5">${escapeHtml(value)}</td></tr>`;
        })
        .join("");
    const intro = isDailyReminder
        ? "Some branches are missing daily records. Review the list and follow up so today’s activity is complete."
        : "Here is a summary of an account event that needs your attention.";
    const detailContent = isDailyReminder
        ? `<div style="margin:22px 0 10px;padding:14px 16px;border:1px solid #e5ebdf;border-radius:12px;background:#f7f9f5"><div style="color:#75816f;font-size:11px;font-weight:700;letter-spacing:.08em">BUSINESS DATE</div><div style="margin-top:5px;color:#283525;font-size:16px;font-weight:700">${escapeHtml(businessDate ?? "Not available")}</div></div><div style="overflow:hidden;border:1px solid #e5ebdf;border-radius:12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${branchRows}</table></div>`
        : `<div style="margin:22px 0;border:1px solid #e5ebdf;border-radius:12px;overflow:hidden"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${genericRows}</table></div>`;
    await sendEmail({
        to: recipient,
        subject,
        text: `${heading}\n\n${details.join("\n")}\n\nAutomated SriPAA Growth System notification.`,
        html: `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f2f5ef;font-family:Arial,Helvetica,sans-serif;color:#263329"><div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e2e9dd;border-radius:18px;overflow:hidden">${emailBrandHeader()}<div style="padding:30px 28px 32px"><div style="margin-bottom:10px;color:${isDailyReminder ? "#54713a" : "#71816a"};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase">${isDailyReminder ? "Daily operations" : "Account notification"}</div><h1 style="margin:0;color:#243126;font-size:23px;line-height:1.35">${escapeHtml(heading)}</h1><p style="margin:12px 0 0;color:#657264;font-size:15px;line-height:1.7">${intro}</p>${detailContent}<div style="margin-top:26px"><a href="${escapeHtml(frontendUrl)}" style="display:inline-block;padding:12px 18px;border-radius:9px;background:#577635;color:#fff;text-decoration:none;font-size:14px;font-weight:700">Open SriPAA</a></div></div><div style="padding:18px 28px;border-top:1px solid #edf1e9;background:#fafbf9;color:#788373;font-size:12px;line-height:1.6">This is an automated SriPAA Growth System notification. Please sign in to review the details.</div></div></body></html>`,
    });
}
