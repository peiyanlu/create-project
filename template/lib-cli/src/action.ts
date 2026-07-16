import { cancel, intro, isCancel, outro, tasks } from '@clack/prompts'
import { type CliOptions } from '@peiyanlu/cli-utils'
import { cyan, dim, rgb } from 'ansis'
import pkg from '../package.json' with { type: 'json' }
import { MESSAGES } from './messages.js'


export interface PromptsResult {

}


const assertPrompt = (value: unknown): void => {
  if (isCancel(value)) {
    cancel(MESSAGES.OPERATION_ABORTED)
    process.exit(0)
  }
}


export class Action {
  public async handle(cmdArgs: string | undefined, options: CliOptions): Promise<void> {
    console.log(`${ rgb(33, 91, 184)(`i`) } ${ pkg.name } ${ dim(`v${ pkg.version }`) }\n`)
    
    intro(cyan('xxx-xxxx'))
    
    const config = await this.handlePrompts(cmdArgs, options)
    
    if (options.dryRun) {
      outro(MESSAGES.DRY_RUN_MODE)
      process.exit(0)
    }
    
    const cwd: string = process.cwd()
    
    await tasks([
      {
        title: MESSAGES.TASK_START,
        task: async () => {
          
          return MESSAGES.TASK_END
        },
      },
    ])
    
    
    let doneMessage = '🎉  Done. Now run:\n'
    outro(doneMessage)
    
    process.exit(0)
  }
  
  public async handlePrompts(cmdArgs: string | undefined, options: CliOptions): Promise<PromptsResult> {
    
    return {}
  }
}
