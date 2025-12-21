import { updateVariety } from "@/lib/actions";
import { db } from "@/lib/db";
import { varieties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditVarietyPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.organisationId) {
    return <div>Unauthorized</div>;
  }

  let variety;
  try {
    const result = await db
      .select()
      .from(varieties)
      .where(
        and(
          eq(varieties.id, params.id),
          eq(varieties.organisationId, session.user.organisationId)
        )
      );
    variety = result[0];
  } catch (error) {
    console.error("Error fetching variety:", error);
    // If it's a UUID error, it might be an invalid ID, so 404 is appropriate
    notFound();
  }

  if (!variety) {
    notFound();
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href="/dashboard/varieties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Variety</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variety Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateVariety} className="space-y-4">
            <input type="hidden" name="id" value={variety.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Variety Name</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                defaultValue={variety.name} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="species">Species (Latin Name)</Label>
              <Input 
                id="species" 
                name="species" 
                required 
                defaultValue={variety.species} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varietyType">Variety Type</Label>
              <select 
                id="varietyType" 
                name="varietyType" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                defaultValue={variety.varietyType || ""}
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
              <Input 
                id="breederReference" 
                name="breederReference" 
                defaultValue={variety.breederReference || ""} 
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Save Changes
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
