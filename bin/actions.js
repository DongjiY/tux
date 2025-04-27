import { Assistant } from "./assist.js";
import { jsonToObj } from "./utils.js";
import path from "path";

export async function run(options) {
  console.log(options);
  const opts = await jsonToObj(options.file);

  const assistantUnderTest = new Assistant(
    path.resolve(process.cwd(), options.assistant)
  );
  await assistantUnderTest.initialize();
}
