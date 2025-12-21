import { db } from "@/lib/db";
import { users, organisations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserManagement from "./user-management";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
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
    .leftJoin(organisations, eq(users.organisationId, organisations.id));

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagement users={allUsers} organisations={allOrganisations} />
        </CardContent>
      </Card>
    </div>
  );
}
