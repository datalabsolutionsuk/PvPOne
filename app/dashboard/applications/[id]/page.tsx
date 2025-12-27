import { db } from "@/lib/db";
import { applications, varieties, jurisdictions, tasks, queries, messages } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { QueriesUI } from "@/components/queries-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskActions, AddTaskButton } from "./actions";

import { ArrowLeft } from "lucide-react";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, params.id),
    with: {
      variety: true,
      jurisdiction: true,
    },
  });

  if (!app) {
    notFound();
  }

  const appTasks = await db.query.tasks.findMany({
    where: eq(tasks.applicationId, app.id),
    orderBy: [asc(tasks.dueDate)],
  });

  const appQueries = await db.query.queries.findMany({
    where: eq(queries.applicationId, app.id),
    with: {
      creator: true,
      messages: {
        orderBy: [asc(messages.createdAt)],
        with: {
          sender: true
        }
      }
    },
    orderBy: [desc(queries.createdAt)]
  });

  const session = await auth();

  const deadlines = appTasks.filter((t) => t.type === "DEADLINE");
  const documents = appTasks.filter((t) => t.type === "DOCUMENT");

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/applications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">
              Application Details
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={app.status === "Filed" ? "default" : "secondary"}>
                {app.status}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/applications/${app.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variety</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{app.variety.name}</div>
            <p className="text-xs text-muted-foreground">
              {app.variety.species}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{app.jurisdiction.name}</div>
            <p className="text-xs text-muted-foreground">
              {app.jurisdiction.code}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filing Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {app.filingDate ? format(app.filingDate, "PP") : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Deadlines & Tasks</CardTitle>
            <AddTaskButton applicationId={app.id} type="DEADLINE" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No deadlines found.
                    </TableCell>
                  </TableRow>
                )}
                {deadlines.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      {task.dueDate ? format(task.dueDate, "PP") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.status === "COMPLETED" ? "default" : "outline"
                        }
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TaskActions taskId={task.id} applicationId={app.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Required Documents</CardTitle>
            <AddTaskButton applicationId={app.id} type="DOCUMENT" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No document requirements found.
                    </TableCell>
                  </TableRow>
                )}
                {documents.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      {task.dueDate ? format(task.dueDate, "PP") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.status === "COMPLETED" ? "default" : "outline"
                        }
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/tasks/${task.id}`}>
                          {task.status === "COMPLETED" ? "View" : "Upload"}
                        </Link>
                      </Button>
                      <TaskActions taskId={task.id} applicationId={app.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Communication & Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <QueriesUI 
              applicationId={app.id} 
              initialQueries={appQueries.map(q => ({
                ...q,
                createdAt: q.createdAt.toISOString(),
                messages: q.messages.map(m => ({
                  ...m,
                  createdAt: m.createdAt.toISOString()
                }))
              }))} 
              currentUserId={session?.user?.id || ""} 
            />
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
