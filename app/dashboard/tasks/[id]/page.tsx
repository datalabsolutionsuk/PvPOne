import { db } from "@/lib/db";
import { tasks, applications, varieties, jurisdictions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { completeTask } from "@/lib/actions";
import { ArrowLeft } from "lucide-react";

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Task Details</h2>
          <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>
            {task.status}
          </Badge>
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

      {task.type === "DOCUMENT" && task.status !== "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Please upload the required document to complete this task.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={completeTask} className="space-y-4">
              <input type="hidden" name="taskId" value={task.id} />
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input 
                  id="file" 
                  name="file" 
                  type="file" 
                  required 
                  accept=".doc,.docx,.pdf,.xls,.xlsx"
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
                </p>
              </div>
              <Button type="submit">Upload & Complete</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {task.status === "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 font-medium flex items-center gap-2">
              ✓ Task completed
            </p>
            {/* In a real app, we would show the uploaded file link here */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
