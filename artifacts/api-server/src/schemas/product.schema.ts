import { z } from "zod/v4";

export const productBodySchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  categoryId: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  purchasePrice: z.number().min(0, "Purchase price can't be negative"),
  sellingPrice: z.number().min(0, "Selling price can't be negative"),
  stock: z.number().int().min(0, "Stock can't be negative"),
  unit: z.string().min(1, "Unit is required"),
});
export const updateProductBodySchema = productBodySchema.partial();
export type ProductInput = z.infer<typeof productBodySchema>;

export const categoryBodySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});
