
import { db } from "@/lib/db";
import { verificationTokens } from "@/db/schema";
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
