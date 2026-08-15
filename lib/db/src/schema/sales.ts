import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { productsTable } from "./products";

export const salesTable = mysqlTable(
  "sales",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
    customerId: varchar("customer_id", { length: 36 }).references(
      () => customersTable.id,
      { onDelete: "set null" }
    ),
    customerName: varchar("customer_name", { length: 150 }),
    subtotal: decimal("subtotal", { precision: 12, scale: 2, mode: "number" }).notNull(),
    discount: decimal("discount", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    discountType: mysqlEnum("discount_type", ["percent", "amount"])
      .notNull()
      .default("amount"),
    gst: decimal("gst", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    gstPercent: decimal("gst_percent", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),
    grandTotal: decimal("grand_total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    paymentMethod: mysqlEnum("payment_method", ["cash", "upi", "card"]).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("sales_created_at_idx").on(table.createdAt),
    index("sales_customer_idx").on(table.customerId),
  ]
);

export const saleItemsTable = mysqlTable(
  "sale_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    saleId: varchar("sale_id", { length: 36 })
      .notNull()
      .references(() => salesTable.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 36 }).references(
      () => productsTable.id,
      { onDelete: "set null" }
    ),
    // Snapshot fields — historical invoices stay accurate even if the product changes later
    productName: varchar("product_name", { length: 200 }).notNull(),
    unit: varchar("unit", { length: 30 }).notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2, mode: "number" }).notNull(),
    total: decimal("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
  },
  (table) => [index("sale_items_sale_idx").on(table.saleId)]
);

export const salesRelations = relations(salesTable, ({ many, one }) => ({
  items: many(saleItemsTable),
  customer: one(customersTable, {
    fields: [salesTable.customerId],
    references: [customersTable.id],
  }),
}));

export const saleItemsRelations = relations(saleItemsTable, ({ one }) => ({
  sale: one(salesTable, {
    fields: [saleItemsTable.saleId],
    references: [salesTable.id],
  }),
  product: one(productsTable, {
    fields: [saleItemsTable.productId],
    references: [productsTable.id],
  }),
}));

export const insertSaleSchema = createInsertSchema(salesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;

export const insertSaleItemSchema = createInsertSchema(saleItemsTable).omit({
  id: true,
});
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItemsTable.$inferSelect;

// Single-row counter (id is always "1") used to generate sequential invoice
// numbers. Incremented inside the same transaction as sale creation.
export const invoiceCounterTable = mysqlTable("invoice_counter", {
  id: varchar("id", { length: 8 }).primaryKey().default("1"),
  value: int("value").notNull().default(0),
});
