"use server";

import { db } from "@/lib/db";
import { varieties, applications, tasks, rulesets, documents, organisations, jurisdictions, ruleDocumentRequirements } from "@/db/schema";
import { auth, signIn } from "@/lib/auth";
import { getCurrentOrganisationId } from "@/lib/context";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RulesEngine } from "@/lib/rules-engine";
import { eq, and } from "drizzle-orm";

export async function createVariety(formData: FormData) {
  const organisationId = await getCurrentOrganisationId();
  if (!organisationId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const species = formData.get("species") as string;
  const varietyType = formData.get("varietyType") as string;
  const breederReference = formData.get("breederReference") as string;

  await db.insert(varieties).values({
    organisationId,
    name,
    species,
    varietyType,
    breederReference,
  });

  revalidatePath("/dashboard/varieties");
  redirect("/dashboard/varieties");
}

export async function createApplication(formData: FormData) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  
  if (!organisationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const varietyId = formData.get("varietyId") as string;
  const jurisdictionId = formData.get("jurisdictionId") as string;
  const filingDateStr = formData.get("filingDate") as string;
  const filingDate = filingDateStr ? new Date(filingDateStr) : new Date();

  // 1. Create Application
  const [app] = await db
    .insert(applications)
    .values({
      organisationId,
      varietyId,
      jurisdictionId,
      status: "Filed", // Assuming we are filing immediately for MVP flow
      filingDate: filingDate,
    })
    .returning();

  // 2. Trigger Rules Engine
  await RulesEngine.generateTasksForApplication(app.id, "FILING_DATE");

  // 3. Log Rule Execution
  await RulesEngine.logExecution(
    organisationId,
    session.user.id,
    "APPLICATION_CREATED",
    { varietyId, jurisdictionId, filingDate },
    { applicationId: app.id }
  );

  revalidatePath("/dashboard/applications");
  redirect(`/dashboard/applications/${app.id}`);
}

export async function updateApplication(formData: FormData) {
  const session = await auth();
  if (!session?.user?.organisationId) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const varietyId = formData.get("varietyId") as string;
  const jurisdictionId = formData.get("jurisdictionId") as string;
  const filingDateStr = formData.get("filingDate") as string;
  const status = formData.get("status") as any;
  const filingDate = filingDateStr ? new Date(filingDateStr) : null;

  await db
    .update(applications)
    .set({
      varietyId,
      jurisdictionId,
      filingDate,
      status,
    })
    .where(and(eq(applications.id, id), eq(applications.organisationId, session.user.organisationId)));

  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${id}`);
  redirect(`/dashboard/applications/${id}`);
}

export async function completeTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.organisationId) {
    throw new Error("Unauthorized");
  }

  const taskId = formData.get("taskId") as string;
  const file = formData.get("file") as File;

  if (file && file.size > 0) {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only PDF, Word, and Excel documents are allowed.");
    }
  }
  
  // In a real app, we would handle the file upload here (upload to S3/Blob storage)
  // and save the file record in the `documents` table.
  // For this MVP, we just mark the task as completed.

  await db
    .update(tasks)
    .set({
      status: "COMPLETED",
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/applications"); // To update the list in app details
  redirect(`/dashboard/tasks/${taskId}`);
}

export async function updateVariety(formData: FormData) {
  const session = await auth();
  if (!session?.user?.organisationId) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const species = formData.get("species") as string;
  const varietyType = formData.get("varietyType") as string;
  const breederReference = formData.get("breederReference") as string;

  await db
    .update(varieties)
    .set({
      name,
      species,
      varietyType,
      breederReference,
    })
    .where(and(eq(varieties.id, id), eq(varieties.organisationId, session.user.organisationId)));

  revalidatePath("/dashboard/varieties");
  redirect("/dashboard/varieties");
}

export async function createJurisdiction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const currencyCode = formData.get("currencyCode") as string;

  await db.insert(jurisdictions).values({
    code,
    name,
    currencyCode,
  });

  revalidatePath("/dashboard/jurisdictions");
  redirect("/dashboard/jurisdictions");
}

export async function createRuleset(formData: FormData) {
  const session = await auth();
  // Check admin role if needed, for now just check auth
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const jurisdictionId = formData.get("jurisdictionId") as string;
  const name = formData.get("name") as string;
  const version = formData.get("version") as string;
  const isActive = formData.get("isActive") === "on";

  await db.insert(rulesets).values({
    jurisdictionId,
    name,
    version,
    isActive,
  });

  revalidatePath(`/dashboard/jurisdictions/${jurisdictionId}`);
  redirect(`/dashboard/jurisdictions/${jurisdictionId}`);
}

export async function updateRuleset(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const version = formData.get("version") as string;
  const isActive = formData.get("isActive") === "on";

  const [ruleset] = await db
    .update(rulesets)
    .set({
      name,
      version,
      isActive,
    })
    .where(eq(rulesets.id, id))
    .returning();

  revalidatePath(`/dashboard/jurisdictions/${ruleset.jurisdictionId}`);
  redirect(`/dashboard/jurisdictions/${ruleset.jurisdictionId}`);
}

export async function createRuleDocumentRequirement(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const rulesetId = formData.get("rulesetId") as string;
  const docType = formData.get("docType") as string;
  const requiredBool = formData.get("requiredBool") === "on";
  const notes = formData.get("notes") as string;

  await db.insert(ruleDocumentRequirements).values({
    rulesetId,
    docType,
    requiredBool,
    notes,
  });

  revalidatePath(`/dashboard/rulesets/${rulesetId}`);
}

export async function updateRuleDocumentRequirement(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const rulesetId = formData.get("rulesetId") as string;
  const docType = formData.get("docType") as string;
  const requiredBool = formData.get("requiredBool") === "on";
  const notes = formData.get("notes") as string;

  await db
    .update(ruleDocumentRequirements)
    .set({
      docType,
      requiredBool,
      notes,
    })
    .where(eq(ruleDocumentRequirements.id, id));

  revalidatePath(`/dashboard/rulesets/${rulesetId}`);
}

export async function deleteRuleDocumentRequirement(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const rulesetId = formData.get("rulesetId") as string;

  await db.delete(ruleDocumentRequirements).where(eq(ruleDocumentRequirements.id, id));

  revalidatePath(`/dashboard/rulesets/${rulesetId}`);
}

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  if (!organisationId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const file = formData.get("file") as File;

  if (file) {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only PDF, Word, and Excel documents are allowed.");
    }
  }

  // In a real app, we would handle the file upload here.
  // For MVP, we'll just simulate it.
  const storagePath = `uploads/${Date.now()}_${name}`;

  await db.insert(documents).values({
    organisationId,
    name,
    type,
    storagePath,
    uploadedBy: session?.user?.id,
  });

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
}

// --- Admin Actions ---

export async function createOrganisation(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;

  await db.insert(organisations).values({
    name,
  });

  revalidatePath("/dashboard/admin/organisations");
  redirect("/dashboard/admin/organisations");
}

export async function updateOrganisation(id: string, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;

  await db
    .update(organisations)
    .set({ name })
    .where(eq(organisations.id, id));

  revalidatePath("/dashboard/admin/organisations");
  redirect("/dashboard/admin/organisations");
}

export async function deleteOrganisation(id: string) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized");
  }

  await db.delete(organisations).where(eq(organisations.id, id));

  revalidatePath("/dashboard/admin/organisations");
}

// --- Impersonation Actions ---

import { cookies } from "next/headers";

export async function switchOrganisation(orgId: string) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    throw new Error("Unauthorized");
  }

  cookies().set("admin_org_context", orgId, { secure: true });
  redirect("/dashboard");
}

export async function exitOrganisationView() {
  cookies().delete("admin_org_context");
  redirect("/dashboard/admin/organisations");
}

