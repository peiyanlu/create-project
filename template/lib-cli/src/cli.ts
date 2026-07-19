import { log } from '@clack/prompts'
import { type CliOptions } from '@peiyanlu/cli-utils'
import { readJsonFileSync } from '@peiyanlu/node-utils'
import { red } from 'ansis'
import { program } from 'commander'
import { join } from 'path'
import { Action } from './action.js'


const pkg = readJsonFileSync<Record<string, any>>(join(__dirname, '..', 'package.json'))

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Output the current version.')
  .usage('[ARGUMENT] [OPTION]...')
  .argument('[argument]')
  .option('-d, --dry-run', 'Report actions that would be performed without writing out results.', false)
  .action(async (argName: string, options: CliOptions) => {
    await new Action().handle(argName, options)
      .catch(error => {
        log.error(error.stack)
        throw error
      })
  })
  .helpOption('-h, --help', 'Output usage information.')
  .parse(process.argv)


program.on('command:*', () => {
  console.error(`\n${ red`Error` } Invalid command: ${ red`%s` }`, program.args.join(' '))
  console.log(`See ${ red`--help` } for a list of available commands.\n`)
  process.exit(1)
})
