import { beforeAll, beforeEach, afterAll, afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'


const exit = vi
  .spyOn(process, 'exit')
  .mockImplementation((code?: string | number | null) => {
    throw Object.assign(new Error('process.exit'), { code })
  })
