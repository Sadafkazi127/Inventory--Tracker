import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { AppError } from "../lib/AppError";
import type { CustomerInput } from "../schemas/customer.schema";

export async function listCustomers() {
  return db.select().from(customersTable).orderBy(customersTable.name);
}

export async function getCustomer(id: string) {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  if (!customer) throw new AppError(404, "Customer not found");
  return customer;
}

export async function createCustomer(data: CustomerInput) {
  const id = generateId();
  await db.insert(customersTable).values({
    id,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
  });
  return getCustomer(id);
}

export async function updateCustomer(id: string, changes: Partial<CustomerInput>) {
  await getCustomer(id);
  await db.update(customersTable).set(changes).where(eq(customersTable.id, id));
  return getCustomer(id);
}

export async function deleteCustomer(id: string) {
  await getCustomer(id);
  await db.delete(customersTable).where(eq(customersTable.id, id));
}
