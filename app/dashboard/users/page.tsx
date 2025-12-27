import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrgUserManagement from "./org-user-management";
import { getCurrentOrganisationId } from "@/lib/context";

export default async function OrgUsersPage() {
  const session = await auth();
  const organisationId = await getCurrentOrganisationId();
  const isSuper = session?.user?.role === "SuperAdmin";

  if (!session?.user || (!organisationId && !isSuper)) {
    redirect("/login");
  }

  // Only Admins can manage users
  if (!["SuperAdmin", "LawyerAdmin", "ClientAdmin"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users);

  if (organisationId) {
    query.where(eq(users.organisationId, organisationId));
  }

  const orgUsers = await query;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgUserManagement users={orgUsers} currentUserRole={session.user.role} />
        </CardContent>
      </Card>
    </div>
  );
}
