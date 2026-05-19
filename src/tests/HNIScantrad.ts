import { type TestLogger } from "@paperback/types";
import { TestSuite, registerDefaultTests } from "./suite.js";
import { HNIScantrad } from "../HNIScantrad/main.js";
import sourceInfo from "../HNIScantrad/pbconfig.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HNIScantrad tests", logger);
  registerDefaultTests(suite, HNIScantrad, sourceInfo);

  await suite.run();
}
