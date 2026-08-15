import type { Request, Response } from "express";
import { loginSchema, changePasswordSchema } from "../schemas/auth.schema";
import * as authService from "../services/auth.service";

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
}

export function meHandler(req: Request, res: Response) {
  res.json({ user: req.user });
}

export async function changePasswordHandler(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  res.status(204).send();
}
