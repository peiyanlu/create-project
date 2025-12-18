import { editFile } from '@peiyanlu/cli-utils'
import { RealContext, Tpl } from '../action.js'
import { BasePlugin } from './base.js'


export class ReactAppPlugin extends BasePlugin {
  name = Tpl.React
  
  public override async extendPrompts(): Promise<void> {}
  
  public async afterCopy(ctx: RealContext): Promise<void> {
    const { packageName } = ctx.config
    await editFile('./index.html', content => {
      return content.replace(
        /<title>.*?<\/title>/,
        `<title>${ packageName }</title>`,
      )
    })
  }
}

export class ElectronAppPlugin extends BasePlugin {
  name = Tpl.Electron
}
