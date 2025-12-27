"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function PaginationLimitSelect({ pageParam = "page" }: { pageParam?: string | string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLimit = searchParams.get("limit") || "5";

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", value);
    
    const paramsToReset = Array.isArray(pageParam) ? pageParam : [pageParam];
    paramsToReset.forEach(p => params.set(p, "1"));

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Rows per page</span>
      <Select
        value={currentLimit}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue placeholder={currentLimit} />
        </SelectTrigger>
        <SelectContent side="top">
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="15">15</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
