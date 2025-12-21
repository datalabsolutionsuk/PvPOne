"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { systemSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function checkSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized: SuperAdmin access required");
  }
}

export async function createUser(formData: FormData) {
  await checkSuperAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as any;
  const organisationId = formData.get("organisationId") as string;

  if (!email || !password || !role) {
    return { error: "Missing required fields" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      role,
      organisationId: organisationId || null,
    });

    revalidatePath("/dashboard/admin/users");
    return { success: "User created successfully" };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Failed to create user" };
  }
}

export async function updateUser(formData: FormData) {
  await checkSuperAdmin();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as any;
  const organisationId = formData.get("organisationId") as string;

  if (!id || !email || !role) {
    return { error: "Missing required fields" };
  }

  const updateData: any = {
    name,
    email,
    role,
    organisationId: organisationId || null,
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  try {
    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath("/dashboard/admin/users");
    return { success: "User updated successfully" };
  } catch (error) {
    console.error("Update user error:", error);
    return { error: "Failed to update user" };
  }
}

export async function deleteUser(id: string) {
  await checkSuperAdmin();

  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/dashboard/admin/users");
    return { success: "User deleted successfully" };
  } catch (error) {
    console.error("Delete user error:", error);
    return { error: "Failed to delete user" };
  }
}

export async function saveSystemSettings(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized");
  }

  const settings = [
    { key: "STRIPE_PUBLIC_KEY", value: formData.get("stripePublicKey") as string },
    { key: "STRIPE_SECRET_KEY", value: formData.get("stripeSecretKey") as string },
    { key: "PAYPAL_CLIENT_ID", value: formData.get("paypalClientId") as string },
    { key: "PAYPAL_CLIENT_SECRET", value: formData.get("paypalClientSecret") as string },
  ];

  for (const setting of settings) {
    if (setting.value) {
      await db
        .insert(systemSettings)
        .values({ key: setting.key, value: setting.value })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: setting.value, updatedAt: new Date() },
        });
    }
  }

  revalidatePath("/dashboard/admin/settings");
}

export async function getSystemSettings() {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized");
  }

  const settings = await db.select().from(systemSettings);
  return settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}
