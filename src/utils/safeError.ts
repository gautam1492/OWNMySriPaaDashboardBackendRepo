/** Minimal diagnostics for logs; deliberately excludes message, stack and raw response data. */
export function safeErrorMetadata(error: unknown) {
    const metadata: {
        errorType: string;
        code?: string;
        responseCode?: number;
        errorFrames?: string[];
    } = {
        errorType: error instanceof Error ? error.name : "UnknownError",
    };
    if (typeof error !== "object" || error === null) return metadata;

    const candidate = error as {
        code?: unknown;
        responseCode?: unknown;
        stack?: unknown;
    };
    if (typeof candidate.code === "string") metadata.code = candidate.code;
    if (typeof candidate.responseCode === "number") metadata.responseCode = candidate.responseCode;
    if (typeof candidate.stack === "string") {
        const frames = candidate.stack
            .split("\n")
            .slice(1)
            .map((frame) => {
                const match = frame.match(/(?:\(|at )([^()]+?):(\d+):(\d+)\)?\s*$/);
                if (!match) return undefined;
                const fileName = match[1].split(/[\\/]/).at(-1);
                return fileName ? `${fileName}:${match[2]}:${match[3]}` : undefined;
            })
            .filter((frame): frame is string => Boolean(frame));
        if (frames.length) metadata.errorFrames = frames.slice(0, 5);
    }
    return metadata;
}
