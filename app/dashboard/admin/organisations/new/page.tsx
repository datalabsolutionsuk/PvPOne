import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganisation } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewOrganisationPage() {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/organisations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Organisation</h1>
      </div>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Organisation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createOrganisation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Acme Corp" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Create Organisation
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
