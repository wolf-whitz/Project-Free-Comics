"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { getReaderUrl } from "~/lib/storage";

interface Page {
  page: number;
  blobUrl: string;
}

export default function ReadPage() {
  const params = useSearchParams();
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const mangaId = params.get("manga_id") ?? "";
  const spiderId = params.get("spiderId") ?? "";
  const chapter = params.get("chapter") ?? ""; // full chapter URL

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addPage = useCallback((page: Page) => {
    setPages(prev => {
      const merged = [...prev, page];
      merged.sort((a, b) => a.page - b.page);
      return merged;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    getReaderUrl().then(url => setConnectionUrl(url));
  }, []);

  useEffect(() => {
    if (!connectionUrl || !mangaId || !spiderId || !chapter) return;

    setPages([]);
    setLoading(true);
    eventSourceRef.current?.close();

    const query = new URLSearchParams({
      connectionUrl,
      manga: mangaId,
      spiderId,
      chapter, // pass full chapter URL
    }).toString();

    const es = new EventSource(`/api/chapter?${query}`);
    eventSourceRef.current = es;

    es.onmessage = async event => {
      if (!event.data || event.data === "done") return;
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

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      {pages.map(p => (
        <Box
          key={p.page}
          id={`page-${p.page}`}
          component="img"
          src={p.blobUrl}
          alt={`Page ${p.page}`}
          sx={{ width: "100%", maxWidth: 900, objectFit: "contain", my: 1 }}
        />
      ))}
      {loading && (
        <Box py={4}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
