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
  searchParams: { applicationId: string; type: string };
}) {
  const organisationId = await getCurrentOrganisationId();

  if (!searchParams.applicationId || !searchParams.type) {
    // If context is missing, show application selection list instead of redirecting
    const apps = await db.query.applications.findMany({
      where: organisationId ? eq(applications.organisationId, organisationId) : undefined,
      with: { variety: true, jurisdiction: true },
      limit: 50,
    });

    return (
      <div className="space-y-6 container mx-auto py-6">
        <h1 className="text-2xl font-bold">Select Application for New Task</h1>
        <p className="text-muted-foreground">Please select an application to attach the new task to:</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Link 
              key={app.id} 
              href={`/dashboard/tasks/new?applicationId=${app.id}&type=DEADLINE`}
              className="block hover:no-underline"
            >
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{app.variety.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    <p>Jurisdiction: {app.jurisdiction.name}</p>
                    <p>Status: {app.status}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {apps.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-500">
               No applications found. <Link href="/dashboard/applications/new" className="text-blue-600 underline">Create one first</Link>.
             </div>
          )}
        </div>
      </div>
    );
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
