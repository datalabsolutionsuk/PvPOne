
import { db } from "@/lib/db";
import { renewals, applications, organisations, varieties, jurisdictions } from "@/db/schema";
import { eq, asc, and, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminRenewalActions } from "./admin-actions";

export default async function AdminMaintenancePage({
    searchParams,
}: {
    searchParams: { year?: string; status?: string }
}) {
  const currentYear = searchParams.year ? parseInt(searchParams.year) : new Date().getFullYear();
  
  // Fetch all upcoming renewals for the year across ALL organisations
  // Note: In a real "admin" view, we want to see everything
  const allRenewals = await db.select({
      id: renewals.id,
      year: renewals.year,
      dueDate: renewals.dueDate,
      status: renewals.status,
      appName: varieties.name,
      appId: applications.id,
      orgName: organisations.name,
      jurisdiction: jurisdictions.code
  })
  .from(renewals)
  .leftJoin(applications, eq(renewals.applicationId, applications.id))
  .leftJoin(varieties, eq(applications.varietyId, varieties.id))
  .leftJoin(organisations, eq(applications.organisationId, organisations.id))
  .leftJoin(jurisdictions, eq(applications.jurisdictionId, jurisdictions.id))
  .where(
      and(
          gte(renewals.dueDate, new Date(`${currentYear}-01-01`)),
          lte(renewals.dueDate, new Date(`${currentYear}-12-31`))
      )
  )
  .orderBy(asc(renewals.dueDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Master Maintenance</h1>
           <p className="text-muted-foreground">Global Maintenance Schedule for {currentYear}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Upcoming Renewals ({allRenewals.length})</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Due Date</TableHead>
                 <TableHead>Organisation</TableHead>
                 <TableHead>Variety</TableHead>
                 <TableHead>Jurisdiction</TableHead>
                 <TableHead>Year</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {allRenewals.map((r) => (
                 <TableRow key={r.id}>
                   <TableCell>{format(r.dueDate || new Date(), "yyyy-MM-dd")}</TableCell>
                   <TableCell className="font-medium">{r.orgName}</TableCell>
                   <TableCell>{r.appName}</TableCell>
                   <TableCell>{r.jurisdiction}</TableCell>
                   <TableCell>Year {r.year}</TableCell>
                   <TableCell>
                     <Badge variant={r.status === 'Paid' ? 'secondary' : r.status === 'Overdue' ? 'destructive' : 'outline'}>
                        {r.status}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-4">
                        <Link href={`/dashboard/applications/${r.appId}/maintenance`} className="text-blue-600 hover:underline text-sm">
                           View App
                        </Link>
                        {r.appId && (
                            <AdminRenewalActions 
                               renewalId={r.id} 
                               applicationId={r.appId} 
                               status={r.status}
                               dueDate={r.dueDate}
                            />
                        )}
                      </div>
                   </TableCell>
                 </TableRow>
               ))}
               {allRenewals.length === 0 && (
                   <TableRow>
                       <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                           No renewals found due in {currentYear}
                       </TableCell>
                   </TableRow>
               )}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
