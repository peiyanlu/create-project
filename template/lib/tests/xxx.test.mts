import { mkdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, resolve } from 'path'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
