import { exec, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'


export const __filename = fileURLToPath(import.meta.url)
export const __dirname = dirname(__filename)


export const execAsync = (cmd: string) => {
  return new Promise<string | undefined>(r => {
    exec(cmd, (err, stdout) => r(err ? undefined : stdout.trim()))
  })
}

export const pkgVersion = (pkg: string) => {
  return execAsync(`npm view ${ pkg } version`)
}

export const checkVersion = async (cmd: string) => {
  return execAsync(`${ cmd } --version`)
}

export const isValidPackageName = (packageName: string) => {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(packageName)
}

export const toValidPackageName = (packageName: string) => packageName
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/^[._]/, '')
  .replace(/[^a-z\d\-~]+/g, '-')

export const toValidProjectName = (projectName: string) => projectName
  .trim()
  .replace(/\/+$/g, '')

export const emptyDir = async (dir: string, ignore: string[] =[]) => {
  if (!existsSync(dir)) {
    return false
  }
  for (const file of await readdir(dir)) {
    if (ignore.includes(file)) {
      continue
    }
    await rm(resolve(dir, file), { recursive: true, force: true })
  }
  return true
}

export const isEmpty = async (path: string, ignore: string[] = []) => {
  const files = await readdir(path)
  const filtered = files.filter(f => !ignore.includes(f))
  return filtered.length === 0
}

export const editFile = async (file: string, callback: (content: string) => string) => {
  if (!existsSync(file)) return
  const content = await readFile(file, 'utf-8')
  return writeFile(file, callback(content), 'utf-8')
}

export const isGitRepo = async (dir?: string) => {
  const target = dir ? `./${ dir }` : '.'
  const cmd = `git -C "${ target }" rev-parse --is-inside-work-tree`
  const res = await execAsync(cmd)
  return !!res
}

export const readSubDirs = async (source: string, ignore: string[] = []) => {
  const res = await readdir(source, { withFileTypes: true })
  return res
    .filter(k => k.isDirectory() && !ignore.includes(k.name))
    .map(dir => dir.name)
}
