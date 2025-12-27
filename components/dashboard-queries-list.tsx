"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationLimitSelect } from "@/components/pagination-limit-select";
import { ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getDashboardQueries } from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";

type DashboardQuery = {
  query: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  application: {
    id: string;
    referenceNumber: string | null;
    variety: { name: string } | null;
  };
};

export function DashboardQueriesList({
  initialQueries,
  totalQueries,
  page,
  limit
}: {
  initialQueries: any[];
  totalQueries: number;
  page: number;
  limit: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queries, setQueries] = useState<any[]>(initialQueries);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await getDashboardQueries(page, limit);
        setQueries(fresh);
      } catch (e) {
        console.error("Polling dashboard queries failed", e);
      }
    }, 10000); // Poll every 10 seconds for dashboard

    return () => clearInterval(interval);
  }, [page, limit]);

  // Update when props change (e.g. navigation)
  useEffect(() => {
    setQueries(initialQueries);
  }, [initialQueries]);

  const totalPages = Math.ceil(totalQueries / limit);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const fresh = await getDashboardQueries(page, limit);
    setQueries(fresh);
    setIsRefreshing(false);
    router.refresh();
  };

  return (
    <Card className="border-none shadow-sm flex flex-col h-full overflow-hidden">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>Recent Queries</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleManualRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {queries.length === 0 ? (
            <p className="text-sm text-gray-500">No recent queries.</p>
          ) : (
            queries.map(({ query, application }) => (
              <Link 
                key={query.id} 
                href={`/dashboard/applications/${application.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold truncate max-w-[150px]">{query.title}</h4>
                    <p className="text-sm text-muted-foreground">{application.referenceNumber || application.variety?.name || "App"}</p>
                  </div>
                  <Badge variant={query.status === "Open" ? "default" : "secondary"}>
                    {query.status}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {format(new Date(query.updatedAt), "MMM d, h:mm a")}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.max(1, totalPages)}
          </div>
          <PaginationLimitSelect pageParam={["statusPage", "deadlinesPage", "queriesPage"]} />
          <div className="flex gap-2">
            <Link
              href={`/dashboard?queriesPage=${Math.max(1, page - 1)}&statusPage=${searchParams.get("statusPage") || 1}&deadlinesPage=${searchParams.get("deadlinesPage") || 1}&limit=${limit}`}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <Button variant="outline" size="icon" disabled={page <= 1} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href={`/dashboard?queriesPage=${Math.min(totalPages, page + 1)}&statusPage=${searchParams.get("statusPage") || 1}&deadlinesPage=${searchParams.get("deadlinesPage") || 1}&limit=${limit}`}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              <Button variant="outline" size="icon" disabled={page >= totalPages} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
