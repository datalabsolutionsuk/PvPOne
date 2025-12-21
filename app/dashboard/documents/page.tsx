import { db } from "@/lib/db";
import { documents, applications, varieties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
import { getCurrentOrganisationId } from "@/lib/context";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  if (!organisationId) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  let data: any[] = [];
  try {
    data = await db
      .select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        createdAt: documents.createdAt,
        appNumber: applications.applicationNumber,
        varietyName: varieties.name,
      })
      .from(documents)
      .leftJoin(applications, eq(documents.applicationId, applications.id))
      .leftJoin(varieties, eq(applications.varietyId, varieties.id))
      .where(eq(documents.organisationId, organisationId))
      .orderBy(desc(documents.createdAt));
  } catch (e) {
    console.error("Failed to fetch documents", e);
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = data.slice(offset, offset + pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <Button asChild>
          <Link href="/dashboard/documents/upload">Upload Document</Link>
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Related Application</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    {item.appNumber ? (
                      <div className="flex flex-col">
                        <span>{item.appNumber}</span>
                        <span className="text-xs text-gray-500">{item.varietyName}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {format(item.createdAt, "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No documents found.
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/dashboard/documents?page=${page - 1}`}>Previous</Link>
              ) : "Previous"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/dashboard/documents?page=${page + 1}`}>Next</Link>
              ) : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
