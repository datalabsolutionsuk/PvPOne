
import { db } from "@/lib/db";
import { verificationTokens, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const generateVerificationToken = async (email: string) => {
  const token = crypto.randomUUID();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, email),
  });

  if (existingToken) {
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));
  }

  const [verificationToken] = await db
    .insert(verificationTokens)
    .values({
      identifier: email,
      token,
      expires,
    })
    .returning();

  return verificationToken;
};

export const generatePasswordResetToken = async (email: string) => {
  const token = crypto.randomUUID();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.identifier, email),
  });

  if (existingToken) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.identifier, email));
  }

  const [passwordResetToken] = await db
    .insert(passwordResetTokens)
    .values({
      identifier: email,
      token,
      expires,
    })
    .returning();

  return passwordResetToken;
};
