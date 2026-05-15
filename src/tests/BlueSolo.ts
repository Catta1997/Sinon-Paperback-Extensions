import { type TestLogger } from "@paperback/types";

import { BlueSolo } from "../BlueSolo/main.js";
import sourceInfo from "../BlueSolo/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("BlueSolo tests", logger);
  registerDefaultTests(suite, BlueSolo, sourceInfo);

  await suite.run();
}
