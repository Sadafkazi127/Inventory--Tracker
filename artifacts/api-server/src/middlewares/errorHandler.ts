import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod/v4";
import { AppError } from "../lib/AppError";
import { logger } from "../lib/logger";

// Centralized error handler — never leak stack traces or internals to the client
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
