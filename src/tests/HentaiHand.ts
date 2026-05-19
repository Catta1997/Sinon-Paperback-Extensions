import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { HentaiHand } from "../HentaiHand/main.js";
import sourceInfo from "../HentaiHand/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HentaiHand tests", logger);
  registerDefaultTests(suite, HentaiHand, sourceInfo);

  await suite.run();
}
