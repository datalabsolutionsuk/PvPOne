import { createRuleset } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewRulesetPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/jurisdictions/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Rule Set</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Set Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRuleset} className="space-y-4">
            <input type="hidden" name="jurisdictionId" value={params.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Rule Set Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Egypt v1" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" name="version" required placeholder="e.g. 1.0" />
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isActive" 
                name="isActive" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Rule Set
              </Button>
              <Link href={`/dashboard/jurisdictions/${params.id}`} className="flex-1">
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
