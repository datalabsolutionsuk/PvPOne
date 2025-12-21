import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, payments } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cancelSubscription } from "@/lib/subscription-actions";
import Link from "next/link";

export default async function ClientSubscriptionPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await auth();
  if (!session?.user?.organisationId) {
    redirect("/dashboard");
  }

  const orgId = session.user.organisationId;
  const year = searchParams.year ? parseInt(searchParams.year) : new Date().getFullYear();

  // Fetch current subscription
  const currentSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organisationId, orgId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  // Fetch payment history filtered by year
  const paymentHistory = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.organisationId, orgId),
        sql`EXTRACT(YEAR FROM ${payments.createdAt}) = ${year}`
      )
    )
    .orderBy(desc(payments.createdAt));

  // Get available years for filter
  const allPayments = await db
    .select({ date: payments.createdAt })
    .from(payments)
    .where(eq(payments.organisationId, orgId));
    
  const years = Array.from(new Set(allPayments.map(p => p.date.getFullYear()))).sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing</h1>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription and billing details</CardDescription>
              </div>
              {currentSubscription && (
                <Badge variant={currentSubscription.status === "active" ? "default" : "destructive"}>
                  {currentSubscription.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSubscription ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">{currentSubscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">
                    {currentSubscription.plan === "Professional" ? "$49/mo" : 
                     currentSubscription.plan === "Enterprise" ? "Custom" : "$0/mo"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p>{currentSubscription.startDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Renewal</p>
                  <p>{currentSubscription.endDate?.toLocaleDateString() || "N/A"}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You are currently on the Free Starter plan.</p>
                <Button asChild>
                  <Link href="/#pricing">Upgrade Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
          {currentSubscription && currentSubscription.status === "active" && (
            <CardFooter className="flex gap-4 border-t pt-6">
              <form action={async () => {
                "use server";
                // Mock upgrade action call
                console.log("Upgrade clicked");
              }}>
                 <Button variant="default">Upgrade Plan</Button>
              </form>
              
              <form action={cancelSubscription.bind(null, currentSubscription.id)}>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Cancel Subscription
                </Button>
              </form>
            </CardFooter>
          )}
        </Card>

        {/* Payment History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment History</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by Year:</span>
              <div className="flex gap-1">
                {years.map((y) => (
                  <Button
                    key={y}
                    variant={year === y ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link href={`/dashboard/subscription?year=${y}`}>{y}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No payments found for {year}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "succeeded" ? "outline" : "destructive"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{payment.provider}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Download</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
