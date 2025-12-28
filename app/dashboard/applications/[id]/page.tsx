import { db } from "@/lib/db";
import { applications, varieties, jurisdictions, tasks, queries, messages } from "@/db/schema";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { QueriesUI } from "@/components/queries-ui";
import { PaginationLimitSelect } from "@/components/pagination-limit-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskActions, AddTaskButton } from "./actions";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default async function ApplicationDetailsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { deadlinesPage?: string; documentsPage?: string; limit?: string };
}) {
  const deadlinesPage = searchParams.deadlinesPage ? parseInt(searchParams.deadlinesPage) : 1;
  const documentsPage = searchParams.documentsPage ? parseInt(searchParams.documentsPage) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 5;
  const deadlinesOffset = (deadlinesPage - 1) * pageSize;
  const documentsOffset = (documentsPage - 1) * pageSize;

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

  // Fetch Deadlines
  const deadlinesConditions = [
    eq(tasks.applicationId, app.id),
    eq(tasks.type, "DEADLINE")
  ];

  const [deadlinesCountRes, deadlines] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(...deadlinesConditions)),
    db.select().from(tasks)
      .where(and(...deadlinesConditions))
      .orderBy(asc(tasks.dueDate))
      .limit(pageSize)
      .offset(deadlinesOffset)
  ]);
  const totalDeadlines = Number(deadlinesCountRes[0].count);
  const totalDeadlinesPages = Math.ceil(totalDeadlines / pageSize);

  // Fetch Documents
  const documentsConditions = [
    eq(tasks.applicationId, app.id),
    eq(tasks.type, "DOCUMENT")
  ];

  const [documentsCountRes, documents] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(...documentsConditions)),
    db.select().from(tasks)
      .where(and(...documentsConditions))
      .orderBy(asc(tasks.dueDate))
      .limit(pageSize)
      .offset(documentsOffset)
  ]);
  const totalDocuments = Number(documentsCountRes[0].count);
  const totalDocumentsPages = Math.ceil(totalDocuments / pageSize);

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
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Deadlines & Tasks</CardTitle>
            <AddTaskButton applicationId={app.id} type="DEADLINE" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex-1">
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
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Page {deadlinesPage} of {Math.max(1, totalDeadlinesPages)}
              </div>
              <PaginationLimitSelect pageParam={["deadlinesPage", "documentsPage"]} />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={deadlinesPage <= 1}
                  asChild={deadlinesPage > 1}
                >
                  {deadlinesPage > 1 ? (
                    <Link href={`/dashboard/applications/${app.id}?deadlinesPage=${deadlinesPage - 1}&documentsPage=${documentsPage}&limit=${pageSize}`}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={deadlinesPage >= totalDeadlinesPages}
                  asChild={deadlinesPage < totalDeadlinesPages}
                >
                  {deadlinesPage < totalDeadlinesPages ? (
                    <Link href={`/dashboard/applications/${app.id}?deadlinesPage=${deadlinesPage + 1}&documentsPage=${documentsPage}&limit=${pageSize}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Required Documents</CardTitle>
            <AddTaskButton applicationId={app.id} type="DOCUMENT" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex-1">
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
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Page {documentsPage} of {Math.max(1, totalDocumentsPages)}
              </div>
              <PaginationLimitSelect pageParam={["deadlinesPage", "documentsPage"]} />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={documentsPage <= 1}
                  asChild={documentsPage > 1}
                >
                  {documentsPage > 1 ? (
                    <Link href={`/dashboard/applications/${app.id}?documentsPage=${documentsPage - 1}&deadlinesPage=${deadlinesPage}&limit=${pageSize}`}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={documentsPage >= totalDocumentsPages}
                  asChild={documentsPage < totalDocumentsPages}
                >
                  {documentsPage < totalDocumentsPages ? (
                    <Link href={`/dashboard/applications/${app.id}?documentsPage=${documentsPage + 1}&deadlinesPage=${deadlinesPage}&limit=${pageSize}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                  )}
                </Button>
              </div>
            </div>
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
