"use server";

import { db } from "@/lib/db";
import { varieties, applications, tasks, rulesets, documents, organisations, jurisdictions, ruleDocumentRequirements, queries, messages } from "@/db/schema";
import { auth, signIn } from "@/lib/auth";
import { getCurrentOrganisationId } from "@/lib/context";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RulesEngine } from "@/lib/rules-engine";
import { eq, and, sql, asc, desc } from "drizzle-orm";

async function saveUploadedFile(file: File, orgId: string, appId: string, userId: string, type: string = "DUS_REPORT") {
  try {
    if (!file || file.size === 0) return;

    console.log(`Processing upload for file: ${file.name}, Size: ${file.size}, Type: ${file.type}, DocType: ${type}`);
    
    // Check for user ID which is required by foreign key
    if (!userId) {
        console.error("saveUploadedFile: Missing userId");
    }

    // Convert file to Base64 Data URI for storage in DB
    // This avoids writing to Read-Only file systems (like Vercel)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    const storagePath = `data:${mimeType};base64,${base64}`;

    // Database Operations
    try {
        console.log(`Inserting document metadata into DB. Org: ${orgId}, App: ${appId}, User: ${userId}`);
        await db.insert(documents).values({
          organisationId: orgId,
          applicationId: appId,
          name: file.name,
          type: type,
          storagePath, // Storing Data URI directly
          uploadedBy: userId || null, 
          updatedBy: userId || null,
        });
        console.log("Document DB insert successful.");
    } catch (dbError) {
        console.error("Database Error in saveUploadedFile:", dbError);
        throw new Error("Failed to save document metadata to database: " + (dbError as Error).message);
    }

  } catch (error) {
    console.error("Critical Error in saveUploadedFile:", error);
    throw error;
  }
}

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

  let varietyId = formData.get("varietyId") as string;
  const isNewVariety = formData.get("isNewVariety") === "true";

  if (isNewVariety) {
    const newVarietyName = formData.get("newVarietyName") as string;
    const newVarietySpecies = formData.get("newVarietySpecies") as string;

    if (!newVarietyName || !newVarietySpecies) {
      throw new Error("Variety Name and Species are required for new varieties");
    }

    const [newVariety] = await db.insert(varieties).values({
      organisationId,
      name: newVarietyName,
      species: newVarietySpecies,
      varietyType: "Unknown", // Default or add field to form if needed
    }).returning();

    varietyId = newVariety.id;
  }

  const jurisdictionId = formData.get("jurisdictionId") as string;
  const filingDateStr = formData.get("filingDate") as string;
  const initialStatus = (formData.get("initialStatus") as any) || "Filed";
  const dusStatus = formData.get("dusStatus") as "Waiting" | "Approved" | undefined;
  const dusExpectedDateStr = formData.get("dusExpectedDate") as string;
  const grantDateStr = formData.get("grantDate") as string;
  const expiryDateStr = formData.get("expiryDate") as string;
  
  const filingDate = filingDateStr ? new Date(filingDateStr) : new Date();
  const grantDate = grantDateStr ? new Date(grantDateStr) : undefined;
  const expiryDate = expiryDateStr ? new Date(expiryDateStr) : undefined;
  
  // Generate Application Number: ClientName-4DigitNumber-Year
  // 1. Get Organisation Name
  const [org] = await db.select().from(organisations).where(eq(organisations.id, organisationId));
  const clientName = org?.name?.replace(/\s+/g, "_").toUpperCase() || "UNKNOWN";
  
  // 2. Get Count of Applications for this Org to generate sequence
  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(eq(applications.organisationId, organisationId));
  
  const sequence = Number(countRes.count) + 1;
  const sequenceStr = sequence.toString().padStart(4, "0");
  const year = filingDate.getFullYear();
  
  const generatedAppNumber = `${clientName}_${sequenceStr}_${year}`;

  // 1. Create Application
  const [app] = await db
    .insert(applications)
    .values({
      organisationId,
      varietyId,
      jurisdictionId,
      status: initialStatus,
      filingDate: filingDate,
      applicationNumber: generatedAppNumber,
      dusStatus: dusStatus || undefined,
      dusExpectedReceiptDate: dusExpectedDateStr ? new Date(dusExpectedDateStr) : undefined,
      grantDate,
      expiryDate,
    })
    .returning();

  // Handle DUS File Upload
  const dusFile = formData.get("dusFile") as File;
  if (dusFile && dusFile.size > 0) {
     await saveUploadedFile(dusFile, organisationId, app.id, session.user.id, "DUS_REPORT");
  }

  // Handle Certificate Upload
  const certificateFiles = formData.getAll("certificateFile") as File[];
  for (const file of certificateFiles) {
     if (file && file.size > 0) {
        await saveUploadedFile(file, organisationId, app.id, session.user.id, "PBR_CERTIFICATE");
     }
  }


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
  try {
    const session = await auth();
    console.log("updateApplication: Session retrieved", session?.user?.id);

    if (!session?.user?.organisationId) {
      console.error("updateApplication: Unauthorized - missing organisationId");
      throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    const varietyId = formData.get("varietyId") as string;
    const jurisdictionId = formData.get("jurisdictionId") as string;
    const status = formData.get("status") as any;
    const dusStatus = formData.get("dusStatus") as any;
    const dusExpectedDateStr = formData.get("dusExpectedDate") as string;
    const filingDateStr = formData.get("filingDate") as string;
    const applicationNumber = formData.get("applicationNumber") as string;
    const grantDateStr = formData.get("grantDate") as string;
    const expiryDateStr = formData.get("expiryDate") as string;
    
    const filingDate = filingDateStr ? new Date(filingDateStr) : null;
    const dusExpectedReceiptDate = dusExpectedDateStr ? new Date(dusExpectedDateStr) : null;
    const grantDate = grantDateStr ? new Date(grantDateStr) : null;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
    
    const redirectTo = formData.get("redirectTo") as string;

    console.log(`Updating application ${id}. Status: ${status}, DUS Status: ${dusStatus}`);

    await db
      .update(applications)
      .set({
        varietyId,
        jurisdictionId,
        filingDate,
        applicationNumber: applicationNumber || null,
        status,
        dusStatus: dusStatus || undefined,
        dusExpectedReceiptDate: dusExpectedDateStr ? dusExpectedReceiptDate : undefined,
        grantDate,
        expiryDate,
      })
      .where(and(eq(applications.id, id), eq(applications.organisationId, session.user.organisationId)));

    console.log("Application record updated.");

    const dusFile = formData.get("dusFile") as File;
    if (dusFile && dusFile.size > 0) {
        console.log("Found DUS file to upload.");
        await saveUploadedFile(dusFile, session.user.organisationId, id, session.user.id!, "DUS_REPORT");
    } else {
        console.log("No DUS file to upload or file is empty.");
    }

    const certificateFiles = formData.getAll("certificateFile") as File[];
    if (certificateFiles.length > 0) {
        console.log(`Found ${certificateFiles.length} Certificate files to upload.`);
        for (const file of certificateFiles) {
            if (file && file.size > 0) {
                await saveUploadedFile(file, session.user.organisationId, id, session.user.id!, "PBR_CERTIFICATE");
            }
        }
    }

    revalidatePath("/dashboard/applications");
    revalidatePath(`/dashboard/applications/${id}`);

    if (redirectTo) {
      console.log(`Redirecting to ${redirectTo}`);
      // redirect throws an error that Next.js catches to handle the redirect. 
      // We must let it propagate or return here.
      // But we are inside a try-catch, so we need to be careful.
    }
  } catch (error) {
    if ((error as any).message === "NEXT_REDIRECT") {
       throw error;
    }
    console.error("Error in updateApplication:", error);
    throw new Error("Failed to update application: " + (error as any).message);
  }
  
  // Handling redirect outside try/catch to avoid catching the NEXT_REDIRECT error
  // But we need to access 'redirectTo' variable. 
  // Let's refactor to extract variables first or just rely on form access again?
  // Better to move the logic inside but rethrow redirect error specifically.

  const redirectTo = formData.get("redirectTo") as string;
  const id = formData.get("id") as string;

  if (redirectTo) {
    redirect(redirectTo);
  }
  
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

export async function deleteTask(formData: FormData) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";

  if (!session?.user || (!organisationId && !isSuper)) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const applicationId = formData.get("applicationId") as string;

  // Verify ownership
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { application: true }
  });
  
  if (!task) return;
  
  if (!isSuper && task.application.organisationId !== organisationId) {
     throw new Error("Unauthorized");
  }
  
  await db.delete(tasks).where(eq(tasks.id, id));

  revalidatePath(`/dashboard/applications/${applicationId}`);
}

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  let organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";

  if (!session?.user || (!organisationId && !isSuper)) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const file = formData.get("file") as File;
  let taskId = formData.get("taskId") as string | null;
  const applicationId = formData.get("applicationId") as string | null;
  const owner = formData.get("owner") as string;

  // If Super Admin and no org context, derive it
  if (isSuper && !organisationId) {
     if (taskId) {
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
            with: { application: true }
        });
        if (task) organisationId = task.application.organisationId;
     } else if (applicationId) {
        const app = await db.query.applications.findFirst({
            where: eq(applications.id, applicationId)
        });
        if (app) organisationId = app.organisationId;
     }
     
     if (!organisationId) throw new Error("Could not determine organisation context");
  }

  if (file) {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png"
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only PDF, Word, Excel, and Images (JPG, PNG) are allowed.");
    }
  }

  // If uploaded directly to an application (no task), create a completed task for it
  if (applicationId && !taskId) {
     const [newTask] = await db.insert(tasks).values({
        applicationId,
        title: name,
        type: "DOCUMENT",
        status: "COMPLETED",
        dueDate: new Date(),
        owner: owner,
     }).returning({ id: tasks.id });
     taskId = newTask.id;
  }

  // In a real app, we would handle the file upload here.
  // For MVP, we'll just simulate it.
  const storagePath = `uploads/${Date.now()}_${name}`;

  await db.insert(documents).values({
    organisationId: organisationId as string,
    name,
    type,
    storagePath,
    uploadedBy: session?.user?.id,
    taskId: taskId || null,
    applicationId: applicationId || null,
    owner: owner,
  });

  if (taskId) {
    revalidatePath(`/dashboard/tasks/${taskId}`);
  }
  
  if (applicationId) {
    revalidatePath(`/dashboard/applications/${applicationId}`);
    redirect(`/dashboard/applications/${applicationId}`);
  } else if (taskId) {
    redirect(`/dashboard/tasks/${taskId}`);
  } else {
    revalidatePath("/dashboard/documents");
    redirect("/dashboard/documents");
  }
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

