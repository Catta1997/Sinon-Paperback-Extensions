import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { PhoenixScans } from "../PhoenixScans/main.js";
import sourceInfo from "../PhoenixScans/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("PhoenixScans tests", logger);
  registerDefaultTests(suite, PhoenixScans, sourceInfo);

  await suite.run();
}
