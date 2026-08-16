import { mysqlTable, varchar, decimal, int, boolean } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Single-row table (id is always "1") holding shop-wide configuration
export const shopSettingsTable = mysqlTable("shop_settings", {
  id: varchar("id", { length: 8 }).primaryKey().default("1"),
  name: varchar("name", { length: 150 }).notNull().default("My Shop"),
  address: varchar("address", { length: 255 }).notNull().default(""),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  email: varchar("email", { length: 150 }).notNull().default(""),
  gstNumber: varchar("gst_number", { length: 30 }).notNull().default(""),
  currency: varchar("currency", { length: 5 }).notNull().default("\u20B9"),
  gstEnabled: boolean("gst_enabled").notNull().default(false),
  gstPercent: decimal("gst_percent", { precision: 5, scale: 2, mode: "number" }).notNull().default(18),
  lowStockThreshold: int("low_stock_threshold").notNull().default(10),
});

export const insertShopSettingsSchema = createInsertSchema(shopSettingsTable).omit({
  id: true,
});
export type InsertShopSettings = z.infer<typeof insertShopSettingsSchema>;
export type ShopSettings = typeof shopSettingsTable.$inferSelect;
