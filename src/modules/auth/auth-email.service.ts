import { env } from "../../config/env.js";
import { sendEmail } from "../../config/email.js";

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
        html: `<!doctype html><html><body style="margin:0;background:#f5f7f4;font-family:Arial,sans-serif;color:#263329"><div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e2e8df;border-radius:16px;overflow:hidden"><div style="padding:24px 28px;background:#f3f6ef;border-bottom:1px solid #e5eadd"><strong style="font-size:20px;color:#49632d">SriPAA Growth System</strong></div><div style="padding:28px"><h1 style="font-size:22px;margin:0 0 12px">Reset your password</h1><p>Hello ${safeName},</p><p>We received a request to reset the password for your account.</p><p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#577635;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:bold">Choose a new password</a></p><p>This link expires in <strong>30 minutes</strong> and works once. If you did not request a reset, you can ignore this email.</p></div><div style="padding:18px 28px;border-top:1px solid #edf0e9;color:#718071;font-size:12px">Automated account security message.</div></div></body></html>`,
    });
}

export async function sendManagementNotification(
    recipient: string,
    subject: string,
    heading: string,
    details: string[],
) {
    const htmlDetails = details.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
    await sendEmail({
        to: recipient,
        subject,
        text: `${heading}\n\n${details.join("\n")}\n\nAutomated SriPAA Growth System notification.`,
        html: `<!doctype html><html><body style="margin:0;background:#f5f7f4;font-family:Arial,sans-serif;color:#263329"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e2e8df;border-radius:16px;overflow:hidden"><div style="padding:24px 28px;background:#f3f6ef;border-bottom:1px solid #e5eadd"><strong style="font-size:20px;color:#49632d">SriPAA Growth System</strong></div><div style="padding:28px"><h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(heading)}</h1><ul style="padding-left:20px;line-height:1.8">${htmlDetails}</ul></div><div style="padding:18px 28px;border-top:1px solid #edf0e9;color:#718071;font-size:12px">Automated account notification.</div></div></body></html>`,
    });
}
