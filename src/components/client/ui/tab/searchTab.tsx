"use client";

import { Box, Typography, TextField, ButtonGroup } from "@mui/material";
import { PyrenzBlueButton } from "@components/renderer/theme";
import { SearchResults } from "@components/client";

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

type SearchTabProps = {
  query: string;
  setQuery: (q: string) => void;
  handleSearch: () => void;
  loading: boolean;
  resultsBySpider: SpiderResults;
  filter: "all" | "hasResult";
  setFilter: (f: "all" | "hasResult") => void;
  filteredEntries: [string, { displayName: string; data: SpiderData }][];
  hasSearched: boolean;
  router: any;
};

export function SearchTab({
  query,
  setQuery,
  handleSearch,
  loading,
  resultsBySpider,
  filter,
  setFilter,
  filteredEntries,
  hasSearched,
  router,
}: SearchTabProps) {
  return (
    <>
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
          sx={{
            backgroundColor: "#1976d2",
            "&:hover": { backgroundColor: "#1565c0" },
          }}
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
              sx={{
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              All
            </PyrenzBlueButton>
            <PyrenzBlueButton
              onClick={() => setFilter("hasResult")}
              disabled={filter === "hasResult"}
              sx={{
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
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
    </>
  );
}
