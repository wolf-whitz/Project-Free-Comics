"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Typography, TextField, Alert, Link } from "@mui/material";
import debounce from "lodash.debounce";
import { PyrenzCard } from "@components/renderer/theme";

type Spider = {
  spider_name: string;
  spider_link: string;
};

export function ExtensionsTab() {
  const [spiders, setSpiders] = useState<Spider[]>([]);
  const [filteredSpiders, setFilteredSpiders] = useState<Spider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchSpiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/spiders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setSpiders(data.spiders || []);
      setFilteredSpiders(data.spiders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpiders();
  }, []);

  const handleSearch = useCallback(
    debounce((q: string, list: Spider[]) => {
      const lower = q.toLowerCase();
      const filtered = list.filter(
        (s) =>
          s.spider_name.toLowerCase().includes(lower) ||
          s.spider_link.toLowerCase().includes(lower)
      );
      setFilteredSpiders(filtered);
    }, 300),
    []
  );

  useEffect(() => {
    handleSearch(search, spiders);
  }, [search, spiders, handleSearch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Extensions
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="Search extensions..."
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 1,
            input: { color: "#fff" },
          }}
        />
      </Box>

      {loading && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "flex-start",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <PyrenzCard key={i} loading sx={{ width: 300 }} />
          ))}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredSpiders.length === 0 && (
        <Typography color="text.secondary">
          No matching extensions found 😢
        </Typography>
      )}

      {!loading && !error && filteredSpiders.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "flex-start",
          }}
        >
          {filteredSpiders.map((spider, index) => (
            <PyrenzCard key={index} sx={{ width: 300 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                  color: "#4ea7f7",
                }}
              >
                {spider.spider_name}
              </Typography>
              <Link
                href={spider.spider_link}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{
                  fontSize: 14,
                  wordBreak: "break-all",
                  color: "#9ecfff",
                }}
              >
                {spider.spider_link}
              </Link>
            </PyrenzCard>
          ))}
        </Box>
      )}
    </Box>
  );
}
