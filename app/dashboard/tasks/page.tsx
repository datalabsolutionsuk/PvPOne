import { db } from "@/lib/db";
import { tasks, applications, varieties, jurisdictions } from "@/db/schema";
import { eq, and, gte, asc, ne } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();

  if (!organisationId && !superAdmin) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  let taskList: any[] = [];
  try {
    const conditions = [
      ne(tasks.type, "DOCUMENT")
    ];
    
    if (organisationId) {
      conditions.push(eq(applications.organisationId, organisationId));
    }
    
    if (searchParams.filter === "urgent") {
      conditions.push(eq(tasks.status, "PENDING"));
    } else if (searchParams.filter === "pending") {
      conditions.push(eq(tasks.status, "PENDING"));
    }

    const taskListRaw = await db
      .select({
        task: tasks,
        application: applications,
        variety: varieties,
        jurisdiction: jurisdictions,
      })
      .from(tasks)
      .innerJoin(applications, eq(tasks.applicationId, applications.id))
      .innerJoin(varieties, eq(applications.varietyId, varieties.id))
      .innerJoin(jurisdictions, eq(applications.jurisdictionId, jurisdictions.id))
      .where(and(...conditions))
      .orderBy(asc(tasks.dueDate));

    taskList = taskListRaw.map(row => ({
      ...row.task,
      application: {
        ...row.application,
        variety: row.variety,
        jurisdiction: row.jurisdiction
      }
    }));
    
    if (searchParams.filter === "urgent") {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        taskList = taskList.filter(t => t.dueDate && t.dueDate <= nextWeek);
    }

  } catch (e) {
    console.error("Failed to fetch tasks", e);
  }

  const totalItems = taskList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedTasks = taskList.slice(offset, offset + pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">
          {searchParams.filter === "urgent" ? "Urgent Tasks" : "All Tasks"}
        </h2>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.description || task.title}</TableCell>
                  <TableCell>
                    {task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{task.application.applicationNumber || "Pending"}</span>
                      <span className="text-xs text-muted-foreground">{task.application.variety.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{task.application.jurisdiction.code}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/applications/${task.applicationId}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1} ({totalItems} total)
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/dashboard/tasks?page=${page - 1}${searchParams.filter ? `&filter=${searchParams.filter}` : ''}`}>Previous</Link>
              ) : "Previous"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/dashboard/tasks?page=${page + 1}${searchParams.filter ? `&filter=${searchParams.filter}` : ''}`}>Next</Link>
              ) : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
