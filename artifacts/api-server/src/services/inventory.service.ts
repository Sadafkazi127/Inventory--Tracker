import { eq, desc } from "drizzle-orm";
import { db, productsTable, inventoryLogsTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { AppError } from "../lib/AppError";
import type { AdjustStockInput } from "../schemas/inventory.schema";

export async function listInventoryLogs() {
  return db.select().from(inventoryLogsTable).orderBy(desc(inventoryLogsTable.createdAt));
}

// Mirrors AppContext.adjustStock: 'in' adds to current stock, 'adjustment' sets an absolute value.
export async function adjustStock(input: AdjustStockInput) {
  return db.transaction(async (tx) => {
    const [product] = await tx
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, input.productId))
      .limit(1);
    if (!product) throw new AppError(404, "Product not found");

    const previousStock = product.stock;
    const newStock = input.type === "in" ? product.stock + input.quantity : Math.max(0, input.quantity);
    const now = new Date();

    await tx.update(productsTable).set({ stock: newStock, updatedAt: now }).where(eq(productsTable.id, product.id));

    const log = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      type: input.type,
      quantity: input.quantity,
      previousStock,
      newStock,
      note: input.note,
      createdAt: now,
    };
    await tx.insert(inventoryLogsTable).values(log);
    return log;
  });
}
