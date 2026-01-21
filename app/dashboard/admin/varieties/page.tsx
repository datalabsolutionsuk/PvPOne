
import { db } from "@/lib/db";
import { varieties, organisations } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function AdminVarietiesPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; sort?: string; order?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const offset = (page - 1) * pageSize;
  const sort = searchParams.sort;
  const order = searchParams.order === "asc" ? asc : desc;

  const data = await db
    .select({
        id: varieties.id,
        name: varieties.name,
        species: varieties.species,
        breeder: varieties.breederReference,
        createdAt: varieties.createdAt,
        orgName: organisations.name,
        orgId: organisations.id
    })
    .from(varieties)
    .leftJoin(organisations, eq(varieties.organisationId, organisations.id))
    .orderBy(desc(varieties.createdAt))
    .limit(pageSize)
    .offset(offset);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold tracking-tight">Master Varieties List</h1>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variety Name</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Breeder</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((variety) => (
              <TableRow key={variety.id}>
                <TableCell className="font-medium">{variety.name}</TableCell>
                <TableCell>{variety.species}</TableCell>
                <TableCell>{variety.breeder}</TableCell>
                <TableCell>{variety.orgName}</TableCell>
                <TableCell>{format(variety.createdAt, "PP")}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/varieties/${variety.id}?from=admin_varieties`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No varieties found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
