import { z } from "zod/v4";

export const adjustStockBodySchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(["in", "adjustment"]),
  note: z.string().default(""),
});
export type AdjustStockInput = z.infer<typeof adjustStockBodySchema>;
