import { confirm, multiselect, select, text } from '@clack/prompts'
import { ConfirmResult, emptyDir, PkgManager, runNodeSync } from '@peiyanlu/cli-utils'
import { TEST_TMP_ROOT } from '@peiyanlu/test-tools'
import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Action, createDefaultConfig, pluginRegistry, type RealContext, Tpl } from '../src/action.js'
import { Context } from '../src/context.js'


vi.mock('@clack/prompts')

const mockedText = vi.mocked(text)
const mockedSelect = vi.mocked(select)
const mockedConfirm = vi.mocked(confirm)
const mockedMultiselect = vi.mocked(multiselect)

const exit = vi
  .spyOn(process, 'exit')
  .mockImplementation((code?: string | number | null) => {
    throw Object.assign(new Error('process.exit'), { code })
  })


const projectName = 'project-starter'
const description = 'A new project description.'
const repo = `__OWNER__/${ projectName }`

const CWD = process.cwd()
const TMP_CWD = TEST_TMP_ROOT
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


describe('create: lib (default package name)', () => {
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
    await emptyDir(TMP_DIR, [])
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Lib)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // automation
    mockedMultiselect.mockResolvedValueOnce([])
    
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
      automation: [],
      repo: repo,
      useVitest: true,
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.Lib](),
      source: resolve(CWD, 'template', Tpl.Lib),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
    })
  })
})


describe('create: lib (custom package name)', () => {
  const projectName = 'project starter'
  const packageName = projectName.replace(/\s+/, '')
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
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
    
    // automation
    mockedMultiselect.mockResolvedValueOnce([])
    
    // repo
    mockedText.mockResolvedValueOnce(`__OWNER__/${ packageName }`)
    
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
      automation: [],
      repo: `__OWNER__/${ packageName }`,
      useVitest: false,
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.Lib](),
      source: resolve(CWD, 'template', Tpl.Lib),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
    })
  })
})


describe('create: lib (with CLI args)', () => {
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
    await makeDirty()
    
    // // 1. Get project name and target dir
    // mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Lib)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // automation
    mockedMultiselect.mockResolvedValueOnce([])
    
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
      automation: [],
      repo: repo,
      useVitest: true,
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.Lib](),
      source: resolve(CWD, 'template', Tpl.Lib),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
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
    await expect(res).rejects.toThrow('process.exit')
    await expect(res).rejects.toMatchObject({ code: 0 })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
  })
})


describe('create: monorepo', () => {
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Monorepo)
    
    // --------------------------------------------
    
    // automation
    mockedMultiselect.mockResolvedValueOnce([])
    
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
      automation: [],
      repo: repo,
      useVitest: true,
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.Monorepo](),
      source: resolve(CWD, 'template', Tpl.Monorepo),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
    })
  })
})


describe('create: cli', () => {
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A cli project description.')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Cli)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // automation
    mockedMultiselect.mockResolvedValueOnce([])
    
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
      automation: [],
      repo: repo,
      useVitest: true,
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.Cli](),
      source: resolve(CWD, 'template', Tpl.Cli),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
    })
  })
})


describe('create: electron', () => {
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce(Tpl.Electron)
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // --------------------------------------------
    
    // automation
    mockedMultiselect.mockResolvedValueOnce([])
    
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
      automation: [],
      repo: repo,
      useVitest: false,
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.Electron](),
      source: resolve(CWD, 'template', Tpl.Electron),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
    })
  })
})


describe('create: react', () => {
  let ctx: RealContext
  
  beforeEach(async () => {
    vi.clearAllMocks()
    ctx = new Context(createDefaultConfig())
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(ConfirmResult.YES)
    
    // // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
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
      automation: [],
      useVitest: false,
      repo: '',
      cwd: TMP_CWD,
      plugin: pluginRegistry[Tpl.React](),
      source: resolve(CWD, 'template', Tpl.React),
      target: resolve(TMP_CWD, projectName),
      tplAppDir: resolve(CWD, 'template', 'common', 'app'),
      tplBaseDir: resolve(CWD, 'template', 'common', 'base'),
      tplDir: resolve(CWD, 'template'),
      tplLibDir: resolve(CWD, 'template', 'common', 'lib'),
    })
  })
})

it('prompts for the project name if none supplied', () => {
  const res = runNodeSync([ CWD ])
  expect(res).toContain('Project name:')
})
