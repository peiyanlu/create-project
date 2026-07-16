import { PkgManager } from '@peiyanlu/cli-utils'
import { createTempDir, TEST_TMP_DIR } from '@peiyanlu/test-tools'
import { existsSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Action, createDefaultConfig, pluginRegistry, Tpl } from '../src/action.js'
import { Context } from '../src/context.js'


const CWD = process.cwd()

let tempDir: string
const action = new Action()

const exist = (path: string) =>
  existsSync(resolve(tempDir, path))

const read = (path: string) =>
  readFileSync(resolve(tempDir, path), 'utf-8')

beforeEach(() => {
  tempDir = createTempDir()
})

afterEach(async () => {
  process.chdir(CWD)
  await rm(tempDir, { recursive: true })
})


describe('create library project', () => {
  it('no automation and no vitest', async () => {
    const ctx = new Context(createDefaultConfig(TEST_TMP_DIR))
    const template = Tpl.Lib
    const targetDir = basename(tempDir)
    Object.assign(ctx.config, {
      targetDir,
      target: resolve(ctx.config.cwd, targetDir),
      packageName: '@test/test-lib',
      description: 'library project',
      template,
      source: resolve(ctx.config.tplDir, template),
      plugin: pluginRegistry[template](),
      pkgManager: PkgManager.PNPM,
      automation: [],
      useVitest: false,
      repo: 'test/test-lib',
    })
    
    await action.createTask(ctx)
    
    expect(exist('package.json')).toBe(true)
    expect(exist('.gitignore')).toBe(true)
    expect(exist('.npmrc')).toBe(true)
    expect(exist('pnpm-workspace.yaml')).toBe(true)
    expect(exist('.github')).toBe(false)
    expect(exist('release.config.ts')).toBe(false)
    expect(exist('renovate.json')).toBe(false)
    expect(exist('vitest.config.mts')).toBe(false)
    
    expect(read('README.md')).toContain('@test/test-lib')
    expect(read('.gitignore')).toContain('dist/')
  })
  
  it('use automation but no vitest', async () => {
    const ctx = new Context(createDefaultConfig(TEST_TMP_DIR))
    const template = Tpl.Lib
    const targetDir = basename(tempDir)
    Object.assign(ctx.config, {
      targetDir,
      target: resolve(ctx.config.cwd, targetDir),
      packageName: '@test/test-lib',
      description: 'library project',
      template,
      source: resolve(ctx.config.tplDir, template),
      plugin: pluginRegistry[template](),
      pkgManager: PkgManager.PNPM,
      automation: [ 'github', 'release', 'renovate' ],
      useVitest: false,
      repo: 'test/test-lib',
    })
    
    await action.createTask(ctx)
    
    expect(exist('package.json')).toBe(true)
    expect(exist('.gitignore')).toBe(true)
    expect(exist('.npmrc')).toBe(true)
    expect(exist('pnpm-workspace.yaml')).toBe(true)
    expect(exist('.github')).toBe(true)
    expect(exist('release.config.ts')).toBe(true)
    expect(exist('renovate.json')).toBe(true)
    expect(exist('vitest.config.mts')).toBe(false)
    expect(exist('.github/workflows/test.yaml')).toBe(false)
    
    expect(read('README.md')).toContain('@test/test-lib')
    expect(read('.gitignore')).toContain('dist/')
  })
  
  it('use automation and vitest', async () => {
    const ctx = new Context(createDefaultConfig(TEST_TMP_DIR))
    const template = Tpl.Lib
    const targetDir = basename(tempDir)
    Object.assign(ctx.config, {
      targetDir,
      target: resolve(ctx.config.cwd, targetDir),
      packageName: '@test/test-lib',
      description: 'library project',
      template,
      source: resolve(ctx.config.tplDir, template),
      plugin: pluginRegistry[template](),
      pkgManager: PkgManager.PNPM,
      automation: [ 'github', 'release', 'renovate' ],
      useVitest: true,
      repo: 'test/test-lib',
    })
    
    await action.createTask(ctx)
    
    expect(exist('package.json')).toBe(true)
    expect(exist('.gitignore')).toBe(true)
    expect(exist('.npmrc')).toBe(true)
    expect(exist('pnpm-workspace.yaml')).toBe(true)
    expect(exist('.github')).toBe(true)
    expect(exist('release.config.ts')).toBe(true)
    expect(exist('renovate.json')).toBe(true)
    expect(exist('vitest.config.mts')).toBe(true)
    expect(exist('.github/workflows/test.yaml')).toBe(true)
    
    expect(read('README.md')).toContain('@test/test-lib')
    expect(read('.gitignore')).toContain('dist/')
    
    const text = read('package.json')
    expect(text).toContain('@test/test-lib')
    const json = JSON.parse(text)
    expect(Object.keys(json.devDependencies))
      .toEqual(expect.arrayContaining([
        'vitest',
        '@vitest/coverage-v8',
        '@peiyanlu/release',
      ]))
  })
})

