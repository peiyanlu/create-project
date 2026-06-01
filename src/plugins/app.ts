import { editFile } from '@peiyanlu/cli-utils'
import { randomUUID, type UUID } from 'node:crypto'
import { type RealContext, Tpl } from '../action.js'
import { BasePlugin } from './base.js'


export class ReactAppPlugin extends BasePlugin {
  name = Tpl.React
  
  override async extendPrompts(): Promise<void> {}
  
  override async afterCopy(ctx: RealContext): Promise<void> {
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
  
  override async afterCopy(ctx: RealContext): Promise<void> {
    const { repo } = ctx.config
    const [ owner, name ] = repo.split('/')
    
    await editFile('./forge.config.ts', content => {
      return content
        .replace('__OWNER__', owner)
        .replace('__NAME__', name)
    })
    
    
    const guidDev: UUID = randomUUID()
    const guidProd: UUID = randomUUID()
    
    await editFile('./src/main.ts', content => {
      return content
        .replace('__GUID_DEV__', guidDev)
        .replace('__GUID_PROD__', guidProd)
        .replace('__OWNER__/__NAME__', repo)
    })
    
    await super.afterCopy(ctx)
  }
}
