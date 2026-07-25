import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bookmark, Check, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "@/lib/labels";

type Option = { id: string; label: string };

/** Filter keys owned by this bar — `view`, `sort`, `dir` and `page` are not. */
const FILTER_KEYS = ["q", "status", "priority", "manager", "client", "type"];

const SAVED_VIEWS_KEY = "silverline.projects.saved-views";

type SavedView = { name: string; query: string };

function readSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as SavedView).name === "string" &&
        typeof (v as SavedView).query === "string"
    );
  } catch {
    return [];
  }
}

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: Option[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "h-9 w-[128px] text-[13px]"}>
        {/* The label doubles as a placeholder; a chosen value takes the space. */}
        {value === "all" && (
          <span className="mr-1 text-muted-foreground">{label}</span>
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectsFilters({
  managers,
  clients,
}: {
  managers: Option[];
  clients: Option[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [savedViews, setSavedViews] = useState<SavedView[]>(readSavedViews);
  const [saveOpen, setSaveOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) {
        setParam("q", search || null);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, setParam, searchParams]);

  // Keep the input in step when a saved view or Clear rewrites the URL.
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const hasFilters = FILTER_KEYS.some((k) => !!searchParams.get(k));

  function persistViews(next: SavedView[]) {
    setSavedViews(next);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
  }

  function currentFilterQuery(): string {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    return params.toString();
  }

  function saveCurrentView() {
    const name = newViewName.trim();
    if (!name) return;
    const query = currentFilterQuery();
    const next = [
      ...savedViews.filter((v) => v.name !== name),
      { name, query },
    ].sort((a, b) => a.name.localeCompare(b.name));
    persistViews(next);
    setSaveOpen(false);
    setNewViewName("");
    toast.success(`Saved view “${name}”`);
  }

  function applyView(view: SavedView) {
    setSearchParams(new URLSearchParams(view.query), { replace: true });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) params.delete(key);
    params.delete("page");
    setSearchParams(params, { replace: true });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[190px]">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="h-9 pl-8"
          />
        </div>

        <FilterSelect
          label="Status"
          value={searchParams.get("status") ?? "all"}
          onChange={(v) => setParam("status", v)}
          allLabel="All"
          options={PROJECT_STATUSES.map((s) => ({
            id: s,
            label: PROJECT_STATUS_LABELS[s],
          }))}
        />
        <FilterSelect
          label="Priority"
          value={searchParams.get("priority") ?? "all"}
          onChange={(v) => setParam("priority", v)}
          allLabel="All"
          options={PRIORITIES.map((p) => ({
            id: p,
            label: PRIORITY_LABELS[p],
          }))}
          className="h-9 w-[125px] text-[13px]"
        />
        <FilterSelect
          label="Manager"
          value={searchParams.get("manager") ?? "all"}
          onChange={(v) => setParam("manager", v)}
          allLabel="All"
          options={managers}
          className="h-9 w-[135px] text-[13px]"
        />
        <FilterSelect
          label="Client"
          value={searchParams.get("client") ?? "all"}
          onChange={(v) => setParam("client", v)}
          allLabel="All"
          options={clients}
          className="h-9 w-[135px] text-[13px]"
        />
        <FilterSelect
          label="Project Type"
          value={searchParams.get("type") ?? "all"}
          onChange={(v) => setParam("type", v)}
          allLabel="All"
          options={PROJECT_TYPES.map((t) => ({
            id: t,
            label: PROJECT_TYPE_LABELS[t],
          }))}
          className="h-9 w-[150px] text-[13px]"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={clearAll}
          >
            Clear filters
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-9">
              <Bookmark className="size-3.5" />
              Saved views
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            {savedViews.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No saved views yet.
              </p>
            ) : (
              savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.name}
                  onSelect={() => applyView(view)}
                  className="group justify-between"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Check
                      className={
                        view.query === currentFilterQuery()
                          ? "size-3.5 shrink-0"
                          : "size-3.5 shrink-0 opacity-0"
                      }
                    />
                    <span className="truncate">{view.name}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete view ${view.name}`}
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      persistViews(
                        savedViews.filter((v) => v.name !== view.name)
                      );
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setNewViewName("");
                setSaveOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Save current view
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
            <DialogDescription>
              Stores the active filters under a name, on this browser only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="view-name">View name</Label>
            <Input
              id="view-name"
              autoFocus
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveCurrentView();
                }
              }}
              placeholder="e.g. My overdue WML files"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCurrentView} disabled={!newViewName.trim()}>
              Save view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