describe('create react project', () => {
  it('should only has renovate', async () => {
    const ctx = new Context(createDefaultConfig(TEST_TMP_DIR))
    const template = Tpl.React
    const targetDir = basename(tempDir)
    Object.assign(ctx.config, {
      targetDir,
      target: resolve(ctx.config.cwd, targetDir),
      packageName: 'react-demo',
      description: 'react project',
      template,
      source: resolve(ctx.config.tplDir, template),
      plugin: pluginRegistry[template](),
      pkgManager: PkgManager.PNPM,
      automation: [ 'github', 'release', 'renovate' ],
      useVitest: true,
      repo: 'demo/react',
    })
    
    await action.createTask(ctx)
    
    expect(exist('package.json')).toBe(true)
    expect(exist('.gitignore')).toBe(true)
    expect(exist('.npmrc')).toBe(true)
    expect(exist('pnpm-workspace.yaml')).toBe(true)
    
    expect(exist('.github')).toBe(false)
    expect(exist('release.config.ts')).toBe(false)
    expect(exist('renovate.json')).toBe(true)
    expect(exist('vitest.config.mts')).toBe(false)
    
    expect(read('README.md')).toContain('react-demo')
    expect(read('.gitignore')).toContain('dist-ssr/')
    
    const text = read('package.json')
    expect(text).toContain('react-demo')
  })
})

describe('create electron project', () => {
  it('should not has vitest', async () => {
    const ctx = new Context(createDefaultConfig(TEST_TMP_DIR))
    const template = Tpl.Electron
    const targetDir = basename(tempDir)
    Object.assign(ctx.config, {
      targetDir,
      target: resolve(ctx.config.cwd, targetDir),
      packageName: 'electron-demo',
      description: 'electron project',
      template,
      source: resolve(ctx.config.tplDir, template),
      plugin: pluginRegistry[template](),
      pkgManager: PkgManager.PNPM,
      automation: [ 'github', 'release', 'renovate' ],
      useVitest: true,
      repo: 'demo/electron',
    })
    
    await action.createTask(ctx)
    
    expect(exist('package.json')).toBe(true)
    expect(exist('.gitignore')).toBe(true)
    expect(exist('.npmrc')).toBe(true)
    expect(exist('pnpm-workspace.yaml')).toBe(true)
    
    expect(exist('.github')).toBe(true)
    expect(exist('release.config.ts')).toBe(true)
    expect(exist('renovate.json')).toBe(true)
    expect(exist('vitest.config.mts')).toBe(false)
    expect(exist('forge.config.ts')).toBe(true)
    
    expect(read('README.md')).toContain('electron-demo')
    expect(read('.gitignore')).toContain('out/')
    expect(read('.npmrc')).toContain('#electron_mirror=https://npmmirror.com/mirrors/electron/')
    
    const text = read('package.json')
    expect(text).toContain('electron-demo')
    const json = JSON.parse(text)
    expect(Object.keys(json.devDependencies))
      .toEqual(expect.arrayContaining([
        '@peiyanlu/release',
      ]))
    expect(Object.keys(json.devDependencies))
      .not.toEqual(expect.arrayContaining([
      'vitest',
      '@vitest/coverage-v8',
    ]))
  })
})
