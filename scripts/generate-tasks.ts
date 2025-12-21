import "dotenv/config";
import { db } from "@/lib/db";
import { applications, tasks } from "@/db/schema";
import { RulesEngine } from "@/lib/rules-engine";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Generating tasks for existing applications...");

  const allApps = await db.select().from(applications);
  
  for (const app of allApps) {
    // Check if tasks exist
    const existingTasks = await db.query.tasks.findFirst({
      where: eq(tasks.applicationId, app.id),
    });

    if (!existingTasks) {
      console.log(`Generating tasks for App ${app.applicationNumber || app.id}...`);
      try {
        await RulesEngine.generateTasksForApplication(app.id, "FILING_DATE");
      } catch (e) {
        console.error(`Failed to generate tasks for app ${app.id}:`, e);
      }
    } else {
      console.log(`Tasks already exist for App ${app.applicationNumber || app.id}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main();
