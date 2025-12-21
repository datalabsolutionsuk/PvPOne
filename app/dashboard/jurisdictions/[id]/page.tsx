import { db } from "@/lib/db";
import { jurisdictions, rulesets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function JurisdictionDetailsPage({ params }: { params: { id: string } }) {
  const [jurisdiction] = await db
    .select()
    .from(jurisdictions)
    .where(eq(jurisdictions.id, params.id));

  if (!jurisdiction) {
    notFound();
  }

  const rulesetList = await db
    .select()
    .from(rulesets)
    .where(eq(rulesets.jurisdictionId, params.id));

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{jurisdiction.name}</h2>
          <p className="text-muted-foreground">
            Code: {jurisdiction.code} | Currency: {jurisdiction.currencyCode}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/jurisdictions/${jurisdiction.id}/rulesets/new`}>
            Add Rule Set
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rulesetList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.version}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/rulesets/${item.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rulesetList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No rule sets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
