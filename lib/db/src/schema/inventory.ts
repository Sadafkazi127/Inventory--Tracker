import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const inventoryLogsTable = mysqlTable(
  "inventory_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    productId: varchar("product_id", { length: 36 }).references(
      () => productsTable.id,
      { onDelete: "set null" }
    ),
    productName: varchar("product_name", { length: 200 }).notNull(),
    type: mysqlEnum("type", ["in", "out", "adjustment"]).notNull(),
    quantity: int("quantity").notNull(),
    previousStock: int("previous_stock").notNull(),
    newStock: int("new_stock").notNull(),
    note: varchar("note", { length: 255 }).notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("inventory_logs_product_idx").on(table.productId),
    index("inventory_logs_created_at_idx").on(table.createdAt),
  ]
);

export const insertInventoryLogSchema = createInsertSchema(inventoryLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogsTable.$inferSelect;
