import { db } from "@/lib/db";
import { users, organisations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, or, sql, SQL, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserManagement from "./user-management";
import { SearchInput } from "@/components/ui/search-input";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
  }

  const queryText = searchParams.query;

  const conditions = [];
  if (queryText) {
    conditions.push(
      or(
        sql`${users.name} ILIKE ${`%${queryText}%`}`,
        sql`${users.email} ILIKE ${`%${queryText}%`}`,
        sql`${users.role} ILIKE ${`%${queryText}%`}`,
        sql`${organisations.name} ILIKE ${`%${queryText}%`}`
      ) as SQL<unknown>
    );
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      organisationId: users.organisationId,
      organisationName: organisations.name,
    })
    .from(users)
    .leftJoin(organisations, eq(users.organisationId, organisations.id))
    .where(and(...conditions));

  const allOrganisations = await db
    .select({
      id: organisations.id,
      name: organisations.name,
    })
    .from(organisations);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="w-[300px]">
          <SearchInput placeholder="Search users..." />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagement users={allUsers} organisations={allOrganisations} query={queryText} />
        </CardContent>
      </Card>
    </div>
  );
}
