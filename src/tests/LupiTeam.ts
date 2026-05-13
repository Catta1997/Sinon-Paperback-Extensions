import { type TestLogger } from "@paperback/types";

import { LupiTeam } from "../LupiTeam/main.js";
import sourceInfo from "../LupiTeam/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("LupiTeam tests", logger);
  registerDefaultTests(suite, LupiTeam, sourceInfo);

  await suite.run();
}
