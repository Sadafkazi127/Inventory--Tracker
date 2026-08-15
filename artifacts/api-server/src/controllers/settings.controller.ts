import type { Request, Response } from "express";
import { shopSettingsBodySchema } from "../schemas/settings.schema";
import * as settingsService from "../services/settings.service";

export async function getSettingsHandler(_req: Request, res: Response) {
  res.json(await settingsService.getSettings());
}

export async function updateSettingsHandler(req: Request, res: Response) {
  const input = shopSettingsBodySchema.parse(req.body);
  res.json(await settingsService.updateSettings(input));
}
