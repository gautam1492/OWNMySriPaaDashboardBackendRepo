export function resolveCookieSecure(nodeEnv: string, configuredValue: string | undefined) {
    if (configuredValue !== undefined) return configuredValue === "true";
    return nodeEnv === "production";
}
