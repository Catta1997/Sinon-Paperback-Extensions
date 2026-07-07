import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { EHentai } from "../EHentai/main.js";
import sourceInfo from "../EHentai/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("EHentai tests", logger);
  registerDefaultTests(suite, EHentai, sourceInfo);

  await suite.run();
}
