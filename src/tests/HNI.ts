import { type TestLogger } from "@paperback/types";

import { HNI } from "../HNI-scantrad/main.js";
import sourceInfo from "../GTOTheGreatSite/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HNI tests", logger);
  registerDefaultTests(suite, HNI, sourceInfo);

  await suite.run();
}
