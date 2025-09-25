"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, Chip, Button, CircularProgress } from "@mui/material";
import { getReaderUrl } from "~/lib/storage";

type MangaChapter = { title: string; url: string };

type MangaDetails = {
  manga_id: string;
  manga_name?: string;
  manga_description?: string;
  manga_image?: string;
  genres?: string[];
  manga_chapters?: MangaChapter[];
};

export default function ViewPage() {
  const router = useRouter();
  const params = useSearchParams();
  const mangaIdParam = params.get("manga_id") ?? "";
  const spiderIdParam = params.get("spiderId") ?? "";

  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [details, setDetails] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: Array<keyof MangaDetails> = [
    "manga_id",
    "manga_name",
    "manga_description",
    "manga_image",
    "genres",
    "manga_chapters",
  ];

  useEffect(() => {
    getReaderUrl()
      .then(setConnectionUrl)
      .catch(() => setError("Failed to get reader URL"));
  }, []);

  useEffect(() => {
    if (!connectionUrl || !mangaIdParam || !spiderIdParam) return;

    const fetchManga = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/manga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manga_id: mangaIdParam,
            connectionUrl,
            spiderId: spiderIdParam,
            fields,
          }),
        });

        if (!res.ok) throw new Error("Failed to fetch manga details");
        const data: { spiderId: string; results?: MangaDetails[]; error?: string } =
          await res.json();

        if (data.error) throw new Error(data.error);
        if (!data.results || data.results.length === 0)
          throw new Error("No manga details found");

        setDetails(data.results[0]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [connectionUrl, mangaIdParam, spiderIdParam]);

  if (loading) {
    return (
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!details) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Enter a manga to view details</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4">{details.manga_name}</Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        {details.manga_image && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              component="img"
              src={details.manga_image}
              alt={details.manga_name}
              sx={{ width: 200, height: 300, objectFit: "cover", borderRadius: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
            >
              Add to Library
            </Button>
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {details.genres?.slice(0, 10).map((g, i) => (
              <Chip key={i} label={g} size="small" />
            ))}
          </Box>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Chapters
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {details.manga_chapters?.map((ch, i) => (
            <Button
              key={i}
              variant="outlined"
              sx={{ justifyContent: "flex-start" }}
              onClick={() => {
                router.push(
                  `/read?chapter=${encodeURIComponent(ch.url)}&manga_id=${details.manga_id}&spiderId=${spiderIdParam}`
                );
              }}
            >
              {ch.title}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
