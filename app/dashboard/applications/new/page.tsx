import { db } from "@/lib/db";
import { varieties, jurisdictions } from "@/db/schema";
import { createApplication } from "@/lib/actions";
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
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewApplicationPage() {
  const allVarieties = await db.select().from(varieties);
  const allJurisdictions = await db.select().from(jurisdictions);

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href="/dashboard/applications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Application</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createApplication} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="varietyId">Variety</Label>
              <Select name="varietyId" required>
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
              <Select name="jurisdictionId" required>
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
              <Label htmlFor="filingDate">Filing Date</Label>
              <Input type="date" name="filingDate" required />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Application
              </Button>
              <Link href="/dashboard/applications" className="flex-1">
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
