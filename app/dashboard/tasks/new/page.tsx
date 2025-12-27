import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import CreateTaskForm from "./create-task-form";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: { applicationId: string; type: string };
}) {
  if (!searchParams.applicationId || !searchParams.type) {
    redirect("/dashboard/applications");
  }

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, searchParams.applicationId),
    with: {
      variety: true,
      jurisdiction: true,
    },
  });

  if (!application) {
    redirect("/dashboard/applications");
  }

  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();

  if (!superAdmin && application.organisationId !== organisationId) {
    redirect("/dashboard/applications");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add {searchParams.type === "DEADLINE" ? "Deadline" : "Document Requirement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTaskForm 
            applicationId={searchParams.applicationId} 
            type={searchParams.type}
            varietyName={application.variety.name}
            jurisdictionName={application.jurisdiction.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
