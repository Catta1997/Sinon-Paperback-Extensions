import { type TestLogger } from "@paperback/types";

import { HastaTeam } from "../HastaTeam/main.js";
import sourceInfo from "../HastaTeam/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HastaTeam tests", logger);
  registerDefaultTests(suite, HastaTeam, sourceInfo);

  await suite.run();
}
