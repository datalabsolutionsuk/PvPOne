"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation"; // Correct imports for App Router
import { useDebouncedCallback } from "use-debounce";

export function MaintenanceSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        className="pl-9 w-[300px]"
        placeholder="Search by Variety or App ID..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
      />
    </div>
  );
}
