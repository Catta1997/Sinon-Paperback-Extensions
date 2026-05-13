import { type TestLogger } from "@paperback/types";

import { GTOTheGreatSite } from "../GTOTheGreatSite/main.js";
import sourceInfo from "../GTOTheGreatSite/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("GTOTheGreatSite tests", logger);
  registerDefaultTests(suite, GTOTheGreatSite, sourceInfo);

  await suite.run();
}
