import { cancel, confirm, intro, isCancel, log, multiselect, outro, select, tasks, text } from '@clack/prompts'
import { cyan, gray } from 'ansis'
import { existsSync, mkdirSync } from 'node:fs'
import { copyFile, readdir } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { scheduler } from 'node:timers/promises'
import { MESSAGES } from './messages.js'
import {
  __dirname,
  checkVersion,
  editFile,
  emptyDir,
  execAsync,
  isEmpty,
  isGitRepo,
  isValidPackageName,
  readSubDirs,
  toValidPackageName,
  toValidProjectName,
} from './utils.js'


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
  targetDir: string;
  packageName: string;
  description: string;
  pkgManager: PackageManager;
  template: Tpl;
  cis: string[];
  useVitest: boolean;
  useGit: boolean;
  repo: `${ string }/${ string }`;
}

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
  '_release-it.json': '.release-it.json',
  _github: '.github',
  _changeset: '.changeset',
}

const ciFiles: string[] = [
  '.github',
  '.release-it.json',
  'renovate.json',
]

const vitestFiles: string[] = [
  'app.controller.spec.ts',
  'test',
  'app.e2e-spec.ts',
  'vitest.config.mts',
  'vitest.config.e2e.mts',
  'vitest-globals.d.ts',
]

const pnpmFiles: string[] = [
  'pnpm-workspace.yaml',
]

enum Tpl {
  Lib = 'lib',
  Cli = 'cli',
  Plugin = 'plugin',
  Monorepo = 'monorepo',
  Electron = 'electron',
  React = 'react',
}

