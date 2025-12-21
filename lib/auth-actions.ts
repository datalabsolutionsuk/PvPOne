"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, organisations, verificationTokens, passwordResetTokens } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { generateVerificationToken, generatePasswordResetToken } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail";

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
        emailVerified: new Date(), // Auto-verify
      });
    });

    // Auto-login after registration
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: "Account created!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    // If it's a redirect error (which signIn throws), rethrow it
    if ((error as Error).message === "NEXT_REDIRECT") {
      throw error;
    }
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

export const resetPassword = async (prevState: any, formData: FormData) => {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!existingUser) {
    return { error: "Email not found!" };
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(passwordResetToken.identifier, passwordResetToken.token);

  return { success: "Reset email sent!" };
};

export const updatePassword = async (prevState: any, formData: FormData) => {
  const password = formData.get("password") as string;
  const token = formData.get("token") as string;

  if (!password || !token) {
    return { error: "Missing fields!" };
  }

  const existingToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });

  if (!existingToken) {
    return { error: "Invalid token!" };
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

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, existingUser.id));

  await db.delete(passwordResetTokens)
    .where(eq(passwordResetTokens.identifier, existingToken.identifier));

  return { success: "Password updated!" };
};
