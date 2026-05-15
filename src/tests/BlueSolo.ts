
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { BlueSolo } from '../BlueSolo/main.js'
  import sourceInfo from '../BlueSolo/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('BlueSolo tests', logger)
    registerDefaultTests(suite, BlueSolo, sourceInfo)
    
    await suite.run()
  }