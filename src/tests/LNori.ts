
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { LNori } from '../LNori/main.js'
  import sourceInfo from '../LNori/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('LNori tests', logger)
    registerDefaultTests(suite, LNori, sourceInfo)
    
    await suite.run()
  }