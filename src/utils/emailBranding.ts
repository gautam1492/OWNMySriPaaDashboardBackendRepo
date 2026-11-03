import { env } from "../config/env.js";

function escapeAttribute(value: string) {
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

export function emailBrandHeader() {
    const frontendUrl = env.FRONTEND_URL.replace(/\/$/, "");
    const logoUrl = escapeAttribute(`${frontendUrl}/sripaa-logo.png`);
    return `<div style="padding:22px 28px;background:#fff;border-bottom:1px solid #edf1e9"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="vertical-align:middle"><img src="${logoUrl}" width="126" alt="SriPAA" style="display:block;width:126px;max-width:100%;height:auto;border:0"></td><td style="padding-left:14px;vertical-align:middle;color:#71816a;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Growth System</td></tr></table></div>`;
}
