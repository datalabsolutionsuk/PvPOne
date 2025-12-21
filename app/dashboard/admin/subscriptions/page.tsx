import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, payments, organisations } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { year?: string; plan?: string; view?: string; page?: string };
}) {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
  }

  const year = searchParams.year ? parseInt(searchParams.year) : new Date().getFullYear();
  const planFilter = searchParams.plan || "all";
  const view = searchParams.view || "subscriptions";
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = 7;
  const offset = (page - 1) * pageSize;

  // --- Subscriptions Logic ---
  let subscriptionsData: {
    id: string;
    orgName: string | null;
    plan: string;
    status: string;
    provider: string | null;
    startDate: Date;
    endDate: Date | null;
  }[] = [];
  let totalSubscriptions = 0;

  if (view === "subscriptions") {
    const allSubs = await db
      .select({
        id: subscriptions.id,
        orgName: organisations.name,
        plan: subscriptions.plan,
        status: subscriptions.status,
        provider: subscriptions.provider,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
      })
      .from(subscriptions)
      .leftJoin(organisations, eq(subscriptions.organisationId, organisations.id))
      .orderBy(desc(subscriptions.createdAt));

    const filtered = planFilter === "all" 
      ? allSubs 
      : allSubs.filter(s => s.plan === planFilter);
    
    totalSubscriptions = filtered.length;
    subscriptionsData = filtered.slice(offset, offset + pageSize);
  }

  // --- Payments Logic ---
  let paymentsData: {
    id: string;
    orgName: string | null;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    date: Date;
  }[] = [];
  let totalPayments = 0;

  if (view === "payments") {
    const allPayments = await db
      .select({
        id: payments.id,
        orgName: organisations.name,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        provider: payments.provider,
        date: payments.createdAt,
      })
      .from(payments)
      .leftJoin(organisations, eq(payments.organisationId, organisations.id))
      .where(sql`EXTRACT(YEAR FROM ${payments.createdAt}) = ${year}`)
      .orderBy(desc(payments.createdAt));
    
    totalPayments = allPayments.length;
    paymentsData = allPayments.slice(offset, offset + pageSize);
  }

  // Get available years for filter (always needed for payments view context)
  const allPaymentDates = await db
    .select({ date: payments.createdAt })
    .from(payments);
    
  const years = Array.from(new Set(allPaymentDates.map(p => p.date.getFullYear()))).sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  const totalPages = view === "subscriptions" 
    ? Math.ceil(totalSubscriptions / pageSize) 
    : Math.ceil(totalPayments / pageSize);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <h1 className="text-3xl font-bold">Subscriptions & Billing</h1>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <Button 
            variant={view === "subscriptions" ? "default" : "ghost"} 
            size="sm" 
            asChild
          >
            <Link href={`/dashboard/admin/subscriptions?view=subscriptions`}>Subscriptions</Link>
          </Button>
          <Button 
            variant={view === "payments" ? "default" : "ghost"} 
            size="sm" 
            asChild
          >
            <Link href={`/dashboard/admin/subscriptions?view=payments`}>Payments</Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {view === "subscriptions" ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>Active Subscriptions</CardTitle>
                <div className="flex gap-2">
                  <Button variant={planFilter === "all" ? "secondary" : "ghost"} size="sm" asChild>
                    <Link href={`/dashboard/admin/subscriptions?view=subscriptions&plan=all`}>All</Link>
                  </Button>
                  <Button variant={planFilter === "Professional" ? "secondary" : "ghost"} size="sm" asChild>
                    <Link href={`/dashboard/admin/subscriptions?view=subscriptions&plan=Professional`}>Professional</Link>
                  </Button>
                  <Button variant={planFilter === "Enterprise" ? "secondary" : "ghost"} size="sm" asChild>
                    <Link href={`/dashboard/admin/subscriptions?view=subscriptions&plan=Enterprise`}>Enterprise</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptionsData.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.orgName || "Unknown"}</TableCell>
                        <TableCell>{sub.plan}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.provider}</TableCell>
                        <TableCell>{sub.startDate?.toLocaleDateString()}</TableCell>
                        <TableCell>{sub.endDate?.toLocaleDateString() || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages || 1}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page <= 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={`/dashboard/admin/subscriptions?view=subscriptions&plan=${planFilter}&page=${page - 1}`}>Previous</Link>
                  ) : "Previous"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <Link href={`/dashboard/admin/subscriptions?view=subscriptions&plan=${planFilter}&page=${page + 1}`}>Next</Link>
                  ) : "Next"}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>Recent Payments</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Year:</span>
                  <div className="flex gap-1">
                    {years.map((y) => (
                      <Button
                        key={y}
                        variant={year === y ? "secondary" : "ghost"}
                        size="sm"
                        asChild
                      >
                        <Link href={`/dashboard/admin/subscriptions?view=payments&year=${y}`}>{y}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No payments found for {year}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentsData.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.orgName || "Unknown"}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "succeeded" ? "default" : "destructive"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{payment.provider}</TableCell>
                        <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages || 1}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page <= 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={`/dashboard/admin/subscriptions?view=payments&year=${year}&page=${page - 1}`}>Previous</Link>
                  ) : "Previous"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <Link href={`/dashboard/admin/subscriptions?view=payments&year=${year}&page=${page + 1}`}>Next</Link>
                  ) : "Next"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
