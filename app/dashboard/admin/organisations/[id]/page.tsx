import { db } from "@/lib/db";
import { organisations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganisation } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditOrganisationPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
  }

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, params.id));

  if (!org) {
    notFound();
  }

  const updateOrganisationWithId = updateOrganisation.bind(null, org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/organisations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Organisation</h1>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Organisation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOrganisationWithId} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                defaultValue={org.name} 
              />
            </div>
            <div className="space-y-2">
              <Label>ID</Label>
              <Input disabled value={org.id} className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label>Created At</Label>
              <Input 
                disabled 
                value={org.createdAt.toLocaleDateString()} 
                className="bg-gray-100" 
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Organisation
              </Button>
              <Link href="/dashboard/admin/organisations" className="flex-1">
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
