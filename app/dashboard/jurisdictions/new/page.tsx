import { createJurisdiction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewJurisdictionPage() {
  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href="/dashboard/jurisdictions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Jurisdiction</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jurisdiction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createJurisdiction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" required placeholder="e.g. EG" />
              <p className="text-xs text-muted-foreground">Two-letter country code (ISO 3166-1 alpha-2)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Egypt" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency Code</Label>
              <Input id="currencyCode" name="currencyCode" required placeholder="e.g. EGP" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Jurisdiction
              </Button>
              <Link href="/dashboard/jurisdictions" className="flex-1">
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
