
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { ExHentai } from '../ExHentai/main.js'
  import sourceInfo from '../ExHentai/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('ExHentai tests', logger)
    registerDefaultTests(suite, ExHentai, sourceInfo)
    
    await suite.run()
  }