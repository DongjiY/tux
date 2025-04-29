import fs from "fs/promises";
import path from "path";

const RESULTS_PATH = path.resolve(process.cwd(), "results.json");

export async function writeJsonResults(newResult: any) {
  // <<< ADD THIS
  console.log("🐞 DEBUG writeJsonResults called with:", JSON.stringify(newResult, null, 2));

  let existingResults: any[] = [];

  try {
    const file = await fs.readFile(RESULTS_PATH, "utf-8");
    existingResults = JSON.parse(file);
    if (!Array.isArray(existingResults)) {
      existingResults = [];
    }
  } catch (e) {
    existingResults = [];
  }

  existingResults.push(newResult);

  await fs.writeFile(
    RESULTS_PATH,
    JSON.stringify(existingResults, null, 2),
    "utf-8"
  );

  console.log(`\n✅ results appended to ${RESULTS_PATH}\n`);
}

export async function clearJsonResults() {
  console.log("🐞 DEBUG clearJsonResults called");
  await fs.writeFile(RESULTS_PATH, "[]", "utf-8");
  console.log(`\n🧹 cleared ${RESULTS_PATH}\n`);
}