import { cancel, intro, isCancel, outro, select, tasks, text } from '@clack/prompts'
import {
  checkVersion,
  type CliOptions,
  ConfirmResult,
  copyDirAsync,
  emptyDir,
  execAsync,
  isEmpty,
  isGitRepo,
  isValidPackageName,
  PkgManager,
  stringifyArgs,
  toValidPackageName,
  toValidProjectName,
} from '@peiyanlu/cli-utils'
import { cyan, dim } from 'ansis'
import { existsSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { scheduler } from 'node:timers/promises'
import { Context } from './context.js'
import { MESSAGES } from './messages.js'
import { ElectronAppPlugin, ReactAppPlugin } from './plugins/app.js'
import type { TemplatePlugin } from './plugins/base.js'
import { LibCliPlugin, LibMonorepoPlugin, LibPlugin, LibPluginPlugin } from './plugins/lib.js'
import { getInstallCommand, getRunCommand } from './utils.js'


export interface PromptsResult {
  targetDir: string;
  packageName: string;
  description: string;
  pkgManager: PkgManager;
  template: Tpl;
  automation: string[];
  useVitest: boolean;
  repo: string;
  cwd: string;
  tplDir: string;
  tplBaseDir: string;
  tplAppDir: string;
  tplLibDir: string;
  source: string;
  target: string;
  plugin: TemplatePlugin;
}

export type RealContext = Context<PromptsResult>

export enum Tpl {
  Lib = 'lib',
  Cli = 'lib-cli',
  Plugin = 'lib-plugin',
  Monorepo = 'lib-monorepo',
  Electron = 'app-electron',
  React = 'app-react',
}


export const assertPrompt = (value: unknown) => {
  if (isCancel(value)) {
    cancel(MESSAGES.OPERATION_ABORTED)
    process.exit(0)
  }
}

export const createDefaultConfig = (cwd = process.cwd()): PromptsResult => {
  const tplDir = resolve(__dirname, '..', 'template')
  return {
    targetDir: '',
    packageName: '',
    description: '',
    pkgManager: PkgManager.NPM,
    template: Tpl.Lib,
    automation: [],
    useVitest: false,
    repo: '',
    cwd,
    tplDir,
    tplBaseDir: resolve(tplDir, 'common', 'base'),
    tplAppDir: resolve(tplDir, 'common', 'app'),
    tplLibDir: resolve(tplDir, 'common', 'lib'),
    source: '',
    target: '',
    plugin: {} as TemplatePlugin,
  }
}

const handleDirConflict = async (targetDir: string, options: CliOptions): Promise<void> => {
  const isExists = existsSync(targetDir)
  const ignore = [ '.git', '.idea', '.vscode' ]
  if (isExists && !await isEmpty(targetDir, ignore)) {
    const overwrite = options.overwrite
      ? ConfirmResult.YES
      : await select({
        message: MESSAGES.DIRECTORY_CONFLICT_QUESTION(targetDir),
        options: [
          {
            label: 'Cancel',
            value: ConfirmResult.NO,
            hint: 'cancel and exit',
          },
          {
            label: 'Remove',
            value: ConfirmResult.YES,
            hint: 'remove files and continue',
          },
          {
            label: 'Ignore',
            value: ConfirmResult.IGNORE,
            hint: 'ignore files and continue',
          },
        ],
      })
    assertPrompt(overwrite)
    switch (overwrite) {
      case ConfirmResult.YES:
        await emptyDir(targetDir, ignore)
        break
      case ConfirmResult.NO:
        outro(MESSAGES.OPERATION_ABORTED)
        process.exit(0)
    }
  }
}

export const pluginRegistry: Record<Tpl, () => TemplatePlugin> = {
  [Tpl.Lib]: () => new LibPlugin(),
  [Tpl.Cli]: () => new LibCliPlugin(),
  [Tpl.Plugin]: () => new LibPluginPlugin(),
  [Tpl.Monorepo]: () => new LibMonorepoPlugin(),
  [Tpl.React]: () => new ReactAppPlugin(),
  [Tpl.Electron]: () => new ElectronAppPlugin(),
}


export class Action {
  public async handle(cmdArgs: string | undefined, options: CliOptions): Promise<void> {
    intro(cyan('create-project'))
    
    const ctx = new Context(createDefaultConfig())
    await this.handlePrompts(cmdArgs, options, ctx)
    
    if (options.dryRun) {
      outro(MESSAGES.DRY_RUN_MODE)
      process.exit(0)
    }
    
    await this.createTask(ctx)
    
    await this.handleDoneMessage(ctx)
    
    process.exit(0)
  }
  
  public async createTask(ctx: RealContext): Promise<void> {
    const { plugin, source, target, tplBaseDir } = ctx.config
    
    await tasks([
      {
        title: MESSAGES.PROJECT_INFORMATION_START,
        task: async () => {
          await plugin.beforeCopy(ctx)
          
          await copyDirAsync(tplBaseDir, target, plugin.getCopyOptions(ctx))
          await scheduler.yield()
          
          await copyDirAsync(source, target, plugin.getCopyOptions(ctx))
          await scheduler.yield()
          
          // -----------------------------------------------------
          process.chdir(target)
          await scheduler.yield()
          
          // -----------------------------------------------------
          await plugin.afterCopy(ctx)
          await plugin.afterAll(ctx)
          await scheduler.yield()
          
          // -----------------------------------------------------
          const isRepo = await isGitRepo()
          if (!isRepo) await execAsync('git init -b master')
          
          process.chdir(ctx.config.cwd)
          
          return MESSAGES.PROJECT_INFORMATION_END
        },
      },
    ])
  }
  
  public async handleDoneMessage(ctx: RealContext): Promise<void> {
    const { cwd, target, pkgManager, plugin } = ctx.config
    
    let doneMessage = '🎉  Done. Now run:\n'
    const cdProjectName = relative(cwd, target)
    const prefix = `\n  ${ dim('$') }`
    if (target !== cwd) {
      const dir = cdProjectName.includes(' ') ? `"${ cdProjectName }"` : cdProjectName
      doneMessage += `${ prefix } ${ cyan('cd') } ${ dir }\n`
    }
    
    doneMessage += `${ prefix } ${ stringifyArgs(getInstallCommand(pkgManager)) }`
    doneMessage += `${ prefix } ${ stringifyArgs(getRunCommand(pkgManager, 'dev')) }`
    doneMessage += plugin.getDoneMessage(prefix)
    
    outro(doneMessage)
  }
  
  public async handlePrompts(
    cmdArgs: string | undefined,
    options: CliOptions,
    ctx: RealContext,
  ): Promise<PromptsResult> {
    // 1. Get project name and target dir
    const prjName = cmdArgs ? toValidProjectName(cmdArgs) : undefined
    const projectName = prjName
      ? prjName
      : await text({
        message: MESSAGES.PROJECT_NAME_QUESTION,
        placeholder: 'Anonymous - Use "." for the current directory',
        defaultValue: 'untitled',
      }) as string
    assertPrompt(projectName)
    ctx.config.targetDir = toValidProjectName(projectName)
    ctx.config.target = resolve(ctx.config.cwd, ctx.config.targetDir)
    
    
    // 2. Handle directory if exist and not empty
    await handleDirConflict(ctx.config.targetDir, options)
    
    
    // 3. Get package name
    const pkgName = basename(resolve(ctx.config.targetDir))
    const defPkgName = isValidPackageName(pkgName) ? pkgName : toValidPackageName(pkgName)
    ctx.config.packageName = await text({
      message: MESSAGES.PACKAGE_NAME_QUESTION,
      initialValue: defPkgName,
      placeholder: defPkgName,
      validate(val) {
        if (!val || !isValidPackageName(val)) {
          return 'Invalid'
        }
      },
    }) as string
    assertPrompt(ctx.config.packageName)
    
    
    // 4. Get project description
    ctx.config.description = await text({
      message: MESSAGES.PACKAGE_DESCRIPTION_QUESTION,
      placeholder: 'Anonymous',
      defaultValue: 'My project description.',
    }) as string
    assertPrompt(ctx.config.description)
    
    
    // 5. Choose a template
    const argTemplate = options.template as Tpl
    ctx.config.template = Object.values(Tpl).includes(argTemplate)
      ? argTemplate
      : await select({
        message: MESSAGES.PROJECT_TEMPLATE_QUESTION,
        options: [
          {
            label: 'Library',
            value: Tpl.Lib,
            hint: 'Publishable npm library with TypeScript, ESM & CJS support',
          },
          {
            label: 'CLI',
            value: Tpl.Cli,
            hint: 'Command-line tool for scaffolding and automation',
          },
          {
            label: 'Plugin',
            value: Tpl.Plugin,
            hint: 'Plugin for Anonymous',
          },
          {
            label: 'Monorepo',
            value: Tpl.Monorepo,
            hint: 'Multi-package repository using pnpm workspace',
          },
          {
            label: 'Electron',
            value: Tpl.Electron,
            hint: 'Desktop application using Electron, Vite, and TypeScript',
          },
          {
            label: 'React',
            value: Tpl.React,
            hint: 'React web project powered by Vite and TypeScript',
          },
        ],
      }) as Tpl
    assertPrompt(ctx.config.template)
    ctx.config.source = resolve(ctx.config.tplDir, ctx.config.template)
    
    
    ctx.config.plugin = pluginRegistry[ctx.config.template]()
    const requiresPnpm = ctx.config.plugin.requiresPnpm() ?? false
    
    
    // 6. Choose a package manager
    ctx.config.pkgManager = requiresPnpm
      ? PkgManager.PNPM
      : await select({
        message: MESSAGES.PACKAGE_MANAGER_QUESTION,
        options: (await Promise.all([
          PkgManager.PNPM,
          PkgManager.NPM,
          PkgManager.YARN,
        ].map(async k => {
          const version = await checkVersion(k)
          return { label: k, value: k, hint: version }
        }))).filter(k => k.hint),
      }) as PkgManager
    assertPrompt(ctx.config.pkgManager)
    
    
    await ctx.config.plugin.extendPrompts(ctx)
    
    return ctx.config
  }
}
