// One-off script to create/reset the admin login.
// Usage: DATABASE_URL=... pnpm run seed:admin -- <username> <password>
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "../src/lib/hash";
import { randomUUID } from "crypto";

async function main() {
  const args = process.argv.slice(2);
if (args[0] === "--") args.shift();

const username = args[0] ?? "admin";
const password = args[1] ?? "admin123";

  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);

  if (existing) {
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, existing.id));
    console.log(`Updated password for existing user "${username}".`);
  } else {
    await db.insert(usersTable).values({
      id: randomUUID(),
      username,
      passwordHash,
      role: "admin",
    });
    console.log(`Created admin user "${username}".`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
