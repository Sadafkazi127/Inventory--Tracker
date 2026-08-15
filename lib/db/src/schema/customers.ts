import { mysqlTable, varchar, timestamp, index } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = mysqlTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 150 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("customers_phone_idx").on(table.phone)]
);

export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
