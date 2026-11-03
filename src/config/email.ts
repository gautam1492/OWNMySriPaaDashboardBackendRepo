import { env } from "./env.js";

type EmailMessage = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

export class EmailDeliveryError extends Error {
    constructor(
        message: string,
        readonly category: "configuration" | "provider",
        readonly statusCode?: number,
    ) {
        super(message);
        this.name = "EmailDeliveryError";
    }
}

export async function sendEmail(message: EmailMessage): Promise<string> {
    if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
        throw new EmailDeliveryError(
            "Brevo email settings are incomplete. Configure BREVO_API_KEY and BREVO_SENDER_EMAIL.",
            "configuration",
        );
    }

    let response: Response;
    try {
        response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": env.BREVO_API_KEY,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
                to: [{ email: message.to }],
                subject: message.subject,
                textContent: message.text,
                htmlContent: message.html,
            }),
            signal: AbortSignal.timeout(15_000),
        });
    } catch {
        throw new EmailDeliveryError("Could not connect to the Brevo email service.", "provider");
    }

    if (!response.ok) {
        // Do not include provider response bodies: they may contain recipient or account details.
        throw new EmailDeliveryError(
            `Brevo rejected the email request (HTTP ${response.status}).`,
            "provider",
            response.status,
        );
    }

    const result: unknown = await response.json().catch(() => null);
    const messageId =
        result &&
        typeof result === "object" &&
        "messageId" in result &&
        typeof result.messageId === "string"
            ? result.messageId
            : "accepted-by-brevo";
    return messageId;
}
