
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { NovelsOnline } from '../NovelsOnline/main.js'
  import sourceInfo from '../NovelsOnline/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('NovelsOnline tests', logger)
    registerDefaultTests(suite, NovelsOnline, sourceInfo)
    
    await suite.run()
  }