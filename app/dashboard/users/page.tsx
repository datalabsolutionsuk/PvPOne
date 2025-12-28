import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, and, or, sql, SQL } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrgUserManagement from "./org-user-management";
import { getCurrentOrganisationId } from "@/lib/context";
import { SearchInput } from "@/components/ui/search-input";

export default async function OrgUsersPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";
  const queryText = searchParams.query;

  if (!session?.user || (!organisationId && !isSuper)) {
    redirect("/login");
  }

  // Only Admins can manage users
  if (!["SuperAdmin", "LawyerAdmin", "ClientAdmin"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const conditions = [];

  if (organisationId) {
    conditions.push(eq(users.organisationId, organisationId));
  }

  if (queryText) {
    conditions.push(
      or(
        sql`${users.name} ILIKE ${`%${queryText}%`}`,
        sql`${users.email} ILIKE ${`%${queryText}%`}`,
        sql`${users.role}::text ILIKE ${`%${queryText}%`}`
      ) as SQL<unknown>
    );
  }

  const orgUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(and(...conditions));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <div className="w-[300px]">
          <SearchInput placeholder="Search users..." />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgUserManagement users={orgUsers} currentUserRole={session.user.role} query={queryText} />
        </CardContent>
      </Card>
    </div>
  );
}
