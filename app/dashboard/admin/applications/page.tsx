
import { db } from "@/lib/db";
import { applications, varieties, organisations, jurisdictions } from "@/db/schema";
import { eq, desc, asc, and, ilike } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; status?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const offset = (page - 1) * pageSize;
  const statusFilter = searchParams.status;

  const conditions = [];
  if (statusFilter) {
      if (statusFilter === 'DUS') conditions.push(eq(applications.status, 'DUS'));
      if (statusFilter === 'Certificate_Issued') conditions.push(eq(applications.status, 'Certificate_Issued'));
      // Add other statuses if needed
  }

  const data = await db
    .select({
        id: applications.id,
        appNumber: applications.applicationNumber,
        status: applications.status,
        varietyName: varieties.name,
        orgName: organisations.name,
        jurisdiction: jurisdictions.code,
        filingDate: applications.filingDate,
        dusStatus: applications.dusStatus
    })
    .from(applications)
    .leftJoin(varieties, eq(applications.varietyId, varieties.id))
    .leftJoin(organisations, eq(applications.organisationId, organisations.id))
    .leftJoin(jurisdictions, eq(applications.jurisdictionId, jurisdictions.id))
    .where(and(...conditions))
    .orderBy(desc(applications.createdAt))
    .limit(pageSize)
    .offset(offset);

    let title = "Master Applications List";
    if (statusFilter === 'DUS') title = "All DUS Applications";
    if (statusFilter === 'Certificate_Issued') title = "All PBR Certificates";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App Number</TableHead>
              <TableHead>Variety</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Status</TableHead>
              {statusFilter === 'DUS' && <TableHead>DUS Status</TableHead>}
              <TableHead>Filing Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-mono text-xs">{app.appNumber || "Pending"}</TableCell>
                <TableCell className="font-medium">{app.varietyName}</TableCell>
                <TableCell>{app.orgName}</TableCell>
                <TableCell>{app.jurisdiction}</TableCell>
                <TableCell>
                    <Badge variant="secondary">{app.status}</Badge>
                </TableCell>
                {statusFilter === 'DUS' && <TableCell>{app.dusStatus}</TableCell>}
                <TableCell>{app.filingDate ? format(app.filingDate, "PP") : "-"}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/applications/${app.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No applications found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
