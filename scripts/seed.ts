import { db } from "@/lib/db";
import {
  organisations,
  users,
  jurisdictions,
  rulesets,
  ruleDeadlines,
  ruleTerms,
  ruleDocumentRequirements,
  varieties,
  applications,
} from "@/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function main() {
  console.log("Seeding database...");

  // 1. Create Organisation
  const [org] = await db
    .insert(organisations)
    .values({
      name: "PVP Law Firm",
    })
    .returning();
  console.log("Created Organisation:", org.name);

  // 2. Create Lawyer Admin
  const hashedPassword = await hash("password123", 10);
  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name: "Lawyer Admin",
      email: "admin@pvp.one",
      password: hashedPassword,
      role: "LawyerAdmin",
      organisationId: org.id,
    })
    .returning();
  console.log("Created User:", user.email);

  // 2.1 Create Super Admin
  const [superAdmin] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name: "Super Admin",
      email: "superadmin@pvp.one",
      password: hashedPassword,
      role: "SuperAdmin",
      // Super Admin might not belong to a specific organisation, or belongs to the main one.
      // For now, let's assign to the same org or leave null if schema allows.
      // Schema says organisationId references organisations.id, but doesn't say notNull().
      // Let's check schema again.
      organisationId: org.id, 
    })
    .returning();
  console.log("Created Super Admin:", superAdmin.email);

  // 3. Create Jurisdiction: Egypt
  const [egJurisdiction] = await db
    .insert(jurisdictions)
    .values({
      code: "EG",
      name: "Egypt",
      currencyCode: "EGP",
    })
    .returning();
  console.log("Created Jurisdiction:", egJurisdiction.name);

  // 4. Create Ruleset: Egypt v1
  const [egRuleset] = await db
    .insert(rulesets)
    .values({
      jurisdictionId: egJurisdiction.id,
      name: "Egypt v1",
      version: "1.0.0",
      isActive: true,
    })
    .returning();
  console.log("Created Ruleset:", egRuleset.name);

  // 5. Create Rule Deadlines
  await db.insert(ruleDeadlines).values([
    {
      rulesetId: egRuleset.id,
      triggerEvent: "FILING_DATE",
      offsetDays: 120, // 4 months
      appliesWhenJson: { description: "Complete documents within 4 months" },
    },
    {
      rulesetId: egRuleset.id,
      triggerEvent: "PUBLICATION_DATE",
      offsetDays: 60, // 2 months
      appliesWhenJson: { description: "Opposition period" },
    },
  ]);
  console.log("Created Rule Deadlines");

  // 6. Create Rule Terms
  await db.insert(ruleTerms).values([
    {
      rulesetId: egRuleset.id,
      varietyType: "Tree",
      termYears: 25,
    },
    {
      rulesetId: egRuleset.id,
      varietyType: "Vine",
      termYears: 25,
    },
    {
      rulesetId: egRuleset.id,
      varietyType: "Field Crop",
      termYears: 20,
    },
    {
      rulesetId: egRuleset.id,
      varietyType: "Default",
      termYears: 20,
    },
  ]);
  console.log("Created Rule Terms");

  // 7. Create Rule Document Requirements
  const docTypes = [
    { type: "Power of Attorney", required: true },
    { type: "Assignment Deed", required: true },
    { type: "Technical Questionnaire", required: true },
    { type: "Photos", required: true },
    { type: "Novelty Declaration", required: false },
    { type: "Priority Document", required: false },
    { type: "DUS Report", required: false },
    { type: "Seed Sample Receipt", required: true },
  ];

  await db.insert(ruleDocumentRequirements).values(
    docTypes.map((d) => ({
      rulesetId: egRuleset.id,
      docType: d.type,
      requiredBool: d.required,
    }))
  );
  console.log("Created Rule Document Requirements");

  // 8. Create Dummy Data for Dashboard
  // Create a Variety
  const [variety] = await db
    .insert(varieties)
    .values({
      organisationId: org.id,
      name: "Red Star Rose",
      species: "Rosa L.",
      varietyType: "Tree", // Should match rule term
      breederReference: "RSR-001",
    })
    .returning();

  // Create an Application
  const filingDate = new Date();
  filingDate.setDate(filingDate.getDate() - 10); // Filed 10 days ago

  await db.insert(applications).values({
    organisationId: org.id,
    varietyId: variety.id,
    jurisdictionId: egJurisdiction.id,
    status: "Filed",
    filingDate: filingDate,
    applicationNumber: "EG-2024-001",
  });
  console.log("Created Dummy Application");

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
