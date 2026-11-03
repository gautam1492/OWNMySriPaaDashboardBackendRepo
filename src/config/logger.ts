import pino from "pino";
import { env } from "./env.js";

const isDev = env.NODE_ENV === "development";

const pinoOptions = isDev
    ? {
          level: env.LOG_LEVEL,
          transport: {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "HH:MM:ss",
                  ignore: "pid,hostname",
                  singleLine: true,
              },
          },
      }
    : { level: env.LOG_LEVEL };

export const logger = pino(pinoOptions);
