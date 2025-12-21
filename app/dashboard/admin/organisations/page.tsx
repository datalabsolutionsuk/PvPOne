import { db } from "@/lib/db";
import { organisations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { deleteOrganisation, switchOrganisation } from "@/lib/actions";

export default async function AdminOrganisationsPage() {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
  }

  const orgs = await db.select().from(organisations);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Organisations Management</h1>
        <Link href="/dashboard/admin/organisations/new">
          <Button>Add Organisation</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organisations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{org.id}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <form
                      action={async () => {
                        "use server";
                        await switchOrganisation(org.id);
                      }}
                      className="inline-block"
                    >
                      <Button variant="secondary" size="sm" type="submit">
                        View
                      </Button>
                    </form>
                    <Link href={`/dashboard/admin/organisations/${org.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteOrganisation(org.id);
                      }}
                      className="inline-block"
                    >
                      <Button variant="destructive" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
