"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function cancelSubscription(subscriptionId: string) {
  const session = await auth();
  if (!session?.user?.organisationId) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
  });

  if (!sub || sub.organisationId !== session.user.organisationId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(subscriptions)
    .set({ status: "canceled", endDate: new Date() })
    .where(eq(subscriptions.id, subscriptionId));

  revalidatePath("/dashboard/subscription");
}

export async function upgradeSubscription(plan: string) {
  // Mock upgrade logic
  const session = await auth();
  if (!session?.user?.organisationId) {
    throw new Error("Unauthorized");
  }

  // In a real app, this would create a checkout session
  console.log(`Upgrading org ${session.user.organisationId} to ${plan}`);
  
  // For now, just update the DB to simulate
  await db
    .update(subscriptions)
    .set({ plan: plan, status: "active" })
    .where(eq(subscriptions.organisationId, session.user.organisationId));

  revalidatePath("/dashboard/subscription");
}
