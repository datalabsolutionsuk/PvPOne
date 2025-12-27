
import { updateDocument } from "@/lib/actions";
import { db } from "@/lib/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  const organisationId = await getCurrentOrganisationId();
  const isSuper = await isSuperAdmin();

  if (!organisationId && !isSuper) {
    return <div>Unauthorized</div>;
  }

  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, params.id),
  });

  if (!doc) {
    notFound();
  }

  if (!isSuper && doc.organisationId !== organisationId) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateDocument} className="space-y-4">
            <input type="hidden" name="id" value={doc.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Document Name</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g. Signed POA" 
                defaultValue={doc.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select name="type" required defaultValue={doc.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POA">Power of Attorney</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Priority Document">Priority Document</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input 
                id="owner" 
                name="owner" 
                placeholder="e.g. John Doe" 
                defaultValue={doc.owner || ""}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Link href="/dashboard/documents" className="flex-1">
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
