import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function checkUser() {
  console.log("Checking for admin user...");
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, "admin@pvp.one"),
    });

    if (user) {
      console.log("User found:", user.email);
      console.log("Password hash length:", user.password?.length);
    } else {
      console.log("User NOT found.");
    }
  } catch (e) {
    console.error("Database connection error:", e);
  }
  process.exit(0);
}

checkUser();
