import { db } from "@/lib/db";
import {
  ruleDeadlines,
  ruleDocumentRequirements,
  ruleTerms,
  ruleFees,
  applications,
  documents,
  varieties,
  ruleAuditLog,
  tasks,
  rulesets,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { addDays, addYears } from "date-fns";

export class RulesEngine {
  static async logExecution(
    orgId: string,
    userId: string,
    ruleType: string,
    input: any,
    output: any
  ) {
    try {
      await db.insert(ruleAuditLog).values({
        orgId,
        userId,
        ruleType,
        inputJson: input,
        outputJson: output,
      });
    } catch (e) {
      console.error("Failed to log rule execution", e);
    }
  }

  static async generateTasksForApplication(applicationId: string, triggerEvent: string) {
    const app = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });
    if (!app) throw new Error("Application not found");

    // 1. Find active ruleset
    const ruleset = await db.query.rulesets.findFirst({
      where: and(
        eq(rulesets.jurisdictionId, app.jurisdictionId),
        eq(rulesets.isActive, true)
      ),
    });
    if (!ruleset) return;

    // 2. Get Deadlines for Trigger Event
    const deadlines = await db.query.ruleDeadlines.findMany({
      where: and(
        eq(ruleDeadlines.rulesetId, ruleset.id),
        eq(ruleDeadlines.triggerEvent, triggerEvent)
      ),
    });

    // 3. Create Tasks
    const newTasks = deadlines.map((rule) => {
      const baseDate = app.filingDate || new Date(); // Should depend on trigger event type
      const dueDate = addDays(baseDate, rule.offsetDays);
      const description = (rule.appliesWhenJson as any)?.description || "Deadline";

      return {
        applicationId,
        title: description,
        dueDate,
        type: "DEADLINE",
        status: "PENDING",
      };
    });

    if (newTasks.length > 0) {
      await db.insert(tasks).values(newTasks);
    }

    // 4. Check Document Requirements (if trigger is FILING_DATE)
    if (triggerEvent === "FILING_DATE") {
      const requirements = await db.query.ruleDocumentRequirements.findMany({
        where: and(
          eq(ruleDocumentRequirements.rulesetId, ruleset.id),
          eq(ruleDocumentRequirements.requiredBool, true)
        ),
      });

      const docTasks = requirements.map((req) => ({
        applicationId,
        title: `Upload ${req.docType}`,
        type: "DOCUMENT",
        status: "PENDING",
        // Deadline for docs is usually the same as the filing deadline, 
        // but let's just set it to the earliest deadline found above or +30 days
        dueDate: newTasks.length > 0 ? newTasks[0].dueDate : addDays(new Date(), 30),
      }));

      if (docTasks.length > 0) {
        await db.insert(tasks).values(docTasks);
      }
    }
  }

  // Compute deadlines for an application based on trigger event
  static async computeDeadlines(applicationId: string, triggerEvent: string, triggerDate: Date) {
    const app = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: {
        jurisdiction: true,
      },
    });

    if (!app) throw new Error("Application not found");

    // Find active ruleset for jurisdiction
    const ruleset = await db.query.rulesets.findFirst({
      where: and(
        eq(rulesets.jurisdictionId, app.jurisdictionId),
        eq(rulesets.isActive, true)
      ),
    });

    if (!ruleset) return [];

    const deadlines = await db.query.ruleDeadlines.findMany({
      where: and(
        eq(ruleDeadlines.rulesetId, ruleset.id),
        eq(ruleDeadlines.triggerEvent, triggerEvent)
      ),
    });

    return deadlines.map((rule) => ({
      ruleId: rule.id,
      deadlineDate: addDays(triggerDate, rule.offsetDays),
      description: (rule.appliesWhenJson as any)?.description || "Deadline",
    }));
  }

  // Check for missing required documents
  static async checkMissingDocuments(applicationId: string) {
    const app = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });
    if (!app) throw new Error("Application not found");

    const ruleset = await db.query.rulesets.findFirst({
      where: and(
        eq(rulesets.jurisdictionId, app.jurisdictionId),
        eq(rulesets.isActive, true)
      ),
    });
    if (!ruleset) return [];

    const requirements = await db.query.ruleDocumentRequirements.findMany({
      where: and(
        eq(ruleDocumentRequirements.rulesetId, ruleset.id),
        eq(ruleDocumentRequirements.requiredBool, true)
      ),
    });

    const uploadedDocs = await db.query.documents.findMany({
      where: eq(documents.applicationId, applicationId),
    });

    const missing = requirements.filter((req) => {
      return !uploadedDocs.some((doc) => doc.type === req.docType);
    });

    return missing;
  }

  // Compute term end date
  static async computeTermEndDate(varietyId: string, jurisdictionId: string, grantDate: Date) {
    const variety = await db.query.varieties.findFirst({
      where: eq(varieties.id, varietyId),
    });
    if (!variety) throw new Error("Variety not found");

    const ruleset = await db.query.rulesets.findFirst({
      where: and(
        eq(rulesets.jurisdictionId, jurisdictionId),
        eq(rulesets.isActive, true)
      ),
    });
    if (!ruleset) return null;

    // Find specific term rule or default
    const termRules = await db.query.ruleTerms.findMany({
      where: eq(ruleTerms.rulesetId, ruleset.id),
    });

    let rule = termRules.find((r) => r.varietyType === variety.varietyType);
    if (!rule) {
      rule = termRules.find((r) => r.varietyType === "Default");
    }

    if (!rule) return null;

    return addYears(grantDate, rule.termYears);
  }
}
