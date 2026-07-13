import { execAsync } from '@peiyanlu/cli-utils'
import { scheduler } from 'node:timers/promises'


export class Context<TConfig> {
  private scriptsToSet: Record<string, string> = {}
  private binToSet: Record<string, string> = {}
  private pendingCommands: string[] = []
  private depsToAdd: string[][] = []
  private devDepsToAdd: string[][] = []
  private depsToRemove: string[] = []
  private devDepsToRemove: string[] = []
  
  constructor(public config: TConfig) {}
  
  setScripts(s: Record<string, string>) {
    Object.assign(this.scriptsToSet, s)
  }
  
  setBin(s: Record<string, string>) {
    Object.assign(this.binToSet, s)
  }
  
  addDeps(list: string[][]) {
    this.depsToAdd.push(...list)
  }
  
  addDevDeps(list: [ string, string ][]) {
    this.devDepsToAdd.push(...list)
  }
  
  removeDeps(list: string[]) {
    this.depsToRemove.push(...list)
  }
  
  removeDevDeps(list: string[]) {
    this.devDepsToRemove.push(...list)
  }
  
  enqueueCommand(list: string[]) {
    this.pendingCommands.push(...list)
  }
  
  async applyChanges() {
    const delDeps = this.depsToRemove.map(k => `dependencies["${ k }"]`)
      .concat(this.devDepsToRemove.map(k => `devDependencies["${ k }"]`))
      .join(' ')
    const addDeps = this.depsToAdd.map(([ k, v ]) => `dependencies["${ k }"]="${ v }"`)
      .concat(this.devDepsToAdd.map(([ k, v ]) => `devDependencies["${ k }"]="${ v }"`))
      .join(' ')
    const addScripts = Object.entries(this.scriptsToSet)
      .map(([ k, v ]) => `scripts."${ k }"="${ v }"`)
      .join(' ')
    const addBin = Object.entries(this.binToSet)
      .map(([ k, v ]) => `bin."${ k }"="${ v }"`)
      .join(' ')
    
    
    if (delDeps) this.enqueueCommand([ `npm pkg delete ${ delDeps }` ])
    if (addDeps) this.enqueueCommand([ `npm pkg set ${ addDeps }` ])
    if (addScripts) this.enqueueCommand([ `npm pkg set ${ addScripts }` ])
    if (addBin) this.enqueueCommand([ `npm pkg set ${ addBin }` ])
    
    for (const cmd of this.pendingCommands) {
      await execAsync(cmd)
      await scheduler.yield()
    }
  }
}
