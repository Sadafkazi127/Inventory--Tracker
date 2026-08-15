import { z } from "zod/v4";

export const customerBodySchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")).optional(),
});
export const updateCustomerBodySchema = customerBodySchema.partial();
export type CustomerInput = z.infer<typeof customerBodySchema>;
