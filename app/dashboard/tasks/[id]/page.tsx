import { db } from "@/lib/db";
import { tasks, applications, varieties, jurisdictions, documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { completeTask } from "@/lib/actions";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";

export default async function TaskDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, params.id),
    with: {
      application: {
        with: {
          variety: true,
          jurisdiction: true,
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();

  if (!superAdmin && task.application.organisationId !== organisationId) {
    notFound();
  }

  // Fetch documents linked to this task
  const taskDocuments = await db.query.documents.findMany({
    where: eq(documents.taskId, task.id),
    orderBy: [desc(documents.createdAt)],
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/applications/${task.applicationId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Task Details</h2>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/documents/upload?taskId=${task.id}&type=${task.title}`}>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </Link>
            <Link href={`/dashboard/tasks/${task.id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <Badge 
              className={
                task.status === "COMPLETED" 
                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" 
                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
              }
            >
              {task.status}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>
            Due: {task.dueDate ? format(task.dueDate, "PP") : "No due date"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Application</Label>
              <div className="font-medium">
                <Link href={`/dashboard/applications/${task.applicationId}`} className="text-blue-600 hover:underline">
                  {task.application.variety.name} ({task.application.jurisdiction.code})
                </Link>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <div className="font-medium">{task.type}</div>
            </div>
          </div>

          {task.description && (
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1">{task.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {taskDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {taskDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(doc.createdAt, "PP p")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="#" className="text-blue-600">Download</a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
