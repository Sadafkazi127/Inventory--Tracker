import { z } from "zod/v4";

export const saleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const createSaleBodySchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  items: z.array(saleItemInputSchema).min(1, "Cart is empty"),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["percent", "amount"]).default("amount"),
  gstEnabled: z.boolean().default(false),
  gstPercent: z.number().min(0).default(0),
  paymentMethod: z.enum(["cash", "upi", "card"]),
});
export type CreateSaleInput = z.infer<typeof createSaleBodySchema>;
