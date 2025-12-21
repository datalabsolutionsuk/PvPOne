import "dotenv/config";
import { db } from "@/lib/db";
import {
  organisations,
  users,
  varieties,
  applications,
  jurisdictions,
} from "@/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

// dotenv.config({ path: ".env" });

async function main() {
  console.log("Seeding clients...");

  // Get existing jurisdictions
  const allJurisdictions = await db.select().from(jurisdictions);
  if (allJurisdictions.length === 0) {
    console.error("No jurisdictions found. Run seed.ts first.");
    process.exit(1);
  }
  const egJurisdiction = allJurisdictions.find((j) => j.code === "EG") || allJurisdictions[0];

  // Client 1: Green Thumb Nurseries
  const [client1] = await db
    .insert(organisations)
    .values({
      name: "Green Thumb Nurseries",
    })
    .returning();
  console.log("Created Client:", client1.name);

  const hashedPassword = await hash("password123", 10);
  await db.insert(users).values({
    id: crypto.randomUUID(),
    name: "Alice Green",
    email: "alice@greenthumb.com",
    password: hashedPassword,
    role: "ClientAdmin",
    organisationId: client1.id,
  });

  // Varieties for Client 1
  const [v1] = await db
    .insert(varieties)
    .values({
      organisationId: client1.id,
      name: "Sunny Delight",
      species: "Helianthus annuus",
      varietyType: "Ornamental",
      breederReference: "GT-SUN-001",
    })
    .returning();

  const [v2] = await db
    .insert(varieties)
    .values({
      organisationId: client1.id,
      name: "Royal Blue",
      species: "Vitis vinifera",
      varietyType: "Vine",
      breederReference: "GT-VIN-002",
    })
    .returning();

  // Applications for Client 1
  await db.insert(applications).values([
    {
      organisationId: client1.id,
      varietyId: v1.id,
      jurisdictionId: egJurisdiction.id,
      status: "Filed",
      filingDate: new Date("2023-01-15"),
      applicationNumber: "EG-2023-001",
    },
    {
      organisationId: client1.id,
      varietyId: v2.id,
      jurisdictionId: egJurisdiction.id,
      status: "DUS",
      filingDate: new Date("2023-03-20"),
      applicationNumber: "EG-2023-045",
    },
  ]);

  // Client 2: Global Seeds Corp
  const [client2] = await db
    .insert(organisations)
    .values({
      name: "Global Seeds Corp",
    })
    .returning();
  console.log("Created Client:", client2.name);

  await db.insert(users).values({
    id: crypto.randomUUID(),
    name: "Bob Seeds",
    email: "bob@globalseeds.com",
    password: hashedPassword,
    role: "ClientAdmin",
    organisationId: client2.id,
  });

  // Varieties for Client 2
  const [v3] = await db
    .insert(varieties)
    .values({
      organisationId: client2.id,
      name: "Mega Wheat 5000",
      species: "Triticum aestivum",
      varietyType: "Field Crop",
      breederReference: "GS-WHT-5000",
    })
    .returning();

  // Applications for Client 2
  await db.insert(applications).values([
    {
      organisationId: client2.id,
      varietyId: v3.id,
      jurisdictionId: egJurisdiction.id,
      status: "Certificate_Issued",
      filingDate: new Date("2022-05-10"),
      applicationNumber: "EG-2022-102",
      publicationDate: new Date("2022-08-15"),
    },
  ]);

  console.log("Seeding clients completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
