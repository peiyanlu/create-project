import { confirm, multiselect, select, text } from '@clack/prompts'
import { mkdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, resolve } from 'path'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { Action } from '../src/action'
import { emptyDir } from '../src/utils'


vi.mock('@clack/prompts')

const mockedText = vi.mocked(text)
const mockedMultiselect = vi.mocked(multiselect)
const mockedSelect = vi.mocked(select)
const mockedConfirm = vi.mocked(confirm)
const exitSpy = vi.spyOn(process, 'exit')
  .mockImplementation(() => {throw Error()})


const projectName = 'project-starter'


describe('The project name cannot be used as the package name', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await emptyDir(resolve(process.cwd(), 'project demo'), [])
    
    // 1. Get project name and target dir (cmdArgs is undefined)
    mockedText.mockResolvedValueOnce('project demo')
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // 3. Get package name
    mockedText.mockResolvedValueOnce('my-package')
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A project description.')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce('lib')
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce('npm')
    
    // 7. Choose ci configs
    mockedMultiselect.mockResolvedValueOnce([ '' ])
    
    // 8. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 9. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: 'project demo',
      packageName: 'my-package',
      description: 'A project description.',
      pkgManager: 'npm',
      template: 'lib',
      cis: [ '' ],
      useVitest: true,
      useGit: false,
      repo: '__REPO__/__NAME__',
    })
  })
})


describe('The project name can be used as the package name', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await emptyDir(resolve(process.cwd(), projectName), [])
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A project description.')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce('lib')
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 7. Choose ci configs
    mockedMultiselect.mockResolvedValueOnce([ '' ])
    
    // 8. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 9. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A project description.',
      pkgManager: 'pnpm',
      template: 'lib',
      cis: [ '' ],
      useVitest: true,
      useGit: false,
      repo: '__REPO__/__NAME__',
    })
  })
})


describe('The project directory is not empty', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    mkdirSync(join(process.cwd(), projectName, 'subfolder'), { recursive: true })
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce('yes')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A project demo')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce('lib')
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 7. Choose ci configs
    mockedMultiselect.mockResolvedValueOnce([ '' ])
    
    // 8. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 9. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A project demo',
      pkgManager: 'pnpm',
      template: 'lib',
      cis: [ '' ],
      useVitest: true,
      useGit: false,
      repo: '__REPO__/__NAME__',
    })
  })
})


describe('The command-line argument overwrite is true', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    mkdirSync(join(process.cwd(), projectName, 'subfolder'), { recursive: true })
    
    // // 1. Get project name and target dir
    // mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A project demo')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce('lib')
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 7. Choose ci configs
    mockedMultiselect.mockResolvedValueOnce([ '' ])
    
    // 8. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 9. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(projectName, { overwrite: true })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A project demo',
      pkgManager: 'pnpm',
      template: 'lib',
      cis: [ '' ],
      useVitest: true,
      useGit: false,
      repo: '__REPO__/__NAME__',
    })
  })
})


describe('Exit when the target directory is not empty', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    mkdirSync(join(process.cwd(), projectName, 'subfolder'), { recursive: true })
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce('.')
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce('no')
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = action.handlePrompts(undefined, { overwrite: false })
    await expect(res).rejects.toThrow('process.exit unexpectedly called with "0"')
    
    exitSpy.mockRestore()
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    onTestFinished(async () => {
      await rm(join(process.cwd(), projectName), { recursive: true })
    })
  })
})


describe('The target directory is the current directory', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce('.')
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce('ignore')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A project demo')
    
    // 5. Choose a template
    mockedSelect.mockResolvedValueOnce('lib')
    
    // 6. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 7. Choose ci configs
    mockedMultiselect.mockResolvedValueOnce([ '' ])
    
    // 8. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 9. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: '.',
      packageName: 'create-project',
      description: 'A project demo',
      pkgManager: 'pnpm',
      template: 'lib',
      cis: [ '' ],
      useVitest: true,
      useGit: false,
      repo: '__REPO__/__NAME__',
    })
  })
})
