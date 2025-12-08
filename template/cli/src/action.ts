import { cancel, intro, isCancel, outro, tasks } from '@clack/prompts'
import { cyan } from 'ansis'
import { setTimeout } from 'node:timers/promises'
import { MESSAGES } from './messages.js'


export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
}

export enum YesOrNo {
  Yes = 'yes',
  No = 'no',
  Null = 'null',
}

export interface PromptsResult {

}


const assertPrompt = (value: unknown) => {
  if (isCancel(value)) {
    cancel('Operation cancelled')
    process.exit(0)
  }
}


export class Action {
  public async handle(cmdArgs: string | undefined, options: Record<string, boolean | string>) {
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
    
    await setTimeout(1000)
    process.exit(0)
  }
  
  public async handlePrompts(
    cmdArgs: string | undefined,
    options: Record<string, boolean | string>,
  ): Promise<PromptsResult> {
    
    return {}
  }
}
