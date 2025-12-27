import { db } from "@/lib/db";
import { applications, varieties, jurisdictions } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export default async function EditApplicationPage({
  params,
}: {
  params: { id: string };
}) {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, params.id),
  });

  if (!app) {
    notFound();
  }

  const allVarieties = await db.select().from(varieties);
  const allJurisdictions = await db.select().from(jurisdictions);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/applications/${app.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Application</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateApplication} className="space-y-4">
            <input type="hidden" name="id" value={app.id} />
            
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

            <div className="space-y-2">
              <Label htmlFor="filingDate">Filing Date</Label>
              <Input 
                type="date" 
                name="filingDate" 
                defaultValue={app.filingDate ? app.filingDate.toISOString().split('T')[0] : ''}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={app.status} required>
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Update Application
              </Button>
              <Link href={`/dashboard/applications/${app.id}`} className="flex-1">
                <Button variant="outline" type="button" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
