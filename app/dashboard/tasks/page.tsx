import { db } from "@/lib/db";
import { tasks, applications, varieties, jurisdictions } from "@/db/schema";
import { eq, and, gte, asc, desc, ne, or, sql, SQL } from "drizzle-orm";
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
import { cookies } from "next/headers";
import { PaginationLimitSelect } from "@/components/pagination-limit-select";
import { SortableColumn } from "@/components/ui/sortable-column";
import { SearchInput } from "@/components/ui/search-input";
import { HighlightedText } from "@/components/ui/highlighted-text";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string; limit?: string; sort?: string; order?: string; query?: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();
  const isImpersonating = cookies().has("admin_org_context");
  const queryText = searchParams.query;

  if (!organisationId && !superAdmin) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 5;
  const offset = (page - 1) * pageSize;
  const sort = searchParams.sort;
  const order = searchParams.order === "asc" ? asc : desc;

  let taskList: any[] = [];
  try {
    const conditions = [
      ne(tasks.type, "DOCUMENT")
    ];
    
    // Only filter by organisation if:
    // 1. User is NOT a super admin (must see their own org)
    // 2. User IS a super admin BUT is impersonating (must see target org)
    // If Super Admin AND NOT impersonating -> Show ALL (Global View)
    if (organisationId && (!superAdmin || isImpersonating)) {
      conditions.push(eq(applications.organisationId, organisationId));
    }
    
    if (searchParams.filter === "urgent") {
      conditions.push(eq(tasks.status, "PENDING"));
    } else if (searchParams.filter === "pending") {
      conditions.push(eq(tasks.status, "PENDING"));
    }

    if (queryText) {
      conditions.push(
        or(
          sql`${tasks.title} ILIKE ${`%${queryText}%`}`,
          sql`${tasks.description} ILIKE ${`%${queryText}%`}`,
          sql`${varieties.name} ILIKE ${`%${queryText}%`}`,
          sql`${jurisdictions.code} ILIKE ${`%${queryText}%`}`,
          sql`${applications.applicationNumber} ILIKE ${`%${queryText}%`}`
        ) as SQL<unknown>
      );
    }

    let orderBy = asc(tasks.dueDate);
    if (sort === "title") orderBy = order(tasks.title);
    else if (sort === "dueDate") orderBy = order(tasks.dueDate);
    else if (sort === "status") orderBy = order(tasks.status);
    else if (sort === "variety") orderBy = order(varieties.name);
    else if (sort === "jurisdiction") orderBy = order(jurisdictions.code);

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
      .orderBy(orderBy);

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
        <div className="flex items-center gap-4">
          <div className="w-[300px]">
            <SearchInput placeholder="Search tasks..." />
          </div>
          <Button asChild>
            <Link href="/dashboard/tasks/new">Add Task</Link>
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead><SortableColumn title="Task" column="title" /></TableHead>
                <TableHead><SortableColumn title="Due Date" column="dueDate" /></TableHead>
                <TableHead><SortableColumn title="Status" column="status" /></TableHead>
                <TableHead><SortableColumn title="Application" column="variety" /></TableHead>
                <TableHead><SortableColumn title="Jurisdiction" column="jurisdiction" /></TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <HighlightedText text={task.description || task.title} highlight={queryText} />
                  </TableCell>
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
                      <span className="font-medium">
                        <HighlightedText text={task.application.applicationNumber || "Pending"} highlight={queryText} />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <HighlightedText text={task.application.variety.name} highlight={queryText} />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <HighlightedText text={task.application.jurisdiction.code} highlight={queryText} />
                  </TableCell>
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
          <PaginationLimitSelect />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/dashboard/tasks?page=${page - 1}&limit=${pageSize}${searchParams.filter ? `&filter=${searchParams.filter}` : ''}${queryText ? `&query=${queryText}` : ''}`}>Previous</Link>
              ) : "Previous"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/dashboard/tasks?page=${page + 1}&limit=${pageSize}${searchParams.filter ? `&filter=${searchParams.filter}` : ''}${queryText ? `&query=${queryText}` : ''}`}>Next</Link>
              ) : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
