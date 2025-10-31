"use client";

import { useState, useRef } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { useRouter } from "next/navigation";
import { SearchTab, ExtensionsTab  } from "@components/client";

type SpiderData = {
  results?: any[];
  error?: string;
  warning?: string;
};

type SpiderResults = {
  [spiderId: string]: {
    displayName: string;
    data: SpiderData;
  };
};

const SELECTED_FIELDS = ["manga_id", "manga_name", "genres", "manga_image"] as const;

export function SearchPage() {
  const [tabValue, setTabValue] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultsBySpider, setResultsBySpider] = useState<SpiderResults>({});
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<"all" | "hasResult">("all");
  const eventSourceRef = useRef<EventSource | null>(null);
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResultsBySpider({});
    setHasSearched(true);

    if (eventSourceRef.current) eventSourceRef.current.close();

    const fieldsParam = SELECTED_FIELDS.join(",");
    const sseUrl = `/api/search?query=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsParam)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.spiderId) return;

        setResultsBySpider((prev) => {
          const prevData = prev[data.spiderId]?.data || { results: [] };
          const updated: SpiderData = {
            results: prevData.results?.concat(data.results || []),
            error: data.error || prevData.error,
            warning: data.warning,
          };
          return {
            ...prev,
            [data.spiderId]: { displayName: data.displayName, data: updated },
          };
        });
      } catch {}
    };

    es.onerror = () => {
      setLoading(false);
      es.close();
      eventSourceRef.current = null;
    };

    es.addEventListener("done", () => {
      setLoading(false);
      es.close();
      eventSourceRef.current = null;
    });
  };

  const filteredEntries = Object.entries(resultsBySpider).filter(([_, { data }]) =>
    filter === "hasResult" ? data.results && data.results.length > 0 : true
  );

  return (
    <Box sx={{ p: 2 }}>
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab label="Search" />
        <Tab label="Extensions" />
      </Tabs>

      {tabValue === 0 && (
        <SearchTab
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          loading={loading}
          resultsBySpider={resultsBySpider}
          filter={filter}
          setFilter={setFilter}
          filteredEntries={filteredEntries}
          hasSearched={hasSearched}
          router={router}
        />
      )}

      {tabValue === 1 && <ExtensionsTab />}
    </Box>
  );
}
