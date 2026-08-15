import { eq } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { AppError } from "../lib/AppError";
import type { ProductInput } from "../schemas/product.schema";

export async function listProducts() {
  return db.select().from(productsTable).orderBy(productsTable.name);
}

export async function getProduct(id: string) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

export async function createProduct(data: ProductInput) {
  const id = generateId();
  await db.insert(productsTable).values({
    id,
    name: data.name,
    category: data.category,
    categoryId: data.categoryId ?? null,
    barcode: data.barcode ?? null,
    purchasePrice: data.purchasePrice,
    sellingPrice: data.sellingPrice,
    stock: data.stock,
    unit: data.unit,
  });
  return getProduct(id);
}

export async function updateProduct(id: string, changes: Partial<ProductInput>) {
  await getProduct(id); // 404s if missing
  await db.update(productsTable).set(changes).where(eq(productsTable.id, id));
  return getProduct(id);
}

export async function deleteProduct(id: string) {
  await getProduct(id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
}

export async function listCategories() {
  return db.select().from(categoriesTable).orderBy(categoriesTable.name);
}

export async function createCategory(name: string) {
  const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.name, name)).limit(1);
  if (existing.length > 0) throw new AppError(409, "A category with this name already exists");
  const id = generateId();
  await db.insert(categoriesTable).values({ id, name });
  return { id, name };
}

export async function deleteCategory(id: string) {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
}
