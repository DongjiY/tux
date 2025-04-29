import { Assistant } from "./Assistant.js";
import { Engine } from "./core/Engine.js";
import { TestCase } from "./core/TestCase.js";
import { RawTestCase } from "./core/types.js";
import { jsonToObj } from "./utils.js";
import { clearJsonResults } from "./results.js"; // <<< add this
import path from "path";

export async function run(options: { tests: string; assistant: string }) {
  console.log(options);

  await clearJsonResults(); // <<< clear old results on every new run

  const opts: Array<RawTestCase> = (await jsonToObj(
    options.tests
  )) as Array<RawTestCase>;

  const assistantUnderTest = new Assistant(
    path.resolve(process.cwd(), options.assistant)
  );
  await assistantUnderTest.initialize();

  for (const raw of opts) {
    const engine = new Engine(new TestCase(raw), assistantUnderTest);
    await engine.run();
  }
}
