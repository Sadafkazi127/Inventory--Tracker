import { sql, gte, lte, and } from "drizzle-orm";
import { db, salesTable, saleItemsTable, productsTable, categoriesTable } from "@workspace/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getStats(lowStockThreshold: number) {
  const [productAgg] = await db
    .select({
      totalProducts: sql<number>`count(*)`,
      totalInventoryValue: sql<number>`coalesce(sum(${productsTable.sellingPrice} * ${productsTable.stock}), 0)`,
      lowStockCount: sql<number>`sum(case when ${productsTable.stock} <= ${lowStockThreshold} then 1 else 0 end)`,
    })
    .from(productsTable);

  const [{ totalCategories }] = await db
    .select({ totalCategories: sql<number>`count(*)` })
    .from(categoriesTable);

  const [{ todaysSales }] = await db
    .select({ todaysSales: sql<number>`coalesce(sum(${salesTable.grandTotal}), 0)` })
    .from(salesTable)
    .where(gte(salesTable.createdAt, startOfToday()));

  const [{ monthlySales }] = await db
    .select({ monthlySales: sql<number>`coalesce(sum(${salesTable.grandTotal}), 0)` })
    .from(salesTable)
    .where(gte(salesTable.createdAt, startOfMonth()));

  const [{ totalRevenue }] = await db
    .select({ totalRevenue: sql<number>`coalesce(sum(${salesTable.grandTotal}), 0)` })
    .from(salesTable);

  return {
    totalProducts: Number(productAgg?.totalProducts ?? 0),
    totalCategories: Number(totalCategories ?? 0),
    totalInventoryValue: Number(productAgg?.totalInventoryValue ?? 0),
    todaysSales: Number(todaysSales ?? 0),
    monthlySales: Number(monthlySales ?? 0),
    totalRevenue: Number(totalRevenue ?? 0),
    lowStockCount: Number(productAgg?.lowStockCount ?? 0),
  };
}

export async function getSalesReport(from?: Date, to?: Date) {
  const conditions = [];
  if (from) conditions.push(gte(salesTable.createdAt, from));
  if (to) conditions.push(lte(salesTable.createdAt, to));

  const rows = await db
    .select({
      date: sql<string>`date(${salesTable.createdAt})`,
      total: sql<number>`sum(${salesTable.grandTotal})`,
      count: sql<number>`count(*)`,
    })
    .from(salesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(sql`date(${salesTable.createdAt})`)
    .orderBy(sql`date(${salesTable.createdAt})`);

  return rows.map((r) => ({ date: r.date, total: Number(r.total), count: Number(r.count) }));
}

export async function getTopProducts(limit = 10) {
  const rows = await db
    .select({
      productId: saleItemsTable.productId,
      productName: saleItemsTable.productName,
      quantitySold: sql<number>`sum(${saleItemsTable.quantity})`,
      revenue: sql<number>`sum(${saleItemsTable.total})`,
    })
    .from(saleItemsTable)
    .groupBy(saleItemsTable.productId, saleItemsTable.productName)
    .orderBy(sql`sum(${saleItemsTable.quantity}) desc`)
    .limit(limit);

  return rows.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    quantitySold: Number(r.quantitySold),
    revenue: Number(r.revenue),
  }));
}

export async function getLowStockProducts(threshold: number) {
  return db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.stock} <= ${threshold}`)
    .orderBy(productsTable.stock);
}
