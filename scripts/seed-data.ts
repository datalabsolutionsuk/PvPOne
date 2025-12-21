import "dotenv/config";
import { db } from "@/lib/db";
import { organisations, varieties, applications, jurisdictions } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding specific data for organizations...");

  // 1. Get Organizations
  const orgs = await db.select().from(organisations);
  const greenValley = orgs.find((o) => o.name === "Green Valley Seeds");
  const sunnySide = orgs.find((o) => o.name === "Sunny Side Breeders");
  const pvpLaw = orgs.find((o) => o.name === "PVP Law Firm");

  if (!greenValley || !sunnySide) {
    console.error("Target organizations not found. Run seed-users.ts first.");
    return;
  }

  // 2. Get Jurisdiction (Egypt)
  const [eg] = await db.select().from(jurisdictions).where(eq(jurisdictions.code, "EG"));
  if (!eg) {
    console.error("Jurisdiction EG not found.");
    return;
  }

  // 3. Seed Green Valley Data
  console.log("Seeding Green Valley Seeds data...");
  const [gvVariety] = await db
    .insert(varieties)
    .values({
      organisationId: greenValley.id,
      name: "Green Giant Tomato",
      species: "Solanum lycopersicum",
      varietyType: "Vegetable",
      breederReference: "GV-TOM-001",
    })
    .returning();

  await db.insert(applications).values({
    organisationId: greenValley.id,
    varietyId: gvVariety.id,
    jurisdictionId: eg.id,
    status: "Filed",
    filingDate: new Date("2024-01-15"),
    applicationNumber: "EG-2024-001",
  });

  // 4. Seed Sunny Side Data
  console.log("Seeding Sunny Side Breeders data...");
  const [ssVariety] = await db
    .insert(varieties)
    .values({
      organisationId: sunnySide.id,
      name: "Sunny Sunflower",
      species: "Helianthus annuus",
      varietyType: "Ornamental",
      breederReference: "SS-SUN-99",
    })
    .returning();

  await db.insert(applications).values({
    organisationId: sunnySide.id,
    varietyId: ssVariety.id,
    jurisdictionId: eg.id,
    status: "Draft",
    filingDate: new Date("2024-02-20"),
  });

  console.log("Data seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
