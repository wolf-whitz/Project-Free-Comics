"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Card, CardMedia, CardContent } from "@mui/material";
import { getAllManga, Manga } from "~/lib/mangaDb";

export function Library() {
  const [mangaList, setMangaList] = useState<Manga[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getAllManga();
      setMangaList(data);
    })();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Library
      </Typography>

      {mangaList.length === 0 ? (
        <Typography color="text.secondary">No manga in your library yet.</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {mangaList.map((manga) => (
            <Box
              key={manga.id}
              sx={{
                flex: "1 1 300px",
                maxWidth: 320,
              }}
            >
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={manga.image}
                  alt={manga.title}
                />
                <CardContent>
                  <Typography variant="h6">{manga.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {manga.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
