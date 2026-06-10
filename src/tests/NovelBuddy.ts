import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { NovelBuddy } from "../NovelBuddy/main.js";
import sourceInfo from "../NovelBuddy/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("NovelBuddy tests", logger);
  registerDefaultTests(suite, NovelBuddy, sourceInfo);

  await suite.run();
}
