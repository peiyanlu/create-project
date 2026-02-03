import { defineConfig } from '@peiyanlu/release'


export default defineConfig({
  toTag(pkg: string, version: string): string {
    return `${ version }`
  },
  git: {
    commitMessage: 'chore(release): v${tag}',
  },
  github: {
    releaseName: 'v${tag}',
  },
})