export async function createTask(formData: FormData) {
  const session = await auth();
  let organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";

  if (!session?.user || (!organisationId && !isSuper)) {
    throw new Error("Unauthorized");
  }

  const applicationId = formData.get("applicationId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("dueDate") as string;
  const type = formData.get("type") as string;

  if (!applicationId || !title || !type) {
    throw new Error("Missing required fields");
  }

  // Verify application belongs to organisation
  const application = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (!isSuper && application.organisationId !== organisationId) {
    throw new Error("Unauthorized");
  }

  // If Super Admin and no org context, use application's org
  if (isSuper && !organisationId) {
    organisationId = application.organisationId;
  }

  const file = formData.get("file") as File;
  let status = "PENDING";
  let taskId: string | undefined;

  const [newTask] = await db.insert(tasks).values({
    applicationId,
    title,
    description,
    dueDate: dueDateStr ? new Date(dueDateStr) : null,
    type,
    status: "PENDING", // Will update if file is uploaded
  }).returning({ id: tasks.id });
  
  taskId = newTask.id;

  if (type === "DOCUMENT" && file && file.size > 0) {
    // Reuse the upload logic
    // We need to create a new FormData to pass to uploadDocument, or extract the logic.
    // Since uploadDocument takes FormData, let's just call the logic directly here or refactor.
    // Refactoring is cleaner but for now let's inline the upload logic to avoid breaking existing uploadDocument signature if it changes.
    
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png"
    ];

    if (!validTypes.includes(file.type)) {
      // If invalid file, we just don't upload it but task is created? 
      // Or throw error? Throwing error rolls back transaction if we had one.
      // For now, let's just ignore invalid file or throw.
      // Throwing is better UX so user knows it failed.
      // But we already created the task.
      // Ideally we should wrap in transaction.
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      const storagePath = `data:${mimeType};base64,${base64}`;
      
      try {
        await db.insert(documents).values({
          organisationId: organisationId as string,
          applicationId,
          taskId: taskId,
          name: file.name,
          type: title, // Use task title as document type
          storagePath,
          uploadedBy: session.user.id,
        });

        // Update task status to COMPLETED
        await db.update(tasks)
          .set({ status: "COMPLETED" })
          .where(eq(tasks.id, taskId));
          
        status = "COMPLETED";
      } catch (error) {
        console.error("File upload failed during task creation:", error);
        // Task remains PENDING
      }
    }
  }

  revalidatePath(`/dashboard/applications/${applicationId}`);
  redirect(`/dashboard/applications/${applicationId}`);
}

