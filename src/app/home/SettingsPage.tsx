import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import {
  getReaderUrl,
  saveReaderUrl,
  getManifest,
  saveManifest,
} from "@database/client/init";
import { PyrenzBlueButtonWithLoading } from "@components/renderer/theme";

export function SettingsPage() {
  const [connectionUrl, setConnectionUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState("Default");
  const [sseOutput, setSseOutput] = useState<string[]>([]);
  const sseRef = useRef<EventSource | null>(null);
  const sseContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const savedUrl = await getReaderUrl();
      if (savedUrl) setConnectionUrl(savedUrl);

      const savedManifest = await getManifest();
      if (savedManifest?.proxyServer) {
        const proxyVal = savedManifest.proxyServer;
        if (["FlareSolverr", "Byparr", "Default"].includes(proxyVal)) {
          setSelectedProxy(proxyVal);
        }
      }
    })();

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (sseContainerRef.current) {
      sseContainerRef.current.scrollTop = sseContainerRef.current.scrollHeight;
    }
  }, [sseOutput]);

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

      const manifestToSave = { ...(data.manifest || {}), proxyServer: selectedProxy };
      await saveReaderUrl(connectionUrl);
      await saveManifest(manifestToSave);

      setStatus("Reader Connection URL saved ✅");
      setTimeout(() => setStatus(""), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeveloperMode = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developer: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setStatus("Developer mode enabled ✅");
      setTimeout(() => setStatus(""), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleProxyChange = (proxy: string) => {
    setSelectedProxy(proxy);
    setSseOutput([]);

    if (sseRef.current) sseRef.current.close();

    const executeDefault = proxy === "Default" ? "&execute=true" : "";
    const eventSource = new EventSource(
      `/api/proxy?proxy=${encodeURIComponent(proxy)}${executeDefault}`
    );
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      setSseOutput((prev) => [...prev, event.data]);
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
    };
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

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <FormControl variant="outlined" size="medium" sx={{ minWidth: 260 }}>
          <InputLabel id="proxy-select-label">Change Proxy Server</InputLabel>
          <Select
            labelId="proxy-select-label"
            id="proxy-select"
            value={selectedProxy}
            label="Change Proxy Server"
            onChange={(e) => handleProxyChange(e.target.value)}
          >
            <MenuItem value="FlareSolverr">FlareSolverr</MenuItem>
            <MenuItem value="Byparr">Byparr</MenuItem>
            <MenuItem value="Default">Default</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2 }}>
        <PyrenzBlueButtonWithLoading onClick={handleDeveloperMode}>
          Enable Developer Mode
        </PyrenzBlueButtonWithLoading>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          fontFamily: "monospace",
          height: 300,
          overflowY: "auto",
          mb: 2,
        }}
        ref={sseContainerRef}
      >
        {sseOutput.map((line, idx) => (
          <Typography key={idx} sx={{ whiteSpace: "pre-wrap" }}>
            {line}
          </Typography>
        ))}
      </Paper>

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
