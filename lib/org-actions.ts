"use server";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentOrganisationId } from "@/lib/context";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function createOrgUser(formData: FormData) {
  try {
    const session = await auth();
    const organisationId = await getCurrentOrganisationId();

    if (!session?.user || !organisationId) {
      return { success: false, error: "Unauthorized" };
    }

    // Only Admins can create users
    if (!["SuperAdmin", "LawyerAdmin", "ClientAdmin"].includes(session.user.role)) {
       return { success: false, error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as any;

    const validRoles = ["SuperAdmin", "LawyerAdmin", "ClientAdmin", "ClientUser", "ReadOnly"];
    if (!validRoles.includes(role)) {
       return { success: false, error: "Invalid role selected" };
    }

    // Basic validation
    if (!email || !password || !role) {
       return { success: false, error: "Missing required fields" };
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
       return { success: false, error: "User with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      id: randomUUID(),
      name,
      email,
      password: hashedPassword,
      role,
      organisationId,
      emailVerified: new Date(),
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("createOrgUser error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateOrgUser(formData: FormData) {
  try {
    const session = await auth();
    const organisationId = await getCurrentOrganisationId();

    if (!session?.user || !organisationId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!["SuperAdmin", "LawyerAdmin", "ClientAdmin"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as any;

    // Ensure user belongs to the same organisation
    const targetUser = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.organisationId, organisationId)),
    });

    if (!targetUser) {
       return { success: false, error: "User not found or unauthorized" };
    }

    const updateData: any = {
      name,
      email,
      role,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("updateOrgUser error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteOrgUser(id: string) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();

  if (!session?.user || !organisationId) {
    throw new Error("Unauthorized");
  }

  if (!["SuperAdmin", "LawyerAdmin", "ClientAdmin"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  // Ensure user belongs to the same organisation
  const targetUser = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.organisationId, organisationId)),
  });

  if (!targetUser) {
    throw new Error("User not found or unauthorized");
  }

  // Prevent deleting yourself
  if (targetUser.id === session.user.id) {
    throw new Error("Cannot delete your own account");
  }

  await db.delete(users).where(eq(users.id, id));

  revalidatePath("/dashboard/users");
}
