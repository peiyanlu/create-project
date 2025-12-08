import { green, rgb } from 'ansis'


export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'Project name:',
  PACKAGE_NAME_QUESTION: `Package name:`,
  PROJECT_REPO_QUESTION: `GitHub repo:`,
  PACKAGE_MANAGER_QUESTION: `Select package manager:`,
  PROJECT_TEMPLATE_QUESTION: `Select project template:`,
  PACKAGE_DESCRIPTION_QUESTION: 'Project description:',
  PROJECT_CI_QUESTION: `Select CI/automation configurations:`,
  DIRECTION_CONFLICT_QUESTION: (targetDir: string) => {
    return `${ targetDir === '.' ? 'Current' : 'Target' } directory "${ green(targetDir) }" is not empty:`
  },
  PROJECT_INFORMATION_START: `Creating project in a few seconds`,
  PROJECT_INFORMATION_END: `Created project successfully!`,
  GIT_USE_QUESTION: `Create ${ rgb(225, 92, 54)`Git` } repository?`,
  VITEST_USE_QUESTION: `Use ${ rgb(179, 209, 117)('Vitest') } as testing framework?`,
  DRY_RUN_MODE: 'Command has been executed in dry run mode, nothing changed!',
}
