import { db } from "@/lib/db";
import { applications, tasks, varieties, jurisdictions, queries } from "@/db/schema";
import { sql, eq, and, gte, lte, asc, desc, ne } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { FileText, Calendar, AlertCircle, TrendingUp, ArrowRight, ChevronLeft, ChevronRight, MessageSquare, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";
import { PaginationLimitSelect } from "@/components/pagination-limit-select";
import { DashboardQueriesList } from "@/components/dashboard-queries-list";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const organisationId = await getCurrentOrganisationId();
  const isSuper = await isSuperAdmin();
  
  if (!organisationId && !isSuper) {
    return <div>Unauthorized</div>;
  }

  const deadlinesPage = Number(searchParams?.deadlinesPage) || 1;
  const statusPage = Number(searchParams?.statusPage) || 1;
  const queriesPage = Number(searchParams?.queriesPage) || 1;
  const PAGE_SIZE = Number(searchParams?.limit) || 5;

  let stats: { status: string | null; count: number }[] = [];
  let upcomingDeadlines: any[] = [];
  let recentQueries: any[] = [];
  let totalVarieties = 0;
  let pendingTasksCount = 0;
  let totalDeadlines = 0;
  let totalQueries = 0;
  let totalTasks = 0;

  // Helper to apply org filter if present
  const orgFilter = (table: any) => organisationId ? eq(table.organisationId, organisationId) : undefined;

  try {
    // 1. App Stats
    const statsQuery = db
      .select({
        status: applications.status,
        count: sql<number>`count(*)`,
      })
      .from(applications)
      .groupBy(applications.status);
      
    if (organisationId) {
      statsQuery.where(eq(applications.organisationId, organisationId));
    }
    
    stats = await statsQuery;

    // 2. Upcoming Deadlines (Count & Paginated) - Next 90 Days
    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);

    const deadlinesConditions = [
      eq(tasks.status, "PENDING"),
      lte(tasks.dueDate, next90Days)
    ];
    if (organisationId) {
      deadlinesConditions.push(eq(applications.organisationId, organisationId));
    }

    const deadlinesCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .innerJoin(applications, eq(tasks.applicationId, applications.id))
      .where(and(...deadlinesConditions));
    totalDeadlines = Number(deadlinesCountRes[0].count);

    const upcomingDeadlinesRaw = await db
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
      .where(and(...deadlinesConditions))
      .orderBy(asc(tasks.dueDate))
      .limit(PAGE_SIZE)
      .offset((deadlinesPage - 1) * PAGE_SIZE);

    upcomingDeadlines = upcomingDeadlinesRaw.map(row => ({
      ...row.task,
      application: {
        ...row.application,
        variety: row.variety,
        jurisdiction: row.jurisdiction
      }
    }));

    // 3. Total Varieties
    const varietiesQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(varieties);
      
    if (organisationId) {
      varietiesQuery.where(eq(varieties.organisationId, organisationId));
    }
    
    const varietiesCount = await varietiesQuery;
    totalVarieties = Number(varietiesCount[0].count);

    // 4. Pending Documents (labeled as Missing Documents)
    const pendingTasksConditions = [
      eq(tasks.status, "PENDING"),
      eq(tasks.type, "DOCUMENT")
    ];
    if (organisationId) {
      pendingTasksConditions.push(eq(applications.organisationId, organisationId));
    }

    const tasksCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .innerJoin(applications, eq(tasks.applicationId, applications.id))
      .where(and(...pendingTasksConditions));
    pendingTasksCount = Number(tasksCount[0].count);

    // 5. Recent Queries
    const queriesConditions = [];
    if (organisationId) {
      queriesConditions.push(eq(applications.organisationId, organisationId));
    }

    const queriesCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(queries)
      .innerJoin(applications, eq(queries.applicationId, applications.id))
      .where(and(...queriesConditions));
    totalQueries = Number(queriesCountRes[0].count);

    // 6. Total Tasks Count (All statuses, excluding Documents)
    const totalTasksConditions: any[] = [
      ne(tasks.type, "DOCUMENT")
    ];
    if (organisationId) {
      totalTasksConditions.push(eq(applications.organisationId, organisationId));
    }

    const totalTasksCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .innerJoin(applications, eq(tasks.applicationId, applications.id))
      .where(and(...totalTasksConditions));
    totalTasks = Number(totalTasksCountRes[0].count);

    recentQueries = await db
      .select({
        query: queries,
        application: applications,
      })
      .from(queries)
      .innerJoin(applications, eq(queries.applicationId, applications.id))
      .where(and(...queriesConditions))
      .orderBy(desc(queries.updatedAt))
      .limit(PAGE_SIZE)
      .offset((queriesPage - 1) * PAGE_SIZE);

    // Serialize dates for client component
    recentQueries = recentQueries.map(({ query, application }) => ({
      query: {
        ...query,
        createdAt: query.createdAt.toISOString(),
        updatedAt: query.updatedAt.toISOString(),
      },
      application
    }));

  } catch (e) {
    console.error("Failed to fetch dashboard stats", e);
  }

  const totalApps = stats.reduce((acc, curr) => acc + Number(curr.count), 0);
  
  // Pagination Logic for Stats
  const totalStatusPages = Math.ceil(stats.length / PAGE_SIZE);
  const paginatedStats = stats.slice((statusPage - 1) * PAGE_SIZE, statusPage * PAGE_SIZE);

  // Pagination Logic for Deadlines
  const totalDeadlinesPages = Math.ceil(totalDeadlines / PAGE_SIZE);

  // Pagination Logic for Queries
  const totalQueriesPages = Math.ceil(totalQueries / PAGE_SIZE);

  // Helper for status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filed': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'DUS Exam': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Formality Check': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Published Opp': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Draft': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'Granted': return 'bg-green-100 text-green-800 hover:bg-green-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 pr-2 overflow-hidden">
      <div className="flex-shrink-0 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your PVP cases and deadlines</p>
        </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/tasks" className="block">
            <Card className="hover:shadow-md transition-all cursor-pointer h-full border-none shadow-sm">
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</p>
                  <div className="text-3xl font-bold">{totalTasks}</div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/tasks?filter=upcoming" className="block">
            <Card className="hover:shadow-md transition-all cursor-pointer h-full border-none shadow-sm">
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Upcoming Deadlines</p>
                  <div className="text-3xl font-bold">{totalDeadlines}</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/documents" className="block">
            <Card className="hover:shadow-md transition-all cursor-pointer h-full border-none shadow-sm">
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Missing Documents</p>
                  <div className="text-3xl font-bold">{pendingTasksCount}</div>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/varieties" className="block">
            <Card className="hover:shadow-md transition-all cursor-pointer h-full border-none shadow-sm">
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Varieties</p>
                  <div className="text-3xl font-bold">{totalVarieties}</div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 flex-1 min-h-0">
        <Card className="border-none shadow-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Cases by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {paginatedStats.map((stat) => (
                <Link key={stat.status} href={`/dashboard/applications?status=${stat.status}`} className="block group">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`${getStatusColor(stat.status || '')} px-3 py-1`}>
                      {stat.status}
                    </Badge>
                    <span className="text-lg font-bold group-hover:text-primary transition-colors">{Number(stat.count)}</span>
                  </div>
                </Link>
              ))}
              {paginatedStats.length === 0 && <p className="text-sm text-gray-500">No data available</p>}
            </div>
            
            <div className="flex-shrink-0 flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {statusPage} of {Math.max(1, totalStatusPages)}
              </div>
              <PaginationLimitSelect pageParam={["statusPage", "deadlinesPage", "queriesPage"]} />
              <div className="flex gap-2">
                <Link
                  href={`/dashboard?statusPage=${Math.max(1, statusPage - 1)}&deadlinesPage=${deadlinesPage}&queriesPage=${queriesPage}&limit=${PAGE_SIZE}`}
                  className={statusPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" size="icon" disabled={statusPage <= 1} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href={`/dashboard?statusPage=${Math.min(totalStatusPages, statusPage + 1)}&deadlinesPage=${deadlinesPage}&queriesPage=${queriesPage}&limit=${PAGE_SIZE}`}
                  className={statusPage >= totalStatusPages ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" size="icon" disabled={statusPage >= totalStatusPages} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Upcoming Deadlines (90 days)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming deadlines.</p>
              ) : (
                upcomingDeadlines.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{task.application.variety?.name || 'Unknown Variety'}</h4>
                        <p className="text-sm text-muted-foreground">{task.application.jurisdiction.code}/2024/00{task.application.id.slice(0,1)}</p>
                      </div>
                      <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                        {task.dueDate ? format(task.dueDate, "MMM d") : "No Date"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{task.title}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex-shrink-0 flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {deadlinesPage} of {Math.max(1, totalDeadlinesPages)}
              </div>
              <PaginationLimitSelect pageParam={["statusPage", "deadlinesPage", "queriesPage"]} />
              <div className="flex gap-2">
                <Link
                  href={`/dashboard?deadlinesPage=${Math.max(1, deadlinesPage - 1)}&statusPage=${statusPage}&queriesPage=${queriesPage}&limit=${PAGE_SIZE}`}
                  className={deadlinesPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" size="icon" disabled={deadlinesPage <= 1} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href={`/dashboard?deadlinesPage=${Math.min(totalDeadlinesPages, deadlinesPage + 1)}&statusPage=${statusPage}&queriesPage=${queriesPage}&limit=${PAGE_SIZE}`}
                  className={deadlinesPage >= totalDeadlinesPages ? "pointer-events-none opacity-50" : ""}
                >
                  <Button variant="outline" size="icon" disabled={deadlinesPage >= totalDeadlinesPages} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <DashboardQueriesList 
          initialQueries={recentQueries}
          totalQueries={totalQueries}
          page={queriesPage}
          limit={PAGE_SIZE}
        />
      </div>

      {pendingTasksCount > 0 && (
        <div className="flex-shrink-0 pb-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    {pendingTasksCount} cases need required documents
                  </h3>
                  <p className="text-yellow-800 text-sm mb-3">
                    Review your filed applications to ensure all required documents are uploaded before deadlines.
                  </p>
                  <Link href="/dashboard/tasks?filter=documents" className="text-yellow-900 font-medium text-sm flex items-center hover:underline">
                    View applications <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
