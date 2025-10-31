"use client";

import { Box, Typography, Chip } from "@mui/material";
import { PyrenzCard, PyrenzBlueButton } from "~/components/renderer/theme";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type SpiderData = {
  results?: any[];
  error?: string;
  warning?: string;
};

type SpiderEntry = [string, { displayName: string; data: SpiderData }];

export function SearchResults({
  entries,
  hasSearched,
  loading,
  router,
}: {
  entries: SpiderEntry[];
  hasSearched: boolean;
  loading: boolean;
  router: AppRouterInstance;
}) {
  if (entries.length > 0) {
    return (
      <>
        {entries.map(([spiderId, { displayName, data }]) => (
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
        ))}
      </>
    );
  }

  if (hasSearched && !loading) {
    return <Typography color="text.secondary">No results found</Typography>;
  }

  return null;
}
