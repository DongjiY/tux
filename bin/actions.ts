import { Assistant } from "./Assistant.js";
import { TestCase } from "./core/TestCase.js";
import { RawTestCase } from "./core/types.js";
import { jsonToObj } from "./utils.js";
import path from "path";

export async function run(options: { tests: string; assistant: string }) {
  console.log(options);
  const opts: Array<RawTestCase> = (await jsonToObj(
    options.tests
  )) as Array<RawTestCase>;

  const assistantUnderTest = new Assistant(
    path.resolve(process.cwd(), options.assistant)
  );
  await assistantUnderTest.initialize();

  for (const raw of opts) {
    const testCase = new TestCase(raw);
    console.log(testCase);
  }
}
