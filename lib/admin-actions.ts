"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
