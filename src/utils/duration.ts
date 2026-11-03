export function parseDurationMs(value: string | number): number {
    if (typeof value === "number") {
        if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid duration: ${value}`);
        return Math.floor(value * 1000);
    }
    const match = /^\s*(\d+)\s*(ms|s|m|h|d|w)?\s*$/i.exec(value);
    if (!match) throw new Error(`Invalid duration: ${value}`);
    const amount = Number(match[1]);
    const unit = (match[2] ?? "s").toLowerCase();
    const multipliers: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };
    return amount * multipliers[unit];
}