export async function updateTask(formData: FormData) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";

  if (!session?.user || (!organisationId && !isSuper)) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("dueDate") as string;
  const status = formData.get("status") as string;
  const owner = formData.get("owner") as string;

  // Verify task belongs to organisation
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      application: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (!isSuper && task.application.organisationId !== organisationId) {
    throw new Error("Unauthorized");
  }

  await db.update(tasks).set({
    title,
    description,
    dueDate: dueDateStr ? new Date(dueDateStr) : null,
    status,
    owner,
    updatedAt: new Date(),
  }).where(eq(tasks.id, id));

  revalidatePath(`/dashboard/applications/${task.applicationId}`);
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath(`/dashboard/tasks`);
  redirect(`/dashboard/tasks/${id}`);
}

export async function updateDocument(formData: FormData) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";

  if (!session?.user || (!organisationId && !isSuper)) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const owner = formData.get("owner") as string;

  // Verify document belongs to organisation
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });

  if (!doc) {
    throw new Error("Document not found");
  }

  if (!isSuper && doc.organisationId !== organisationId) {
    throw new Error("Unauthorized");
  }

  await db.update(documents).set({
    name,
    type,
    owner,
    updatedBy: session.user.id,
    updatedAt: new Date(),
  }).where(eq(documents.id, id));

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents");
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

