
import { db } from "@/lib/db";
import { renewals, documents, applications } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Upload } from "lucide-react";
import Link from "next/link";
import { updateRenewal } from "@/lib/actions";

export default async function MaintenancePage({ params }: { params: { id: string } }) {
  const appId = params.id;
  
  // 1. Check if schedule exists (read-only check first)
  const existingSchedule = await db.select().from(renewals)
    .where(eq(renewals.applicationId, appId))
    .limit(1);

  // 2. If missing, generate it (Inline logic to avoid Server Action overhead during render)
  if (existingSchedule.length === 0) {
      const appRes = await db.select().from(applications).where(eq(applications.id, appId)).limit(1);
      const app = appRes[0];
      
      if (app && app.grantDate) {
          const startDate = new Date(app.grantDate);
          const rows = [];
          
          for (let year = 1; year <= 25; year++) {
             const dueDate = new Date(startDate);
             dueDate.setFullYear(startDate.getFullYear() + year);
             
             rows.push({
               applicationId: appId,
               year,
               dueDate,
               status: "Upcoming" as const
             });
          }
          await db.insert(renewals).values(rows);
      }
  }
  
  // 3. Fetch full schedule
  const schedule = await db.select().from(renewals)
    .where(eq(renewals.applicationId, appId))
    .orderBy(asc(renewals.year));

  const renewalDocs = await db.select().from(documents)
    .where(eq(documents.applicationId, appId));

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-4 border-b pb-4">
          <Link href={`/dashboard/applications/${appId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Maintenance Schedule</h1>
              <p className="text-muted-foreground">Manage annual renewals (Year 1 - 25)</p>
          </div>
        </div>

        <div className="grid gap-4">
          {schedule.map((term) => {
             const docs = renewalDocs.filter(d => d.renewalId === term.id);
             const isPastDue = new Date() > new Date(term.dueDate) && term.status !== "Completed" && term.status !== "Paid";
             
             return (
               <Card key={term.id} className={`${isPastDue ? "border-red-200 bg-red-50" : term.status === 'Paid' ? "border-green-200 bg-green-50" : ""}`}>
                 <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                     <CardTitle className="text-base font-semibold">Year {term.year}</CardTitle>
                     <Badge variant={isPastDue ? "destructive" : term.status === "Paid" ? "secondary" : "outline"}>
                       {isPastDue ? "Overdue" : term.status}
                     </Badge>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-1 text-sm">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Due Date:</span>
                         <span className="font-medium">{format(new Date(term.dueDate), "PPP")}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Payment Date:</span>
                         <span className="font-medium">{term.paymentDate ? format(new Date(term.paymentDate), "PPP") : "-"}</span>
                       </div>
                     </div>
                     
                     <div className="space-y-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l pl-0 md:pl-4">
                       
                       {/* Documents List */}
                       {docs.length > 0 && (
                          <div className="space-y-1">
                             <span className="text-xs font-semibold text-muted-foreground uppercase">Uploaded Documents</span>
                             {docs.map(doc => (
                               <a key={doc.id} href={doc.storagePath} download={doc.name} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                 <CheckCircle className="h-3 w-3" />
                                 {doc.name}
                               </a>
                             ))}
                          </div>
                       )}

                       {/* Actions */}
                       <div className="flex gap-2">
                         {term.status !== "Paid" && (
                           <form action={updateRenewal}>
                             <input type="hidden" name="renewalId" value={term.id} />
                             <input type="hidden" name="applicationId" value={appId} />
                             <input type="hidden" name="actionType" value="pay" />
                             <Button size="sm" variant="outline" className="w-full gap-2">
                               <CheckCircle className="h-3 w-3" />
                               Mark Paid
                             </Button>
                           </form>
                         )}
                         
                         <form action={updateRenewal} className="flex-1">
                             <input type="hidden" name="renewalId" value={term.id} />
                             <input type="hidden" name="applicationId" value={appId} />
                             <input type="hidden" name="actionType" value="upload" />
                             <div className="flex items-center gap-2">
                               <label htmlFor={`upload-${term.id}`} className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 w-full">
                                  <Upload className="h-3 w-3 mr-2" />
                                  Upload Doc
                               </label>
                               <input 
                                 id={`upload-${term.id}`}
                                 type="file" 
                                 name="files" 
                                 multiple 
                                 className="hidden" 
                                 onChange={(e) => {
                                   if (e.target.form) e.target.form.requestSubmit()
                                 }}
                               />
                             </div>
                         </form>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
          })}
        </div>
      </div>
    </div>
  );
}
