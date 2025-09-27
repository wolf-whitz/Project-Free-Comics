"use client";

import { useState, useRef } from "react";
import { Box, Typography, TextField, ButtonGroup } from "@mui/material";
import { useRouter } from "next/navigation";
import { PyrenzBlueButton } from "~/theme";
import { SearchResults } from "~/components";

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

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const fieldsParam = SELECTED_FIELDS.join(",");
    const sseUrl = `/api/search?query=${encodeURIComponent(query)}&fields=${encodeURIComponent(fieldsParam)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: {
          spiderId: string;
          displayName: string;
          results?: any[];
          error?: string;
          warning?: string;
        } = JSON.parse(event.data);

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

  const filteredEntries = Object.entries(resultsBySpider).filter(([_, { data }]) => {
    if (filter === "hasResult") {
      return data.results && data.results.length > 0;
    }
    return true;
  });

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Enter search query"
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <PyrenzBlueButton
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
        >
          {loading ? "Searching..." : "Search"}
        </PyrenzBlueButton>
      </Box>

      {Object.keys(resultsBySpider).length > 0 && (
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <ButtonGroup>
            <PyrenzBlueButton
              onClick={() => setFilter("all")}
              disabled={filter === "all"}
              sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
            >
              All
            </PyrenzBlueButton>
            <PyrenzBlueButton
              onClick={() => setFilter("hasResult")}
              disabled={filter === "hasResult"}
              sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
            >
              Has Result
            </PyrenzBlueButton>
          </ButtonGroup>
        </Box>
      )}

      <SearchResults
        entries={filteredEntries}
        hasSearched={hasSearched}
        loading={loading}
        router={router}
      />
    </Box>
  );
}
