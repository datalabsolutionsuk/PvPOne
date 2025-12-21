"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, organisations, verificationTokens } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function register(
  prevState: any,
  formData: FormData,
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgName = formData.get("orgName") as string;

  if (!email || !password || !name || !orgName) {
    return { error: "Please fill in all fields." };
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "User already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organisation and user in a transaction
    await db.transaction(async (tx) => {
      const [newOrg] = await tx
        .insert(organisations)
        .values({
          name: orgName,
        })
        .returning();

      await tx.insert(users).values({
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: "ClientAdmin", // First user of an org is usually an admin
        organisationId: newOrg.id,
      });
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(verificationToken.identifier, verificationToken.token);

    // Return the token link for development convenience
    const debugLink = `/new-verification?token=${verificationToken.token}`;

    return { success: "Confirmation email sent!", debugLink };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: `Registration failed: ${(error as Error).message}` };
  }
}

export const newVerification = async (token: string) => {
  const existingToken = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, token),
  });

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, existingToken.identifier),
  });

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await db.update(users)
    .set({ 
      emailVerified: new Date(),
      email: existingToken.identifier, // In case user changed email
    })
    .where(eq(users.id, existingUser.id));

  await db.delete(verificationTokens)
    .where(eq(verificationTokens.identifier, existingToken.identifier));

  return { success: "Email verified!" };
};
