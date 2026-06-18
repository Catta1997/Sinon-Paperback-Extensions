import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { OmegaScans } from "../OmegaScans/main.js";
import sourceInfo from "../OmegaScans/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("OmegaScans tests", logger);
  registerDefaultTests(suite, OmegaScans, sourceInfo);

  await suite.run();
}
