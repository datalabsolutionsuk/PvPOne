import { db } from "@/lib/db";
import { varieties } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";
import { PaginationLimitSelect } from "@/components/pagination-limit-select";
import { SortableColumn } from "@/components/ui/sortable-column";

export default async function VarietiesPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; sort?: string; order?: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  const isSuper = await isSuperAdmin();
  
  if (!organisationId && !isSuper) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 5;
  const offset = (page - 1) * pageSize;
  const sort = searchParams.sort;
  const order = searchParams.order === "asc" ? asc : desc;

  let data: any[] = [];
  try {
    const query = db
      .select()
      .from(varieties);
      
    if (organisationId) {
      query.where(eq(varieties.organisationId, organisationId));
    }
    
    let orderBy = desc(varieties.createdAt);
    if (sort === "name") orderBy = order(varieties.name);
    else if (sort === "species") orderBy = order(varieties.species);
    else if (sort === "type") orderBy = order(varieties.varietyType);
    else if (sort === "breederRef") orderBy = order(varieties.breederReference);
    else if (sort === "createdAt") orderBy = order(varieties.createdAt);

    data = await query.orderBy(orderBy);
  } catch (e) {
    console.error("Failed to fetch varieties", e);
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = data.slice(offset, offset + pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Varieties</h2>
        <Button asChild>
          <Link href="/dashboard/varieties/new">New Variety</Link>
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead><SortableColumn title="Name" column="name" /></TableHead>
                <TableHead><SortableColumn title="Species" column="species" /></TableHead>
                <TableHead><SortableColumn title="Type" column="type" /></TableHead>
                <TableHead><SortableColumn title="Breeder Ref" column="breederRef" /></TableHead>
                <TableHead><SortableColumn title="Created At" column="createdAt" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.species}</TableCell>
                  <TableCell>{item.varietyType}</TableCell>
                  <TableCell>{item.breederReference}</TableCell>
                  <TableCell>
                    {format(item.createdAt, "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/varieties/${item.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No varieties found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1} ({totalItems} total)
          </div>
          <PaginationLimitSelect />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/dashboard/varieties?page=${page - 1}&limit=${pageSize}`}>Previous</Link>
              ) : "Previous"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/dashboard/varieties?page=${page + 1}&limit=${pageSize}`}>Next</Link>
              ) : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
