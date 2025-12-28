import { db } from "@/lib/db";
import { documents, applications, varieties, tasks, jurisdictions, users } from "@/db/schema";
import { eq, desc, asc, and, aliasedTable, sql, or } from "drizzle-orm";
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
import { SortableColumn } from "@/components/ui/sortable-column";
import { SearchInput } from "@/components/ui/search-input";
import { HighlightedText } from "@/components/ui/highlighted-text";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { 
    page?: string; 
    limit?: string; 
    pendingPage?: string;
    sort?: string;
    order?: string;
    pendingSort?: string;
    pendingOrder?: string;
    query?: string;
  };
}) {
  const organisationId = await getCurrentOrganisationId();
  const superAdmin = await isSuperAdmin();
  const isImpersonating = cookies().has("admin_org_context");

  if (!organisationId && !superAdmin) {
    return <div>Unauthorized</div>;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pendingPage = searchParams.pendingPage ? parseInt(searchParams.pendingPage) : 1;
  const pageSize = searchParams.limit ? parseInt(searchParams.limit) : 5;
  const offset = (page - 1) * pageSize;
  const pendingOffset = (pendingPage - 1) * pageSize;

  const sort = searchParams.sort;
  const order = searchParams.order === "asc" ? asc : desc;
  const pendingSort = searchParams.pendingSort;
  const pendingOrder = searchParams.pendingOrder === "asc" ? asc : desc;
  const queryText = searchParams.query;

  let uploadedDocs: any[] = [];
  let requiredDocs: any[] = [];
  let totalPending = 0;
  let totalUploaded = 0;

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

    if (queryText) {
      uploadedConditions.push(
        or(
          sql`${documents.name} ILIKE ${`%${queryText}%`}`,
          sql`${documents.type} ILIKE ${`%${queryText}%`}`,
          sql`${applications.applicationNumber} ILIKE ${`%${queryText}%`}`
        )
      );

      requiredConditions.push(
        or(
          sql`${tasks.title} ILIKE ${`%${queryText}%`}`,
          sql`${varieties.name} ILIKE ${`%${queryText}%`}`,
          sql`${jurisdictions.code} ILIKE ${`%${queryText}%`}`
        )
      );
    }

    const creator = aliasedTable(users, "creator");
    const updater = aliasedTable(users, "updater");

    // Count queries
    const [uploadedCount, requiredCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .leftJoin(applications, eq(documents.applicationId, applications.id))
        .where(and(...uploadedConditions)),
      db.select({ count: sql<number>`count(*)` })
        .from(tasks)
        .innerJoin(applications, eq(tasks.applicationId, applications.id))
        .innerJoin(varieties, eq(applications.varietyId, varieties.id))
        .innerJoin(jurisdictions, eq(applications.jurisdictionId, jurisdictions.id))
        .where(and(...requiredConditions))
    ]);

    totalUploaded = Number(uploadedCount[0].count);
    totalPending = Number(requiredCount[0].count);

    // Uploaded Query Order
    let uploadedOrderBy = desc(documents.createdAt);
    if (sort === "name") uploadedOrderBy = order(documents.name);
    else if (sort === "type") uploadedOrderBy = order(documents.type);
    else if (sort === "owner") uploadedOrderBy = order(documents.owner);
    else if (sort === "appNumber") uploadedOrderBy = order(applications.applicationNumber);
    else if (sort === "createdAt") uploadedOrderBy = order(documents.createdAt);

    // Required Query Order
    let requiredOrderBy = asc(tasks.dueDate);
    if (pendingSort === "title") requiredOrderBy = pendingOrder(tasks.title);
    else if (pendingSort === "application") requiredOrderBy = pendingOrder(varieties.name);
    else if (pendingSort === "dueDate") requiredOrderBy = pendingOrder(tasks.dueDate);
    else if (pendingSort === "status") requiredOrderBy = pendingOrder(tasks.status);

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
        .orderBy(uploadedOrderBy)
        .limit(pageSize)
        .offset(offset),
      
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
        .orderBy(requiredOrderBy)
        .limit(pageSize)
        .offset(pendingOffset)
    ]);

    uploadedDocs = uploaded;
    requiredDocs = required;
  } catch (e) {
    console.error("Failed to fetch documents", e);
  }

  const totalPages = Math.ceil(totalUploaded / pageSize);
  const totalPendingPages = Math.ceil(totalPending / pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pr-2">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <div className="flex items-center gap-4">
          <SearchInput placeholder="Search documents..." />
          <Button asChild>
            <Link href="/dashboard/documents/upload">Upload Document</Link>
          </Button>
        </div>
      </div>

      {/* Required Documents Section */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <h3 className="text-xl font-semibold">Required Documents (Pending)</h3>
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="p-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead><SortableColumn title="Document" column="title" prefix="pending" /></TableHead>
                  <TableHead><SortableColumn title="Application" column="application" prefix="pending" /></TableHead>
                  <TableHead><SortableColumn title="Due Date" column="dueDate" prefix="pending" /></TableHead>
                  <TableHead><SortableColumn title="Status" column="status" prefix="pending" /></TableHead>
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
                      <TableCell className="font-medium py-1">
                        <HighlightedText text={item.title} query={queryText} />
                      </TableCell>
                      <TableCell className="py-1">
                        <Link href={`/dashboard/applications/${item.applicationId}`} className="hover:underline text-blue-600">
                          <HighlightedText text={item.varietyName} query={queryText} /> ({item.jurisdictionCode})
                        </Link>
                      </TableCell>
                      <TableCell className="py-1">
                        {item.dueDate ? format(item.dueDate, "PP") : "N/A"}
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-1">
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                          <Link href={`/dashboard/documents/upload?taskId=${item.id}&type=${item.title}`}>
                            <Upload className="mr-2 h-3 w-3" /> Upload
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              Page {pendingPage} of {totalPendingPages || 1} ({totalPending} total)
            </div>
            <PaginationLimitSelect pageParam={["page", "pendingPage"]} />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pendingPage <= 1}
                asChild={pendingPage > 1}
              >
                {pendingPage > 1 ? (
                  <Link href={`/dashboard/documents?pendingPage=${pendingPage - 1}&page=${page}&limit=${pageSize}${queryText ? `&query=${queryText}` : ''}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pendingPage >= totalPendingPages}
                asChild={pendingPage < totalPendingPages}
              >
                {pendingPage < totalPendingPages ? (
                  <Link href={`/dashboard/documents?pendingPage=${pendingPage + 1}&page=${page}&limit=${pageSize}${queryText ? `&query=${queryText}` : ''}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                )}
              </Button>
            </div>
          </div>
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
                  <TableHead><SortableColumn title="Name" column="name" /></TableHead>
                  <TableHead><SortableColumn title="Type" column="type" /></TableHead>
                  <TableHead><SortableColumn title="Owner" column="owner" /></TableHead>
                  <TableHead><SortableColumn title="Related Application" column="appNumber" /></TableHead>
                  <TableHead><SortableColumn title="Uploaded At" column="createdAt" /></TableHead>
                  {superAdmin && <TableHead>Created / Updated</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={superAdmin ? 7 : 6} className="text-center py-4 text-muted-foreground">
                      No documents uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  uploadedDocs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium py-2">
                        <HighlightedText text={item.name} query={queryText} />
                      </TableCell>
                      <TableCell className="py-2">
                        <HighlightedText text={item.type} query={queryText} />
                      </TableCell>
                      <TableCell className="py-2">{item.owner || "-"}</TableCell>
                      <TableCell className="py-2">
                        {item.appNumber ? (
                          <div className="flex flex-col">
                            <span>
                              <HighlightedText text={item.appNumber} query={queryText} />
                            </span>
                            <span className="text-xs text-gray-500">{item.varietyName}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {format(item.createdAt, "yyyy-MM-dd")}
                      </TableCell>
                      {superAdmin && (
                        <TableCell className="text-xs text-muted-foreground py-2">
                          <div>C: {item.createdAt ? format(item.createdAt, "yyyy-MM-dd") : "-"} {item.createdBy ? `(${item.createdBy})` : ""}</div>
                          <div>U: {item.updatedAt ? format(item.updatedAt, "yyyy-MM-dd") : "-"} {item.updatedBy ? `(${item.updatedBy})` : ""}</div>
                        </TableCell>
                      )}
                      <TableCell className="text-right py-2">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild className="h-8">
                            <Link href={`/dashboard/documents/${item.id}/edit`}>Edit</Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8">
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
              Page {page} of {totalPages || 1} ({totalUploaded} total)
            </div>
            <PaginationLimitSelect pageParam={["page", "pendingPage"]} />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/dashboard/documents?page=${page - 1}&pendingPage=${pendingPage}&limit=${pageSize}${queryText ? `&query=${queryText}` : ''}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/dashboard/documents?page=${page + 1}&pendingPage=${pendingPage}&limit=${pageSize}${queryText ? `&query=${queryText}` : ''}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
