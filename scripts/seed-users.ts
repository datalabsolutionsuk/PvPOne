import { db } from "@/lib/db";
import { organisations, users } from "@/db/schema";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
  console.log("Seeding test users...");

  const hashedPassword = await hash("password123", 10);

  // --- Organization A: Green Valley Seeds ---
  const [orgA] = await db
    .insert(organisations)
    .values({
      name: "Green Valley Seeds",
    })
    .returning();
  console.log("Created Organisation:", orgA.name);

  const usersA = [
    {
      name: "Alice Admin",
      email: "client_admin_a@pvp.one",
      role: "ClientAdmin",
    },
    {
      name: "Bob User",
      email: "client_user_a@pvp.one",
      role: "ClientUser",
    },
    {
      name: "Charlie Reader",
      email: "readonly_a@pvp.one",
      role: "ReadOnly",
    },
  ];

  for (const u of usersA) {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name: u.name,
      email: u.email,
      password: hashedPassword,
      role: u.role as any,
      organisationId: orgA.id,
    });
    console.log(`Created User: ${u.email} (${u.role})`);
  }

  // --- Organization B: Sunny Side Breeders ---
  const [orgB] = await db
    .insert(organisations)
    .values({
      name: "Sunny Side Breeders",
    })
    .returning();
  console.log("Created Organisation:", orgB.name);

  const usersB = [
    {
      name: "David Admin",
      email: "client_admin_b@pvp.one",
      role: "ClientAdmin",
    },
    {
      name: "Eve User",
      email: "client_user_b@pvp.one",
      role: "ClientUser",
    },
  ];

  for (const u of usersB) {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name: u.name,
      email: u.email,
      password: hashedPassword,
      role: u.role as any,
      organisationId: orgB.id,
    });
    console.log(`Created User: ${u.email} (${u.role})`);
  }

  console.log("\n--- Test Users Created ---");
  console.log("Password for all users: password123\n");
  
  console.log("Organization: Green Valley Seeds");
  usersA.forEach(u => console.log(`- ${u.email} (${u.role})`));
  
  console.log("\nOrganization: Sunny Side Breeders");
  usersB.forEach(u => console.log(`- ${u.email} (${u.role})`));
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
