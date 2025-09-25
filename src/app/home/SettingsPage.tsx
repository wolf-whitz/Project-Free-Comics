"use client";

import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { getManifest, saveManifest } from "~/lib/storage";

export function SettingsPage() {
  const [connectionUrl, setConnectionUrl] = useState("");
  const [manifest, setManifest] = useState<any>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const savedManifest = await getManifest("currentUser");
      if (savedManifest) setManifest(savedManifest);
    })();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionUrl }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to register URL");

      await saveManifest("currentUser", data.manifest);
      setManifest(data.manifest);
      setStatus("Reader Connection URL saved & manifest loaded ✅");
      setTimeout(() => setStatus(""), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <TextField
        label="Reader Connection URL"
        variant="outlined"
        fullWidth
        value={connectionUrl}
        onChange={(e) => setConnectionUrl(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" onClick={handleSave}>
        Save & Load Manifest
      </Button>

      {status && (
        <Typography
          variant="body2"
          sx={{ mt: 1 }}
          color={status.startsWith("Error") ? "error.main" : "success.main"}
        >
          {status}
        </Typography>
      )}

      {manifest && (
        <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
          <Typography variant="h6">Manifest Preview:</Typography>
          <pre style={{ overflowX: "auto" }}>{JSON.stringify(manifest, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
}
