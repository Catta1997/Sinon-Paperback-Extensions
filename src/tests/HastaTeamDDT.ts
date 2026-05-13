import { type TestLogger } from "@paperback/types";

import { HastaTeamDDT } from "../HastaTeamDDT/main.js";
import sourceInfo from "../HastaTeamDDT/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HastaTeamDDTExtension tests", logger);
  registerDefaultTests(suite, HastaTeamDDT, sourceInfo);

  await suite.run();
}
