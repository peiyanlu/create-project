export const getInstallCommand = (agent: string) => {
  if (agent === 'yarn') {
    return [ agent ]
  }
  return [ agent, 'install' ]
}

export const getRunCommand = (agent: string, script: string) => {
  switch (agent) {
    case 'yarn':
    case 'pnpm':
    case 'bun':
      return [ agent, script ]
    case 'deno':
      return [ agent, 'task', script ]
    default:
      return [ agent, 'run', script ]
  }
}
