"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, Chip, Button, CircularProgress, Avatar, IconButton } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { getReaderUrl } from "@database/client/init";

type MangaChapter = { title: string; chapter: number };

type MangaDetails = {
  manga_id?: string;
  manga_name?: string;
  manga_description?: string;
  manga_image?: string;
  genres?: string[];
  manga_chapters?: MangaChapter[];
  max_chapters?: number;
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
    getReaderUrl().then(setConnectionUrl).catch(() => setError("Failed to get reader URL"));
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
        const data: { spiderId: string; results?: MangaDetails[]; error?: string } = await res.json();

        if (data.error) throw new Error(data.error);
        if (!data.results || data.results.length === 0) throw new Error("No manga details found");

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

  const chapterCount = details.manga_chapters?.length ?? 0;

  return (
    <Box>
      {details.manga_image && (
        <Box
          sx={{
            width: "100%",
            minHeight: 350,
            position: "relative",
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${details.manga_image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "#fff",
            display: "flex",
            alignItems: "flex-end",
            p: 2,
          }}
        >
          <IconButton
            sx={{ position: "absolute", top: 16, left: 16, color: "#fff", zIndex: 10 }}
            onClick={() => router.push("/")}
          >
            <ChevronLeftIcon fontSize="large" />
          </IconButton>

          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Avatar
              src={details.manga_image}
              alt={details.manga_name}
              variant="rounded"
              sx={{ width: 140, height: 200, borderRadius: 2, flexShrink: 0 }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: "60%" }}>
              <Typography variant="h4">{details.manga_name}</Typography>
              {details.manga_description && details.manga_description.trim() !== "" && (
                <Typography sx={{ mt: 1, fontSize: 14 }}>{details.manga_description}</Typography>
              )}
              {details.genres && details.genres.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {details.genres.map((g, i) => (
                    <Chip
                      key={i}
                      label={g}
                      size="small"
                      sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
                    />
                  ))}
                </Box>
              )}
              <Button
                variant="contained"
                sx={{ mt: 2, width: 160, backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" } }}
              >
                Add to Library
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Chapters ({chapterCount} / {details.max_chapters ?? chapterCount})
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {details.manga_chapters?.map((ch, i) => (
            <Button
              key={i}
              variant="outlined"
              sx={{ justifyContent: "flex-start" }}
              onClick={() =>
                router.push(
                  `/read?chapter=${i + 1}&manga_id=${details.manga_id}&spiderId=${spiderIdParam}`
                )
              }
            >
              Chapter {i + 1}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
