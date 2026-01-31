import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import CreateTaskForm from "./create-task-form";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: { applicationId?: string; type?: string };
}) {
  const organisationId = await getCurrentOrganisationId();

  // If specific application is requested, retrieve it
  let selectedApplication = null;
  if (searchParams.applicationId) {
     selectedApplication = await db.query.applications.findFirst({
        where: eq(applications.id, searchParams.applicationId),
        with: {
            variety: true,
            jurisdiction: true,
        },
    });
  }

  // If we don't have a specific application, or if we want to allow selecting different ones,
  // we need the list of available applications.
  let userApplications: any[] = [];
  if (!selectedApplication) {
      userApplications = await db.query.applications.findMany({
        where: organisationId ? eq(applications.organisationId, organisationId) : undefined,
        with: { variety: true, jurisdiction: true },
        limit: 100, // Reasonable limit
      });
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <h1 className="text-3xl font-bold">New Task</h1>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTaskForm 
              applicationId={selectedApplication?.id}
              type={searchParams.type || "DEADLINE"}
              varietyName={selectedApplication?.variety.name}
              jurisdictionName={selectedApplication?.jurisdiction.name}
              applications={userApplications}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