export async function createQuery(applicationId: string, title: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [newQuery] = await db.insert(queries).values({
    applicationId,
    title,
    createdBy: session.user.id,
  }).returning();

  await db.insert(messages).values({
    queryId: newQuery.id,
    content,
    senderId: session.user.id,
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  return newQuery;
}

export async function replyToQuery(queryId: string, content: string, applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      queryId,
      content,
      senderId: session.user.id,
    });

    await tx.update(queries)
      .set({ updatedAt: new Date() })
      .where(eq(queries.id, queryId));
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
}

export async function getApplicationQueries(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const appQueries = await db.query.queries.findMany({
    where: eq(queries.applicationId, applicationId),
    with: {
      creator: true,
      messages: {
        orderBy: [asc(messages.createdAt)],
        with: {
          sender: true
        }
      }
    },
    orderBy: [desc(queries.updatedAt)] // Sort by recently updated
  });

  // Serialize dates for client components
  return appQueries.map(q => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    messages: q.messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    }))
  }));
}

export async function getDashboardQueries(page: number = 1, limit: number = 5) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const organisationId = await getCurrentOrganisationId();
  
  const queriesConditions = [];
  if (organisationId) {
    queriesConditions.push(eq(applications.organisationId, organisationId));
  }

  const recentQueries = await db
    .select({
      query: queries,
      application: applications,
    })
    .from(queries)
    .innerJoin(applications, eq(queries.applicationId, applications.id))
    .where(and(...queriesConditions))
    .orderBy(desc(queries.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return recentQueries.map(({ query, application }) => ({
    query: {
      ...query,
      createdAt: query.createdAt.toISOString(),
      updatedAt: query.updatedAt.toISOString(),
    },
    application
  }));
}

