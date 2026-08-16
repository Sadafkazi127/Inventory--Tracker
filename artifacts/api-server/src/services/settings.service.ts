import { eq } from "drizzle-orm";
import { db, shopSettingsTable } from "@workspace/db";
import type { ShopSettingsInput } from "../schemas/settings.schema";

const DEFAULTS: ShopSettingsInput = {
  name: "My Shop",
  address: "",
  phone: "",
  email: "",
  gstNumber: "",
  currency: "\u20B9",
  gstEnabled: false,
  gstPercent: 18,
  lowStockThreshold: 10,
};

export async function getSettings() {
  const [row] = await db.select().from(shopSettingsTable).where(eq(shopSettingsTable.id, "1")).limit(1);
  if (row) return row;
  // Seed the single settings row on first read
  await db.insert(shopSettingsTable).values({ id: "1", ...DEFAULTS });
  return { id: "1", ...DEFAULTS };
}

export async function updateSettings(data: ShopSettingsInput) {
  await getSettings(); // ensures row exists
  await db.update(shopSettingsTable).set(data).where(eq(shopSettingsTable.id, "1"));
  return getSettings();
}
