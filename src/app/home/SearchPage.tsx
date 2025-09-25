"use client";

import { useState, useRef } from "react";
import { Box, Typography, TextField, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import { PyrenzCard, PyrenzBlueButton } from "~/theme";

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
          disabled={!query.trim()}
          sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
        >
          Search
        </PyrenzBlueButton>
      </Box>

      {Object.keys(resultsBySpider).length > 0 ? (
        Object.entries(resultsBySpider).map(([spiderId, { displayName, data }]) => (
          <Box key={spiderId} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Results from: {displayName}
            </Typography>
            {data.error ? (
              <Typography color="error">{data.error}</Typography>
            ) : data.results && data.results.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  gap: 2,
                  pb: 1,
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                }}
              >
                {data.results.map((item, idx) => (
                  <PyrenzCard key={idx} sx={{ minWidth: 300, display: "flex", flexShrink: 0, gap: 1 }}>
                    {item.manga_image && (
                      <Box sx={{ width: 100, flexShrink: 0 }}>
                        <Box
                          component="img"
                          src={item.manga_image}
                          alt={item.manga_name || "preview"}
                          sx={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 1 }}
                        />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      {item.manga_name && <Typography variant="subtitle1">{item.manga_name}</Typography>}
                      {item.genres?.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                          {item.genres.slice(0, 5).map((genre: string, i: number) => (
                            <Chip key={i} label={genre} size="small" />
                          ))}
                        </Box>
                      )}
                      {item.manga_id && (
                        <PyrenzBlueButton
                          size="small"
                          onClick={() => {
                            const searchParams = new URLSearchParams({
                              manga_id: item.manga_id,
                              spiderId,
                            }).toString();
                            router.push(`/view?${searchParams}`);
                          }}
                          sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
                        >
                          View
                        </PyrenzBlueButton>
                      )}
                    </Box>
                  </PyrenzCard>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">{data.warning || "No results found"}</Typography>
            )}
          </Box>
        ))
      ) : (
        hasSearched && !loading && <Typography color="text.secondary">No results found</Typography>
      )}
    </Box>
  );
}
