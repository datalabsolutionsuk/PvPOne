
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Dynamically import db to ensure env vars are loaded first
async function main() {
  const { db } = await import("@/lib/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  try {
    const admins = await db.select().from(users).where(eq(users.role, "SuperAdmin"));
    
    const output = admins.map(a => `- ${a.name} (${a.email})`).join("\n");
    const fs = await import("fs");
    fs.writeFileSync("admins.txt", output);
    console.log("Written to admins.txt");
  } catch (error) {
    console.error("Error fetching admins:", error);
  }
  process.exit(0);
}

main();
