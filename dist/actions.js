import { Assistant } from "./Assistant.js";
import { TestCase } from "./core/TestCase.js";
import { jsonToObj } from "./utils.js";
import path from "path";
export async function run(options) {
    console.log(options);
    const opts = (await jsonToObj(options.tests));
    const assistantUnderTest = new Assistant(path.resolve(process.cwd(), options.assistant));
    await assistantUnderTest.initialize();
    for (const raw of opts) {
        const testCase = new TestCase(raw);
        console.log(testCase);
    }
}
