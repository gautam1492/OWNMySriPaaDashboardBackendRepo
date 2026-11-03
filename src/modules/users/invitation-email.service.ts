import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASSWORD
        ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
        : {}),
});

export type InvitationEmailDetails = {
    invitedName: string;
    email: string;
    roleName: string;
    inviterName: string;
    inviterEmail: string;
    branchNames: string[];
    expiresAt: Date;
    token?: string;
};

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

function formatExpiry(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function shell(title: string, body: string) {
    return `<!doctype html><html><body style="margin:0;background:#f5f7f4;font-family:Arial,sans-serif;color:#263329"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e2e8df;border-radius:16px;overflow:hidden"><div style="padding:24px 28px;background:#f3f6ef;border-bottom:1px solid #e5eadd"><strong style="font-size:20px;color:#49632d">SriPAA Growth System</strong></div><div style="padding:28px">${body}</div><div style="padding:18px 28px;border-top:1px solid #edf0e9;color:#718071;font-size:12px">This is an automated account notification.</div></div></body></html>`;
}

function branchList(branchNames: string[]) {
    return branchNames.length
        ? `<ul style="padding-left:20px">${branchNames.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul>`
        : "All clinic branches (cross-branch access)";
}

function from() {
    if (!env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
        throw new Error("SMTP_USER, SMTP_PASSWORD, and SMTP_FROM must be configured to send mail.");
    }
    return env.SMTP_FROM;
}

export async function sendUserInvitation(details: InvitationEmailDetails) {
    if (!details.token) throw new Error("Invitation token is required.");
    const url = `${env.FRONTEND_URL.replace(/\/$/, "")}/accept-invitation/${encodeURIComponent(details.token)}`;
    const name = escapeHtml(details.invitedName);
    const role = escapeHtml(details.roleName.replaceAll("_", " "));
    const inviter = escapeHtml(details.inviterName);
    const expiry = formatExpiry(details.expiresAt);
    const result = await transporter.sendMail({
        from: from(),
        to: details.email,
        subject: `Invitation to SriPAA Growth System`,
        text: `Hello ${details.invitedName},\n\n${details.inviterName} invited you to SriPAA Growth System as ${details.roleName.replaceAll("_", " ")}.\nAssigned branches: ${details.branchNames.join(", ") || "All clinic branches (cross-branch access)"}.\n\nAccept your invitation: ${url}\n\nThis link expires on ${expiry}.`,
        html: shell(
            "You have been invited",
            `<h1 style="font-size:22px;margin:0 0 12px">You have been invited</h1><p>Hello ${name},</p><p><strong>${inviter}</strong> invited you to join the SriPAA Growth System.</p><div style="padding:16px;background:#f8faf7;border-radius:12px;margin:20px 0"><p style="margin:0 0 8px"><strong>Role:</strong> ${role}</p><p style="margin:0"><strong>Assigned branches:</strong></p>${branchList(details.branchNames)}</div><p>Accept by <strong>${expiry}</strong>.</p><p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#577635;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:bold">Accept invitation</a></p><p style="font-size:12px;color:#718071">If the button does not work, open this link:<br><a href="${url}">${url}</a></p>`,
        ),
    });
    return result.messageId;
}

export async function sendInvitationExpiredNotice(
    details: Omit<InvitationEmailDetails, "token"> & { inviterEmail: string },
) {
    const name = escapeHtml(details.invitedName);
    const email = escapeHtml(details.email);
    const role = escapeHtml(details.roleName.replaceAll("_", " "));
    const branches = details.branchNames.map(escapeHtml).join(", ") || "All clinic branches";
    const inviterName = escapeHtml(details.inviterName);
    const invitationPage = `${env.FRONTEND_URL.replace(/\/$/, "")}/admin/users?view=invitations`;
    await transporter.sendMail({
        from: from(),
        to: details.inviterEmail,
        subject: `SriPAA invitation expired for ${details.invitedName}`,
        text: `The invitation for ${details.invitedName} (${details.email}) expired. Role: ${details.roleName.replaceAll("_", " ")}. Branches: ${branches}. You can send a fresh invitation from ${invitationPage}`,
        html: shell(
            "Invitation expired",
            `<h1 style="font-size:22px;margin:0 0 12px">An invitation has expired</h1><p>Hello ${inviterName},</p><p>The invitation for <strong>${name}</strong> (${email}) expired before it was accepted.</p><div style="padding:16px;background:#f8faf7;border-radius:12px;margin:20px 0"><p style="margin:0 0 8px"><strong>Role:</strong> ${role}</p><p style="margin:0"><strong>Assigned branches:</strong> ${branches}</p></div><p>You can resend the invitation with a fresh, seven-day link.</p><p style="margin:24px 0"><a href="${invitationPage}" style="display:inline-block;background:#577635;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:bold">Manage invitations</a></p>`,
        ),
    });
}
