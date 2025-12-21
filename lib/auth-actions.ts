"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, organisations } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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
  prevState: string | undefined,
  formData: FormData,
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgName = formData.get("orgName") as string;

  if (!email || !password || !name || !orgName) {
    return "Please fill in all fields.";
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return "User already exists.";
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

    // Attempt to sign in immediately after registration
    // We can't call signIn inside a transaction or try/catch block easily if it redirects
    // So we'll just return success and let the client redirect or ask to login
    
  } catch (error) {
    console.error("Registration error:", error);
    return `Registration failed: ${(error as Error).message}`;
  }
  
  // If we got here, registration was successful. 
  // We can try to sign in, which will throw a redirect error that we shouldn't catch.
  try {
    await signIn("credentials", {
      email,
      password,
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
