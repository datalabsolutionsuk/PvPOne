import { createVariety } from "@/lib/actions";
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

export default function NewVarietyPage() {
  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href="/dashboard/varieties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Variety</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variety Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createVariety} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Variety Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Red Star Rose" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="species">Species (Latin Name)</Label>
              <Input id="species" name="species" required placeholder="e.g. Rosa L." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varietyType">Variety Type</Label>
              <select 
                id="varietyType" 
                name="varietyType" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="Tree">Tree</option>
                <option value="Vine">Vine</option>
                <option value="Field Crop">Field Crop</option>
                <option value="Ornamental">Ornamental</option>
                <option value="Vegetable">Vegetable</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breederReference">Breeder Reference</Label>
              <Input id="breederReference" name="breederReference" placeholder="Internal code" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Variety
              </Button>
              <Link href="/dashboard/varieties" className="flex-1">
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
