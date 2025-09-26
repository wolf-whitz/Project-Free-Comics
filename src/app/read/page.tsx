"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Slider, IconButton, Button, Typography } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { getReaderUrl } from "~/lib/storage";

interface Page {
  page: number;
  blobUrl: string;
}

export default function ReadPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const mangaId = params.get("manga_id") ?? "";
  const spiderId = params.get("spiderId") ?? "";
  const chapter = params.get("chapter") ?? "";
  const maxPagesParam = params.get("max_pages");
  const maxPages = maxPagesParam ? parseInt(maxPagesParam) : undefined;

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sliderVisible, setSliderVisible] = useState(true);
  const [finished, setFinished] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addPage = useCallback((page: Page) => {
    setPages(prev => {
      const merged = [...prev, page];
      merged.sort((a, b) => a.page - b.page);
      if (maxPages && merged.length >= maxPages) setFinished(true);
      return merged;
    });
    setLoading(false);
  }, [maxPages]);

  useEffect(() => {
    getReaderUrl().then(url => setConnectionUrl(url));
  }, []);

  useEffect(() => {
    if (!connectionUrl || !mangaId || !spiderId || !chapter) return;

    setPages([]);
    setCurrentPage(1);
    setLoading(true);
    setFinished(false);
    eventSourceRef.current?.close();

    const query = new URLSearchParams({
      connectionUrl,
      manga: mangaId,
      spiderId,
      chapter,
    }).toString();

    const es = new EventSource(`/api/chapter?${query}`);
    eventSourceRef.current = es;

    es.onmessage = async event => {
      if (!event.data) return;
      if (event.data === "done") {
        setFinished(true);
        es.close();
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.page && data.image) {
          const byteCharacters = atob(data.image.split(",")[1]);
          const byteNumbers = new Array(byteCharacters.length)
            .fill(0)
            .map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/webp" });
          const blobUrl = URL.createObjectURL(blob);
          addPage({ page: data.page, blobUrl });
        }
      } catch {}
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [connectionUrl, mangaId, spiderId, chapter, addPage]);

  const handleSliderChange = (_: Event, value: number | number[]) => {
    if (typeof value === "number") {
      setCurrentPage(value);
      const pageEl = document.getElementById(`page-${value}`);
      if (pageEl) pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Box sx={{ position: "relative", width: "100%", cursor: "pointer" }} onClick={() => setSliderVisible(v => !v)}>
      <IconButton
        sx={{ position: "fixed", top: 16, left: 16, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.4)", color: "#fff" }}
        onClick={() => router.push("/")}
      >
        <ChevronLeftIcon fontSize="large" />
      </IconButton>

      <Box display="flex" flexDirection="column" alignItems="center" width="100%" pb={10}>
        {pages.map(p => (
          <Box
            key={p.page}
            id={`page-${p.page}`}
            component="img"
            src={p.blobUrl}
            alt={`Page ${p.page}`}
            sx={{
              width: "100%",
              display: "block",
              objectFit: "cover",
              margin: 0,
              padding: 0
            }}
          />
        ))}
        {loading && (
          <Box py={4}>
            <CircularProgress />
          </Box>
        )}
        {finished && (
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" color="secondary">
              Finished: {chapter}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/read?chapter=${encodeURIComponent(Number(chapter) + 1)}&manga_id=${mangaId}&spiderId=${spiderId}`)}
            >
              Next Chapter
            </Button>
          </Box>
        )}
      </Box>

      {sliderVisible && pages.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            px: 2,
            py: 1,
            bgcolor: "rgba(0,0,0,0.6)",
            borderRadius: 50,
            display: "flex",
            alignItems: "center",
            gap: 1,
            zIndex: 999,
            width: "90%",
            maxWidth: 600,
          }}
        >
          <IconButton
            sx={{ color: "#fff" }}
            onClick={() => router.push(`/read?chapter=${encodeURIComponent(Number(chapter) - 1)}&manga_id=${mangaId}&spiderId=${spiderId}`)}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography sx={{ color: "#fff", minWidth: 40, textAlign: "center" }}>
            {currentPage} / {maxPages ?? pages.length}
          </Typography>
          <Slider
            min={1}
            max={maxPages ?? pages.length}
            value={currentPage}
            onChange={handleSliderChange}
            sx={{
              color: "#1976d2",
              flex: 1,
              height: 6,
              borderRadius: 3,
              '& .MuiSlider-thumb': { width: 16, height: 16 },
            }}
          />
          <IconButton
            sx={{ color: "#fff" }}
            onClick={() => router.push(`/read?chapter=${encodeURIComponent(Number(chapter) + 1)}&manga_id=${mangaId}&spiderId=${spiderId}`)}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
