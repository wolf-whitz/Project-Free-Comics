"use client";

import { useState, useEffect } from "react";
import { Box, Typography, TextField } from "@mui/material";
import { getReaderUrl, saveReaderUrl, getManifest, saveManifest } from "@database/client/init";
import { PyrenzBlueButtonWithLoading } from "@components/renderer/theme";

export function SettingsPage() {
  const [connectionUrl, setConnectionUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const savedUrl = await getReaderUrl();
      if (savedUrl) setConnectionUrl(savedUrl);
    })();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionUrl }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to register URL");

      await saveReaderUrl(connectionUrl);
      await saveManifest(data.manifest);

      setStatus("Reader Connection URL saved ✅");
      setTimeout(() => setStatus(""), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <TextField
          label="Reader Connection URL"
          variant="outlined"
          fullWidth
          value={connectionUrl}
          onChange={(e) => setConnectionUrl(e.target.value)}
        />

        <PyrenzBlueButtonWithLoading
          dataState={loading ? "loading" : undefined}
          onClick={handleSave}
        >
          Save
        </PyrenzBlueButtonWithLoading>
      </Box>

      {status && (
        <Typography
          variant="body2"
          color={status.startsWith("Error") ? "error.main" : "success.main"}
        >
          {status}
        </Typography>
      )}
    </Box>
  );
}
