import { type TestLogger } from "@paperback/types";

import { RokuHentai } from "../RokuHentai/main.js";
import sourceInfo from "../RokuHentai/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("RokuHentai tests", logger);
  registerDefaultTests(suite, RokuHentai, sourceInfo);

  await suite.run();
}
