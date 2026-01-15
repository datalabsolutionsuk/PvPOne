import { db } from "@/lib/db";
import { applications, varieties, jurisdictions, documents } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateApplication } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";
import { format } from "date-fns";

export default async function EditApplicationPage({
  params,
}: {
  params: { id: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  const isSuper = await isSuperAdmin();

  const app = await db.query.applications.findFirst({
    where: eq(applications.id, params.id),
  });

  if (!app) {
    notFound();
  }

  // Security check
  if (app.organisationId !== organisationId && !isSuper) {
    return <div>Unauthorized</div>;
  }

  const allVarieties = await db.select().from(varieties);
  const allJurisdictions = await db.select().from(jurisdictions);

  // Fetch the latest DUS document if any
  const latestDusDoc = await db.query.documents.findFirst({
    where: and(
        eq(documents.applicationId, app.id),
        eq(documents.type, 'DUS_REPORT')
    ),
    orderBy: [desc(documents.createdAt)]
  });

  // Fetch the latest Certificate document if any
  const latestCertDoc = await db.query.documents.findFirst({
    where: and(
        eq(documents.applicationId, app.id),
        eq(documents.type, 'PBR_CERTIFICATE')
    ),
    orderBy: [desc(documents.createdAt)]
  });

  const isDus = app.status === 'DUS';
  const isCertificate = app.status === 'Certificate_Issued';
  
  let backLink = `/dashboard/applications/${app.id}`;
  if (isDus) backLink = "/dashboard/applications?status=DUS";
  if (isCertificate) backLink = "/dashboard/applications?status=Certificate_Issued";

  const titlePrefix = isDus ? "DUS Record" : isCertificate ? "Certificate" : "Application";
  const cardTitle = isDus ? "DUS Details" : isCertificate ? "PBR Certificate Details" : "Application Details";

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href={backLink}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit {titlePrefix}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateApplication} className="space-y-4">
            <input type="hidden" name="id" value={app.id} />
             {/* Pass status to prevent it from being reset or nulled if logic requires it */}
            <input type="hidden" name="status" value={app.status || "Draft"} />
             {/* Handle redirect on server side */}
            <input type="hidden" name="redirectTo" value={backLink} />
            
            <div className="space-y-2">
              <Label htmlFor="varietyId">Variety</Label>
              <Select name="varietyId" defaultValue={app.varietyId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a variety" />
                </SelectTrigger>
                <SelectContent>
                  {allVarieties.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdictionId">Jurisdiction</Label>
              <Select name="jurisdictionId" defaultValue={app.jurisdictionId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {allJurisdictions.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name} ({j.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationNumber">Application Number</Label>
              <Input 
                id="applicationNumber" 
                name="applicationNumber" 
                defaultValue={app.applicationNumber || ""} 
                placeholder="e.g. 12345/2025"
              />
            </div>

            {!isDus && !isCertificate && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="filingDate">Filing Date</Label>
                  <Input 
                    type="date" 
                    id="filingDate" 
                    name="filingDate" 
                    defaultValue={app.filingDate ? format(app.filingDate, "yyyy-MM-dd") : ""}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={app.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Filed">Filed</SelectItem>
                      <SelectItem value="Formality_Check">Formality Check</SelectItem>
                      <SelectItem value="DUS">DUS</SelectItem>
                      <SelectItem value="Exam">Exam</SelectItem>
                      <SelectItem value="Published_Opp">Published / Opposition</SelectItem>
                      <SelectItem value="Certificate_Issued">Certificate Issued</SelectItem>
                      <SelectItem value="Refused">Refused</SelectItem>
                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {/* Preserve filingDate if hidden */}
            {isDus && app.filingDate && (
                <input type="hidden" name="filingDate" value={format(app.filingDate, "yyyy-MM-dd")} />
            )}
            {isCertificate && app.filingDate && (
                <input type="hidden" name="filingDate" value={format(app.filingDate, "yyyy-MM-dd")} />
            )}

            {isCertificate && (
              <>
                 <div className="space-y-2">
                  <Label htmlFor="grantDate">Date of Issuance</Label>
                  <Input 
                      type="date" 
                      name="grantDate"
                      defaultValue={app.grantDate ? format(app.grantDate, "yyyy-MM-dd") : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Date of Expiry</Label>
                  <Input 
                      type="date" 
                      name="expiryDate"
                      defaultValue={app.expiryDate ? format(app.expiryDate, "yyyy-MM-dd") : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificateFile">Upload Certificate</Label>
                   {latestCertDoc && (
                      <div className="text-sm text-green-600 mb-2 p-2 bg-green-50 rounded border border-green-200">
                          Current File: <span className="font-semibold">{latestCertDoc.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                             (Uploading a new file will add to the record)
                          </span>
                      </div>
                   )}
                  <Input type="file" name="certificateFile" />
                </div>
              </>
            )}

            {isDus && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dusStatus">DUS Status</Label>
                  <Select name="dusStatus" defaultValue={app.dusStatus || "Waiting"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Waiting">Waiting</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dusExpectedDate">DUS Expected Receipt Date</Label>
                  <Input 
                      type="date" 
                      name="dusExpectedDate"
                      defaultValue={app.dusExpectedReceiptDate ? format(app.dusExpectedReceiptDate, "yyyy-MM-dd") : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dusFile">Upload DUS Report/Data</Label>
                   {latestDusDoc && (
                      <div className="text-sm text-green-600 mb-2 p-2 bg-green-50 rounded border border-green-200">
                          Current File: <span className="font-semibold">{latestDusDoc.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                             (Uploading a new file will add to the record)
                          </span>
                      </div>
                   )}
                  <Input type="file" name="dusFile" />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Link href={backLink} className="flex-1">
                <Button variant="outline" type="button" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
