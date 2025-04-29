import express from "express";
import path from "path";
import fs from "fs/promises";
import open from "open"; // <-- ✅ import this
import { fileURLToPath } from "url";
import { dirname } from "path";

// __dirname fix for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from viewer/public
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html explicitly for root path
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoint for simulation results
app.get("/api/results", async (_req, res) => {
  try {
    const resultsPath = path.resolve(process.cwd(), "results.json");
    const data = await fs.readFile(resultsPath, "utf-8");
    const results = JSON.parse(data);
    const normalizedResults = Array.isArray(results) ? results : [results];
    res.json(normalizedResults);
  } catch (error) {
    console.error("Failed to read results.json:", error);
    res.status(500).json({ error: "Failed to load results" });
  }
});

// Start server and auto-open browser
app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`🖥️  Viewer running at ${url}`);
  open(url); // <-- ✅ auto-open in default browser
});