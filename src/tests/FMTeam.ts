import { type TestLogger } from "@paperback/types";

import { FMTeam } from "../FMTeam/main.js";
import sourceInfo from "../FMTeam/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("FMTeam tests", logger);
  registerDefaultTests(suite, FMTeam, sourceInfo);

  await suite.run();
}
