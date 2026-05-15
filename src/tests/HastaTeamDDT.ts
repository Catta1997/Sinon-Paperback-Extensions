
  import { type TestLogger } from '@paperback/types'
  import { TestSuite, registerDefaultTests } from './suite.js'
  import { HastaTeamDDT } from '../HastaTeamDDT/main.js'
  import sourceInfo from '../HastaTeamDDT/pbconfig.js'
  
  export async function runTests(logger: TestLogger) {
    const suite = new TestSuite('HastaTeamDDT tests', logger)
    registerDefaultTests(suite, HastaTeamDDT, sourceInfo)
    
    await suite.run()
  }