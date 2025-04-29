import express from "express";
import path from "path";
import fs from "fs/promises";
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
    // This uses the root of the project (not viewer/) to locate results.json
    const resultsPath = path.resolve(process.cwd(), "results.json");
    const data = await fs.readFile(resultsPath, "utf-8");
    const results = JSON.parse(data);

    // Ensure it always returns an array
    const normalizedResults = Array.isArray(results) ? results : [results];

    res.json(normalizedResults);
  } catch (error) {
    console.error("Failed to read results.json:", error);
    res.status(500).json({ error: "Failed to load results" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🖥️  Viewer running at http://localhost:${port}`);
});