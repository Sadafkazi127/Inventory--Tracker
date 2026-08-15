import {
  mysqlTable,
  varchar,
  decimal,
  int,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

export const productsTable = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    categoryId: varchar("category_id", { length: 36 }).references(
      () => categoriesTable.id,
      { onDelete: "set null" }
    ),
    // Denormalized so listings/invoices don't need a join and survive category deletion
    category: varchar("category", { length: 100 }).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    purchasePrice: decimal("purchase_price", { precision: 12, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    sellingPrice: decimal("selling_price", { precision: 12, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    stock: int("stock").notNull().default(0),
    unit: varchar("unit", { length: 30 }).notNull().default("pcs"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("products_barcode_idx").on(table.barcode),
    index("products_category_idx").on(table.categoryId),
  ]
);

export const productsRelations = relations(productsTable, ({ one }) => ({
  categoryRef: one(categoriesTable, {
    fields: [productsTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
