import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "../lib/hash";
import { comparePassword } from "../lib/hash";
import { signToken } from "../lib/jwt";
import { AppError } from "../lib/AppError";
import type { LoginInput } from "../schemas/auth.schema";

export async function login({ username, password }: LoginInput) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Invalid username or password");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid username or password");
  }

  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new AppError(404, "User not found");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, "Current password is incorrect");

  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
}
