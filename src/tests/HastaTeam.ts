
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { HastaTeam } from '../HastaTeam/main.js'
  import sourceInfo from '../HastaTeam/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('HastaTeam tests', logger)
    registerDefaultTests(suite, HastaTeam, sourceInfo)
    
    await suite.run()
  }