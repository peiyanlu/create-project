import { green, rgb, yellow } from 'ansis'


export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'Project name:',
  PACKAGE_NAME_QUESTION: 'Package name:',
  PROJECT_REPO_QUESTION: 'GitHub repository:',
  PACKAGE_MANAGER_QUESTION: 'Select package manager:',
  PROJECT_TEMPLATE_QUESTION: 'Select project template:',
  PACKAGE_DESCRIPTION_QUESTION: 'Project description:',
  PROJECT_CI_QUESTION: `Include ${ yellow`CI/automation` } config:`,
  
  DIRECTORY_CONFLICT_QUESTION: (dir: string) =>
    `${ dir === '.' ? 'Current' : 'Target' } directory "${ green(dir) }" is not empty:`,
  
  PROJECT_INFORMATION_START: 'Creating project...',
  PROJECT_INFORMATION_END: 'Project created successfully!',
  
  GIT_USE_QUESTION: `Initialize ${ rgb(225, 92, 54)('Git') } repository?`,
  VITEST_USE_QUESTION: `Use ${ rgb(179, 209, 117)('Vitest') } for testing?`,
  
  OPERATION_ABORTED: 'Operation cancelled.',
  DRY_RUN_MODE: 'Dry run mode enabled. No changes were made.',
}
