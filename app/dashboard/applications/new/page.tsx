import { db } from "@/lib/db";
import { varieties, jurisdictions } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewApplicationForm } from "./form";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const allVarieties = await db.select().from(varieties);
  const allJurisdictions = await db.select().from(jurisdictions);

  const isDus = searchParams.type === 'DUS';

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href={isDus ? "/dashboard/applications?status=DUS" : "/dashboard/applications"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{isDus ? "New DUS Record" : "New Application"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isDus ? "DUS Details" : "Application Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewApplicationForm 
            varieties={allVarieties} 
            jurisdictions={allJurisdictions} 
            type={searchParams.type}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
