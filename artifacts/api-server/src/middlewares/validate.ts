import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod/v4";

// Validates req.body against a zod schema and replaces it with the parsed
// (and type-coerced/defaulted) result before the controller runs.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
