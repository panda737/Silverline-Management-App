"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_KEYS = ["overview", "timeline", "documents", "deadlines", "activity"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  timeline: "Timeline",
  documents: "Documents",
  deadlines: "Deadlines",
  activity: "Activity",
};

/**
 * Single-card tab shell for the project detail. The tab strip lives in the card
 * header and the body swaps per tab. Sections are passed in as slots so data
 * fetching stays in the server component. Rendered for EVERY project type so the
 * skeleton is uniform — only the data inside each tab differs.
 */
export function ProjectTabs(slots: Record<TabKey, ReactNode>) {
  return (
    <Tabs defaultValue="overview" className="gap-0">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto overflow-y-hidden border-b border-border/70 px-3 pt-2.5 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList variant="line" className="h-auto gap-5 bg-transparent p-0">
            {TAB_KEYS.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="h-auto flex-none rounded-none px-0.5 pt-0 pb-2 text-[0.9375rem] text-muted-foreground transition-colors after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-primary after:transition-opacity hover:text-foreground data-active:text-foreground"
              >
                {TAB_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="p-4 sm:p-6">
          {TAB_KEYS.map((key) => (
            <TabsContent
              key={key}
              value={key}
              className="space-y-6 duration-200 data-[state=active]:animate-in data-[state=active]:fade-in-0"
            >
              {slots[key]}
            </TabsContent>
          ))}
        </div>
      </Card>
    </Tabs>
  );
}
