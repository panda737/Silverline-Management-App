import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ClientsSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) {
        const params = new URLSearchParams(searchParams);
        if (search) params.set("q", search);
        else params.delete("q");
        setSearchParams(params, { replace: true });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, searchParams, setSearchParams]);

  return (
    <div className="relative w-full sm:w-56">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients..."
        className="h-8 pl-8"
      />
    </div>
  );
}
