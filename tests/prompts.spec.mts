import { confirm, select, text } from '@clack/prompts'
import { ConfirmResult, emptyDir, PkgManager } from '@peiyanlu/cli-utils'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'path'
import { afterAll, afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { Action, createDefaultConfig, Tpl } from '../src/action.js'
import { Context } from '../src/context.js'


vi.mock('@clack/prompts')

const mockedText = vi.mocked(text)
const mockedSelect = vi.mocked(select)
const mockedConfirm = vi.mocked(confirm)


const projectName = 'project-starter'
const description = 'A new project description.'
const repo = `__USER__/${ projectName }`

const CWD = process.cwd()
const TMP_CWD = resolve(__dirname, '.tmp')
const TMP_DIR = resolve(TMP_CWD, projectName)

const makeDirty = () => mkdir(resolve(TMP_DIR, 'subfolder'), { recursive: true })


beforeEach(async () => {
  await mkdir(TMP_DIR, { recursive: true })
  process.chdir(TMP_CWD)
})

afterEach(async () => {
  if (existsSync(TMP_DIR)) {
    await rm(TMP_DIR, { recursive: true })
  }
})

afterAll(async () => {
  if (existsSync(TMP_CWD)) {
    process.chdir(CWD)
    await rm(TMP_CWD, { recursive: true })
  }
})


describe('create: lib (default package name)', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await emptyDir(TMP_DIR, [])
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Lib)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // useCI
    mockedConfirm.mockResolvedValueOnce(true)
    
    // repo
    mockedText.mockResolvedValueOnce(repo)
    
    // useVitest
    mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      template: Tpl.Lib,
      useCI: true,
      repo: repo,
      useVitest: true,
    })
  })
})


describe('create: lib (custom package name)', () => {
  const projectName = 'project starter'
  const packageName = projectName.replace(/\s+/, '')
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await emptyDir(TMP_DIR, [])
    
    // 1. Get project name and target dir (cmdArgs is undefined)
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // 3. Get package name
    mockedText.mockResolvedValueOnce(packageName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Lib)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.NPM)
    
    // --------------------------------------------
    
    // useCI
    mockedConfirm.mockResolvedValueOnce(true)
    
    // repo
    mockedText.mockResolvedValueOnce(`__USER__/${ packageName }`)
    
    // useVitest
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: packageName,
      description: description,
      pkgManager: PkgManager.NPM,
      template: Tpl.Lib,
      useCI: true,
      repo: `__USER__/${ packageName }`,
      useVitest: false,
    })
  })
})


describe('create: lib (with CLI args)', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await makeDirty()
    
    // // 1. Get project name and target dir
    // mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Lib)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // useCI
    mockedConfirm.mockResolvedValueOnce(true)
    
    // repo
    mockedText.mockResolvedValueOnce(repo)
    
    // useVitest
    mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(projectName, { overwrite: true }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      template: Tpl.Lib,
      useCI: true,
      repo: repo,
      useVitest: true,
    })
  })
})


describe('create: exit on non-empty dir', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.NO)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = action.handlePrompts(undefined, { overwrite: false }, ctx)
    // await expect(res).rejects.toMatchObject({ code: 0 })
    await expect(res).rejects.toThrow('process.exit(0)')
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
  })
})


describe('create: monorepo', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Monorepo)
    
    // --------------------------------------------
    
    // useCI
    mockedConfirm.mockResolvedValueOnce(true)
    
    // repo
    mockedText.mockResolvedValueOnce(repo)
    
    // useVitest
    mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      template: Tpl.Monorepo,
      useCI: true,
      repo: repo,
      useVitest: true,
    })
  })
})


describe('create: cli', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A cli project description.')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Cli)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // useCI
    mockedConfirm.mockResolvedValueOnce(true)
    
    // repo
    mockedText.mockResolvedValueOnce(repo)
    
    // useVitest
    mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A cli project description.',
      pkgManager: PkgManager.PNPM,
      template: Tpl.Cli,
      useCI: true,
      repo: repo,
      useVitest: true,
    })
  })
})


describe('create: electron', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Electron)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // useCI
    mockedConfirm.mockResolvedValueOnce(true)
    
    // repo
    mockedText.mockResolvedValueOnce(repo)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      template: Tpl.Electron,
      useCI: true,
      repo: repo,
      useVitest: false,
    })
  })
})


describe('create: react', () => {
  const ctx = new Context(createDefaultConfig())
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.React)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false }, ctx)
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      template: Tpl.React,
      useCI: false,
      useVitest: false,
      repo: '',
    })
  })
})


const run = (args: string[]) => {
  return spawnSync('node', [ CWD, ...args ], { encoding: 'utf-8' })
}

test('prompts for the project name if none supplied', () => {
  const { stdout } = run([])
  expect(stdout).toContain('Project name:')
})
