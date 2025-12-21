
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL!;

async function main() {
  console.log("Connecting to:", connectionString.replace(/:[^:@]*@/, ":***@")); // Hide password
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const result = await client`
      UPDATE "user" 
      SET role = 'SuperAdmin' 
      WHERE email = 'foxh1@hotmail.com'
      RETURNING id, name, email, role
    `;
    console.log("Updated User:", result);
  } catch (e) {
    console.error("Error updating user:", e);
  } finally {
    await client.end();
  }
}

main();
