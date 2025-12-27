import { db } from "@/lib/db";
import { applications, varieties, jurisdictions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { getCurrentOrganisationId } from "@/lib/context";
import { Card, CardContent } from "@/components/ui/card";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  if (!organisationId) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  let apps: {
    id: string;
    appNumber: string | null;
    status: "Draft" | "Filed" | "Formality_Check" | "DUS" | "Exam" | "Published_Opp" | "Certificate_Issued" | "Refused" | "Withdrawn";
    filingDate: Date | null;
    varietyName: string | null;
    jurisdictionCode: string | null;
  }[] = [];
  
  try {
    let query = db
      .select({
        id: applications.id,
        appNumber: applications.applicationNumber,
        status: applications.status,
        filingDate: applications.filingDate,
        varietyName: varieties.name,
        jurisdictionCode: jurisdictions.code,
      })
      .from(applications)
      .leftJoin(varieties, eq(applications.varietyId, varieties.id))
      .leftJoin(jurisdictions, eq(applications.jurisdictionId, jurisdictions.id))
      .where(eq(applications.organisationId, organisationId))
      .orderBy(desc(applications.createdAt));

    if (searchParams.status) {
      // @ts-ignore
      query.where(and(eq(applications.status, searchParams.status), eq(applications.organisationId, organisationId)));
    }

    apps = await query;
  } catch (e) {
    console.error("Failed to fetch applications", e);
  }

  const totalApps = apps.length;
  const totalPages = Math.ceil(totalApps / pageSize);
  const paginatedApps = apps.slice(offset, offset + pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">
          {searchParams.status ? `${searchParams.status} Applications` : "Applications"}
        </h2>
        <Button asChild>
          <Link href="/dashboard/applications/new">New Application</Link>
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>App Number</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filing Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.appNumber || "N/A"}</TableCell>
                  <TableCell>{app.varietyName}</TableCell>
                  <TableCell>{app.jurisdictionCode}</TableCell>
                  <TableCell>{app.status}</TableCell>
                  <TableCell>
                    {app.filingDate ? format(app.filingDate, "yyyy-MM-dd") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/applications/${app.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1} ({totalApps} total)
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/dashboard/applications?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}>Previous</Link>
              ) : "Previous"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/dashboard/applications?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}>Next</Link>
              ) : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
