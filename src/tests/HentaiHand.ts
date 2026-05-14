import { type TestLogger } from "@paperback/types";

import { HentaiHand } from "../HentaiHand/main.js";
import sourceInfo from "../HentaiHand/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HentaiHand tests", logger);
  registerDefaultTests(suite, HentaiHand, sourceInfo);

  await suite.run();
}
