import { db } from "@/lib/db";
import { documents, applications, varieties, tasks, jurisdictions, users } from "@/db/schema";
import { eq, desc, and, aliasedTable } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { getCurrentOrganisationId, isSuperAdmin } from "@/lib/context";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { cookies } from "next/headers";
import { PaginationLimitSelect } from "@/components/pagination-limit-select";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();
  const isImpersonating = cookies().has("admin_org_context");

  if (!organisationId && !superAdmin) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 5;
  const offset = (page - 1) * pageSize;

  let uploadedDocs: any[] = [];
  let requiredDocs: any[] = [];

  try {
    const uploadedConditions = [];
    const requiredConditions = [
      eq(tasks.type, "DOCUMENT"),
      eq(tasks.status, "PENDING")
    ];

    if (organisationId && (!superAdmin || isImpersonating)) {
      uploadedConditions.push(eq(documents.organisationId, organisationId));
      requiredConditions.push(eq(applications.organisationId, organisationId));
    }

    const creator = aliasedTable(users, "creator");
    const updater = aliasedTable(users, "updater");

    const [uploaded, required] = await Promise.all([
      db
        .select({
          id: documents.id,
          name: documents.name,
          type: documents.type,
          owner: documents.owner,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
          appNumber: applications.applicationNumber,
          varietyName: varieties.name,
          createdBy: creator.name,
          updatedBy: updater.name,
        })
        .from(documents)
        .leftJoin(applications, eq(documents.applicationId, applications.id))
        .leftJoin(varieties, eq(applications.varietyId, varieties.id))
        .leftJoin(creator, eq(documents.uploadedBy, creator.id))
        .leftJoin(updater, eq(documents.updatedBy, updater.id))
        .where(and(...uploadedConditions))
        .orderBy(desc(documents.createdAt)),
      
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          dueDate: tasks.dueDate,
          status: tasks.status,
          appNumber: applications.applicationNumber,
          varietyName: varieties.name,
          jurisdictionCode: jurisdictions.code,
          applicationId: applications.id
        })
        .from(tasks)
        .innerJoin(applications, eq(tasks.applicationId, applications.id))
        .innerJoin(varieties, eq(applications.varietyId, varieties.id))
        .innerJoin(jurisdictions, eq(applications.jurisdictionId, jurisdictions.id))
        .where(and(...requiredConditions))
        .orderBy(tasks.dueDate)
    ]);

    uploadedDocs = uploaded;
    requiredDocs = required;
  } catch (e) {
    console.error("Failed to fetch documents", e);
  }

  const totalItems = uploadedDocs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedUploadedDocs = uploadedDocs.slice(offset, offset + pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pr-2">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <Button asChild>
          <Link href="/dashboard/documents/upload">Upload Document</Link>
        </Button>
      </div>

      {/* Required Documents Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Required Documents (Pending)</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requiredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No pending document requirements.
                    </TableCell>
                  </TableRow>
                ) : (
                  requiredDocs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/applications/${item.applicationId}`} className="hover:underline text-blue-600">
                          {item.varietyName} ({item.jurisdictionCode})
                        </Link>
                      </TableCell>
                      <TableCell>
                        {item.dueDate ? format(item.dueDate, "PP") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/documents/upload?taskId=${item.id}&type=${item.title}`}>
                            <Upload className="mr-2 h-4 w-4" /> Upload
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Documents Section */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <h3 className="text-xl font-semibold">Uploaded Documents</h3>
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="p-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Related Application</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  {superAdmin && <TableHead>Created / Updated</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUploadedDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={superAdmin ? 7 : 6} className="text-center py-4 text-muted-foreground">
                      No documents uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUploadedDocs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.owner || "-"}</TableCell>
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
                      {superAdmin && (
                        <TableCell className="text-xs text-muted-foreground">
                          <div>C: {item.createdAt ? format(item.createdAt, "yyyy-MM-dd") : "-"} {item.createdBy ? `(${item.createdBy})` : ""}</div>
                          <div>U: {item.updatedAt ? format(item.updatedAt, "yyyy-MM-dd") : "-"} {item.updatedBy ? `(${item.updatedBy})` : ""}</div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/documents/${item.id}/edit`}>Edit</Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
                  <Link href={`/dashboard/documents?page=${page - 1}&limit=${pageSize}`}>Previous</Link>
                ) : "Previous"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/dashboard/documents?page=${page + 1}&limit=${pageSize}`}>Next</Link>
                ) : "Next"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
