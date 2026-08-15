import { z } from "zod/v4";

export const shopSettingsBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  gstNumber: z.string().default(""),
  currency: z.string().min(1).default("₹"),
  gstEnabled: z.boolean().default(false),
  gstPercent: z.number().min(0).default(18),
  lowStockThreshold: z.number().int().min(0).default(10),
});
export type ShopSettingsInput = z.infer<typeof shopSettingsBodySchema>;
