
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { TuttoAnimeManga } from '../TuttoAnimeManga/main.js'
  import sourceInfo from '../TuttoAnimeManga/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('TuttoAnimeManga tests', logger)
    registerDefaultTests(suite, TuttoAnimeManga, sourceInfo)
    
    await suite.run()
  }