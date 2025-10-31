"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Button, Typography, IconButton, AppBar, Toolbar } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { PageSlider } from "@components/client";

interface Page {
  page: number;
  blobUrl: string;
}

export default function ReadPage() {
  const router = useRouter();
  const params = useSearchParams();
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
  const [maxChapter, setMaxChapter] = useState<number | null>(null);
  const [mangaTitle, setMangaTitle] = useState<string>("");
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [menuVisible, setMenuVisible] = useState(true);
  const lastScrollY = useRef(0);
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
    if (!mangaId || !spiderId || !chapter) return;

    setPages([]);
    setCurrentPage(1);
    setLoading(true);
    setFinished(false);
    setMaxChapter(null);
    setMangaTitle("");
    setChapterTitle("");
    eventSourceRef.current?.close();

    const query = new URLSearchParams({ manga: mangaId, spiderId, chapter }).toString();
    const es = new EventSource(`/api/chapter?${query}`);
    eventSourceRef.current = es;

    es.onmessage = async (event) => {
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
        if (data.maxChapter) setMaxChapter(data.maxChapter);
        if (data.mangaTitle) setMangaTitle(data.mangaTitle);
        if (data.chapterTitle) setChapterTitle(data.chapterTitle);
      } catch {}
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [mangaId, spiderId, chapter, addPage]);

  useEffect(() => {
    if (!pages.length) return;

    const handleScroll = () => {
      const scrollMiddle = window.scrollY + window.innerHeight / 2;
      let newPage = 1;
      for (const p of pages) {
        const el = document.getElementById(`page-${p.page}`);
        if (el && el.offsetTop <= scrollMiddle) newPage = p.page;
      }
      setCurrentPage(newPage);

      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 50) setMenuVisible(false);
      else setMenuVisible(true);
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pages]);

  return (
    <Box sx={{ position: "relative", width: "100%", cursor: "pointer" }} onClick={() => setSliderVisible(v => !v)}>
      <AppBar position="fixed" sx={{ transform: menuVisible ? "translateY(0)" : "translateY(-100%)", transition: "transform 0.3s ease" }}>
        <Toolbar sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", "&:hover .back-button": { opacity: 1 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton className="back-button" onClick={() => router.push("/")}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" noWrap>{mangaTitle || "Loading..."}</Typography>
          </Box>
          <Typography variant="subtitle2">{chapterTitle || `Chapter ${chapter}`}</Typography>
        </Toolbar>
      </AppBar>

      <Box display="flex" flexDirection="column" alignItems="center" width="100%" pt={10} pb={10}>
        {pages.map(p => (
          <Box
            key={p.page}
            id={`page-${p.page}`}
            component="img"
            src={p.blobUrl}
            alt={`Page ${p.page}`}
            sx={{ width: "100%", display: "block", objectFit: "cover", margin: 0, padding: 0 }}
          />
        ))}

        {loading && <Box py={4}><CircularProgress /></Box>}

        {finished && (
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" color="secondary">Finished: {chapter}</Typography>
            {(!maxChapter || Number(chapter) < maxChapter) && (
              <Button
                variant="contained"
                onClick={() =>
                  router.push(`/read?chapter=${encodeURIComponent(Number(chapter) + 1)}&manga_id=${mangaId}&spiderId=${spiderId}`)
                }
              >
                Next Chapter
              </Button>
            )}
          </Box>
        )}
      </Box>

      {sliderVisible && pages.length > 0 && (
        <PageSlider
          currentPage={currentPage}
          maxPages={maxPages ?? pages.length}
          onChange={(value) => {
            setCurrentPage(value);
            const pageEl = document.getElementById(`page-${value}`);
            if (pageEl) pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onPrevChapter={() =>
            router.push(`/read?chapter=${encodeURIComponent(Number(chapter) - 1)}&manga_id=${mangaId}&spiderId=${spiderId}`)
          }
          onNextChapter={() => {
            if (!maxChapter || Number(chapter) < maxChapter) {
              router.push(`/read?chapter=${encodeURIComponent(Number(chapter) + 1)}&manga_id=${mangaId}&spiderId=${spiderId}`);
            }
          }}
        />
      )}
    </Box>
  );
}
