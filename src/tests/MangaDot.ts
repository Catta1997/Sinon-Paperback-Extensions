import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaDot } from "../MangaDot/main.js";
import sourceInfo from "../MangaDot/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDot tests", logger);
  registerDefaultTests(suite, MangaDot, sourceInfo);

  await suite.run();
}