const copyDirAsync = async (source: string, target: string, opts: PromptsResult) => {
  mkdirSync(target, { recursive: true })
  const entries = await readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    const { useVitest, pkgManager } = opts
    
    const name = entry.name
    const isDir = entry.isDirectory()
    const realName = renameFiles[name] ?? name
    
    if (ciFiles.includes(realName)) {
      if (!opts.cis.includes(realName)) {
        continue
      }
    }
    
    if (!useVitest && vitestFiles.includes(name)) {
      continue
    }
    
    if ((pkgManager !== PackageManager.PNPM) && pnpmFiles.includes(name)) {
      continue
    }
    
    const srcPath = join(source, name)
    const destPath = join(target, realName)
    if (isDir) {
      await copyDirAsync(srcPath, destPath, opts)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}


const assertPrompt = (value: unknown) => {
  if (isCancel(value)) {
    cancel('operation cancelled')
    process.exit(0)
  }
}


export class Action {
  public async handle(cmdArgs: string | undefined, options: Record<string, boolean | string>): Promise<void> {
    intro(cyan('create-project'))
    
    const config = await this.handlePrompts(cmdArgs, options)
    const { targetDir, pkgManager, template, packageName, description, useVitest, useGit, cis, repo } = config
    
    if (options.dryRun) {
      outro(MESSAGES.DRY_RUN_MODE)
      process.exit(0)
    }
    
    const cwd: string = process.cwd()
    const target = join(cwd, targetDir)
    
    await tasks([
      {
        title: MESSAGES.PROJECT_INFORMATION_START,
        task: async () => {
          const jr = (p: string) => join(target, p)
          
          const isCli = Tpl.Cli === template
          const isSub = [ Tpl.Cli, Tpl.Plugin ].includes(template)
          const isYarn = pkgManager === PackageManager.YARN
          const isPnpm = pkgManager === PackageManager.PNPM
          const useReleaseIt = cis.includes('.release-it.json')
          
          // -----------------------------------------------------
          if (isSub) {
            const templateDir = resolve(__dirname, '..', 'template', Tpl.Lib)
            await copyDirAsync(templateDir, target, config)
          }
          const templateDir = resolve(__dirname, '..', 'template', template)
          await copyDirAsync(templateDir, target, config)
          
          await editFile(jr('README.md'), content => {
            return content
              .replace(/\$PACKAGE_NAME/g, packageName)
              .replace(/\$DESCRIPTION/g, description)
              .replace(/\$INSTALL/g, isYarn ? PackageManager.YARN : `${ pkgManager } install`)
              .replace(/\$RUN/g, isYarn ? PackageManager.YARN : `${ pkgManager } run`)
              .replace(/\$START([\s\S]*?)\$END/g, (_, $1) => useVitest ? $1 : '')
              .replace(/(\r?\n){3,}/g, '\r\n'.repeat(2))
          })
          
          await editFile(jr('package.json'), content => {
            return content.replace(/__REPO__\/__NAME__/g, repo)
          })
          
          await scheduler.yield()
          
          // -----------------------------------------------------
          process.chdir(targetDir)
          
          // -----------------------------------------------------
          const deps: string[] = []
          const devDeps: string[] = []
          const scripts: Record<string, string> = {}
          
          // -----------------------------------------------------
          if (!useReleaseIt) {
            const release = [
              'release-it',
              'release-it-pnpm',
              '@release-it/conventional-changelog',
            ]
            devDeps.push(...release)
          }
          if (useReleaseIt) {
            Object.assign(scripts, { 'release': 'release-it' })
            
            if (!isPnpm) {
              devDeps.push('release-it-pnpm')
              
              if (useReleaseIt) {
                await editFile(jr('.release-it.json'), content => {
                  const json = JSON.parse(content)
                  delete json.plugins['release-it-pnpm']
                  return JSON.stringify(json, null, 2)
                })
              }
            }
          }
          
          // -----------------------------------------------------
          if (!useVitest) {
            const vitest = [
              'vitest',
              '@vitest/coverage-v8',
            ]
            devDeps.push(...vitest)
          }
          if (useVitest) {
            Object.assign(scripts, {
              test: 'vitest',
              'test:e2e': 'vitest run -c ./vitest.config.e2e.mts',
              'test:cov': 'vitest run --coverage',
            })
          }
          
          // -----------------------------------------------------
          if (!isCli) {
            deps.push(...[
              '@clack/prompts',
              'ansis',
              'commander',
            ])
          }
          
          // -----------------------------------------------------
          const del = deps.map(k => `dependencies[${ k }]`)
            .concat(devDeps.map(k => `devDependencies[${ k }]`))
            .join(' ')
          const add = Object.entries(scripts)
            .map(([ k, v ]) => `scripts.${ k }="${ v }"`)
            .join(' ')
          const cmdArr = [
            `npm pkg set name="${ packageName }" description="${ description }"`,
          ]
          if (isCli) {
            cmdArr.push('npm pkg delete exports main module types')
            cmdArr.push(`npm pkg set bin.${ packageName }="index.cjs"`)
          }
          if (del) cmdArr.push(`npm pkg delete ${ del }`)
          if (add) cmdArr.push(`npm pkg set ${ add }`)
          if (useGit) {
            const git = [
              'git init',
              'git branch -M master',
            ]
            cmdArr.push(...git)
          }
          
          await scheduler.yield()
          for (const cmd of cmdArr) {
            await execAsync(cmd)
          }
          
          return MESSAGES.PROJECT_INFORMATION_END
        },
      },
    ])
    
    let doneMessage = '🎉  Done. Now run:\n'
    const cdProjectName = relative(cwd, target)
    const prefix = `\n  ${ gray('$') }`
    if (target !== cwd) {
      const dir = cdProjectName.includes(' ') ? `"${ cdProjectName }"` : cdProjectName
      doneMessage += `${ prefix } ${ cyan('cd') } ${ dir }\n`
    }
    const dev = Tpl.Electron === template ? 'start' : 'dev'
    switch (pkgManager) {
      case PackageManager.YARN:
        doneMessage += `${ prefix } yarn`
        doneMessage += `${ prefix } yarn ${ dev }`
        break
      default:
        doneMessage += `${ prefix } ${ pkgManager } install`
        doneMessage += `${ prefix } ${ pkgManager } run ${ dev }`
        break
    }
    
    if (Tpl.Monorepo === template) {
      doneMessage += '\n'
      doneMessage += `${ prefix } pnpm changeset init`
    }
    
    outro(doneMessage)
    
    await scheduler.wait(500)
    process.exit(0)
  }
  
  public async handlePrompts(
    cmdArgs: string | undefined,
    options: Record<string, boolean | string>,
  ): Promise<PromptsResult> {
    // 1. Get project name and target dir
    let targetDir = cmdArgs ? toValidProjectName(cmdArgs) : undefined
    if (!targetDir) {
      const projectNameResult = await text({
        message: MESSAGES.PROJECT_NAME_QUESTION,
        placeholder: 'Anonymous',
        defaultValue: 'untitled',
      }) as string
      assertPrompt(projectNameResult)
      targetDir = toValidProjectName(projectNameResult)
    }
    
    
    // 2. Handle directory if exist and not empty
    const isExists = existsSync(targetDir)
    const ignore = [ '.git', '.idea', '.vscode' ]
    if (isExists && !await isEmpty(targetDir, ignore)) {
      const overwrite = options.overwrite
        ? YesOrNo.Yes
        : await select({
          message: MESSAGES.DIRECTION_CONFLICT_QUESTION(targetDir),
          options: [
            {
              label: 'Cancel operation',
              value: YesOrNo.No,
            },
            {
              label: 'Remove files and continue',
              value: YesOrNo.Yes,
            },
            {
              label: 'Ignore files and continue',
              value: YesOrNo.Null,
            },
          ],
        })
      assertPrompt(overwrite)
      switch (overwrite) {
        case YesOrNo.Yes:
          await emptyDir(targetDir, ignore)
          break
        case YesOrNo.No:
          process.exit(0)
      }
    }
    
    
    // 3. Get package name
    let packageName = basename(resolve(targetDir))
    if (!isValidPackageName(packageName)) {
      const packageNameResult = await text({
        message: MESSAGES.PACKAGE_NAME_QUESTION,
        initialValue: toValidPackageName(packageName),
        placeholder: toValidPackageName(packageName),
        validate(val) {
          if (!isValidPackageName(val)) {
            return 'Invalid package.json name'
          }
        },
      }) as string
      assertPrompt(packageNameResult)
      packageName = packageNameResult
    }
    
    
    // 4. Get project description
    const description = await text({
      message: MESSAGES.PACKAGE_DESCRIPTION_QUESTION,
      placeholder: 'Anonymous',
      defaultValue: 'My project description.',
    }) as string
    assertPrompt(description)
    
    
    // 5. Choose a template
    const dirs = await readSubDirs(resolve(__dirname, '..', 'template'))
    const argTemplate = options.template as Tpl
    const template = dirs.includes(argTemplate)
      ? argTemplate
      : await select({
        message: MESSAGES.PROJECT_TEMPLATE_QUESTION,
        options: dirs.map(k => ({ label: k, value: k })),
      }) as Tpl
    assertPrompt(template)
    
    
    // 6. Choose a package manager
    const pkgManager = Tpl.Monorepo === template
      ? PackageManager.PNPM
      : await select({
        message: MESSAGES.PACKAGE_MANAGER_QUESTION,
        options: [
          PackageManager.NPM,
          PackageManager.YARN,
          PackageManager.PNPM,
        ].map(k => {
          const version = checkVersion(k)
          return { label: k, value: k, hint: version }
        }).filter(k => k.hint),
      }) as PackageManager
    assertPrompt(pkgManager)
    
    
    // 7. Choose ci configs
    const useReleaseIt = ![ Tpl.React, Tpl.Monorepo ].includes(template)
    const useGithubReno = ![ Tpl.React ].includes(template)
    const cis = !useGithubReno ? [] : await multiselect({
      message: MESSAGES.PROJECT_CI_QUESTION,
      options: [
        {
          label: 'GitHub Workflows',
          hint: 'Adds basic CI/CD templates under .github/workflows',
          value: '.github',
          filter: () => useGithubReno,
        },
        {
          label: 'release-it',
          hint: 'Generates .release-it.json for versioning, changelogs, and releases',
          value: '.release-it.json',
          filter: () => useReleaseIt,
        },
        {
          label: 'Renovate',
          hint: 'Creates renovate.json to automate dependency updates',
          value: 'renovate.json',
          filter: () => useGithubReno,
        },
        {
          label: 'None',
          hint: 'Skip all optional configs',
          value: '',
          filter: () => useGithubReno,
        },
      ].filter(k => {
        if (k.filter()) return k
      }),
      required: false,
      initialValues: [],
    }) as string[]
    assertPrompt(cis)
    
    
    // 8. Confirm whether you use Vitest
    const unUse = [ Tpl.React, Tpl.Electron ].includes(template)
    const useVitest = unUse ? false : await confirm({
      message: MESSAGES.VITEST_USE_QUESTION,
    }) as boolean
    assertPrompt(useVitest)
    
    
    // 9. Confirm whether you use Git
    const isRepo = await isGitRepo()
    const useGithub = cis.includes('.github')
    const useGit = isRepo
      ? false
      : useGithub
        ? true
        : await confirm({
          message: MESSAGES.GIT_USE_QUESTION,
        }) as boolean
    assertPrompt(useGit)
    
    
    // 10. Input GitHub repo
    const unGit = !(useGit && useGithubReno)
    const defRepo = '__REPO__/__NAME__'
    const repo = unGit
      ? defRepo
      : await text({
        message: MESSAGES.PROJECT_REPO_QUESTION,
        initialValue: defRepo,
        placeholder: defRepo,
        validate(str) {
          const regex = /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+$/
          if (!regex.test(str)) {
            return 'Invalid repo name'
          }
        },
      }) as `${ string }/${ string }`
    assertPrompt(repo)
    
    return {
      targetDir,
      packageName,
      description,
      pkgManager,
      template,
      cis,
      useVitest,
      useGit,
      repo,
    }
  }
}
