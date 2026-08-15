import { eq, sql, desc } from "drizzle-orm";
import {
  db,
  salesTable,
  saleItemsTable,
  productsTable,
  inventoryLogsTable,
  invoiceCounterTable,
} from "@workspace/db";
import { generateId } from "../lib/id";
import { AppError } from "../lib/AppError";
import type { CreateSaleInput } from "../schemas/sale.schema";

export async function listSales() {
  const sales = await db
    .select()
    .from(salesTable)
    .orderBy(desc(salesTable.createdAt));

  const items = await db.select().from(saleItemsTable);

  const itemsBySale = new Map<string, typeof items>();

  for (const item of items) {
    const list = itemsBySale.get(item.saleId) ?? [];
    list.push(item);
    itemsBySale.set(item.saleId, list);
  }

  return sales.map((sale) => ({
    ...sale,
    items: itemsBySale.get(sale.id) ?? [],
  }));
}

export async function getSale(id: string, client: typeof db = db) {
  const [sale] = await client
    .select()
    .from(salesTable)
    .where(eq(salesTable.id, id))
    .limit(1);

  if (!sale) {
    throw new AppError(404, "Sale not found");
  }

  const items = await client
    .select()
    .from(saleItemsTable)
    .where(eq(saleItemsTable.saleId, id));

  return {
    ...sale,
    items,
  };
}

export async function completeSale(input: CreateSaleInput) {
  return db.transaction(async (tx) => {
    // Get products
    const products = await tx.select().from(productsTable);
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate products and stock
    for (const item of input.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new AppError(
          400,
          `Product ${item.productId} not found`
        );
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          400,
          `Not enough stock for ${product.name}`
        );
      }
    }

    // Create sale line items
    const lineItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.sellingPrice);

      return {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    });

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const discountAmount =
      input.discountType === "percent"
        ? (subtotal * input.discount) / 100
        : input.discount;

    const afterDiscount = Math.max(
      0,
      subtotal - discountAmount
    );

    const gstAmount = input.gstEnabled
      ? (afterDiscount * input.gstPercent) / 100
      : 0;

    const grandTotal = afterDiscount + gstAmount;

    // Generate invoice number
    await tx
      .insert(invoiceCounterTable)
      .values({
        id: "1",
        value: 1,
      })
      .onDuplicateKeyUpdate({
        set: {
          value: sql`${invoiceCounterTable.value} + 1`,
        },
      });

    const [{ value: counter }] = await tx
      .select({
        value: invoiceCounterTable.value,
      })
      .from(invoiceCounterTable)
      .where(eq(invoiceCounterTable.id, "1"))
      .limit(1);

    const invoiceNumber = `INV-${String(counter).padStart(5, "0")}`;

    // Generate sale ID
    const saleId = generateId();
    const now = new Date();

    // Insert sale
    await tx.insert(salesTable).values({
      id: saleId,
      invoiceNumber,
      customerId: input.customerId ?? null,
      customerName: input.customerName ?? null,
      subtotal,
      discount: discountAmount,
      discountType: input.discountType,
      gst: gstAmount,
      gstPercent: input.gstPercent,
      grandTotal,
      paymentMethod: input.paymentMethod,
      createdAt: now,
    });

    // Insert sale items
    await tx.insert(saleItemsTable).values(
      lineItems.map((item) => ({
        id: generateId(),
        saleId,
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
    );

    // Update stock + create inventory logs
    const logRows = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;

      const newStock = Math.max(
        0,
        product.stock - item.quantity
      );

      await tx
        .update(productsTable)
        .set({
          stock: newStock,
          updatedAt: now,
        })
        .where(eq(productsTable.id, product.id));

      logRows.push({
        id: generateId(),
        productId: product.id,
        productName: product.name,
        type: "out" as const,
        quantity: item.quantity,
        previousStock: product.stock,
        newStock,
        note: `Sale: ${invoiceNumber}`,
        createdAt: now,
      });
    }

    await tx
      .insert(inventoryLogsTable)
      .values(logRows);

    // Return the sale directly from the transaction
    const [createdSale] = await tx
      .select()
      .from(salesTable)
      .where(eq(salesTable.id, saleId))
      .limit(1);

    if (!createdSale) {
      throw new AppError(
        500,
        "Sale was created but could not be retrieved"
      );
    }

    const createdItems = await tx
      .select()
      .from(saleItemsTable)
      .where(eq(saleItemsTable.saleId, saleId));

    return {
      ...createdSale,
      items: createdItems,
    };
  });
}
