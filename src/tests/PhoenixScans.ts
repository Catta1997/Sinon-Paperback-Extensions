import { type TestLogger } from "@paperback/types";

import { PhoenixScans } from "../PhoenixScans/main.js";
import sourceInfo from "../PhoenixScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("PhoenixScans tests", logger);
  registerDefaultTests(suite, PhoenixScans, sourceInfo);

  await suite.run();
}
