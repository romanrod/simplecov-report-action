import path from 'path'
import * as core from '@actions/core'
import {report} from './report'

interface Result {
  result: {
    covered_percent?: number // NOTE: simplecov < 0.21.0
    line?: number
  }
}

async function run(): Promise<void> {
  try {
    const failedThreshold: number = Number.parseInt(core.getInput('failedThreshold'), 10)
    core.debug(`failedThreshold ${failedThreshold}`)

    const resultPath: string = core.getInput('resultPath')
    core.debug(`resultPath ${resultPath}`)

    const resultSet: string = core.getInput('resultSet')
    core.debug(`resultSet ${resultSet}`)

    const prId: number = Number.parseInt(core.getInput('pullRequestId'), 10)
    core.debug(`pullRequestId ${prId}`)

    const customTitle: string = core.getInput('customTitle')
    core.debug(`customTitle ${customTitle}`)

    const customText: string = core.getInput('customText')
    core.debug(`customText ${customText}`)

    const listUncoveredFiles: boolean = core.getInput('listUncoveredFiles')?.toLowerCase() === 'true'
    core.debug(`listUncoveredFiles ${listUncoveredFiles}`)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const json = require(path.resolve(process.env.GITHUB_WORKSPACE!, resultPath)) as Result
    const coveredPercent = json.result.covered_percent ?? json.result.line

    if (coveredPercent === undefined) {
      throw new Error('Coverage is undefined!')
    }
    var text = customText
    if (listUncoveredFiles) {
      const resultSetJson = require(path.resolve(process.env.GITHUB_WORKSPACE!, resultSet))
      const uncovered = Object.keys(resultSetJson.RSpec.coverage).filter(
        key => resultSetJson.RSpec.coverage[key].include)

      if(uncovered.length > 0) {
        text = `${customText}` + `
<details>
<summary>Uncovered files</summary>
<br />

List of files with uncovered lines:


</details>`
      }
    }

    await report(coveredPercent, failedThreshold, prId, customTitle, text)

    if (coveredPercent < failedThreshold) {
      throw new Error(`Coverage is less than ${failedThreshold}%. (${coveredPercent}%)`)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
