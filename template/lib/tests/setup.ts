import { vi } from 'vitest'


export class ExitError extends Error {
  constructor(public code?: string | number | null) {
    super(`process.exit(${ code })`)
    this.code = code
  }
}

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(process, 'exit').mockImplementation((code) => {
  throw new ExitError(code)
})
