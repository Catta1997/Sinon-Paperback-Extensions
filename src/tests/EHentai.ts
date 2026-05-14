import { type TestLogger } from "@paperback/types";

import { EHentai } from "../EHentai/main.js";
import sourceInfo from "../EHentai/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("EHentai tests", logger);
  registerDefaultTests(suite, EHentai, sourceInfo);

  await suite.run();
}
