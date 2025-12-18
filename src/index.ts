import { readJsonFile } from '@peiyanlu/cli-utils'
import { Ansis, blueBright, cyan, gray, greenBright, magenta, red, redBright, yellow } from 'ansis'
import { program } from 'commander'
import { join } from 'node:path'
import { Action, Tpl } from './action.js'
import { __dirname } from './utils.js'


const pkg = readJsonFile(join(__dirname, '..', 'package.json'))

const TEMPLATES: [ Ansis, string ][] = [
  [ yellow, Tpl.Electron ],
  [ cyan, Tpl.React ],
  [ magenta, Tpl.Lib ],
  [ redBright, Tpl.Cli ],
  [ greenBright, Tpl.Plugin ],
  [ blueBright, Tpl.Monorepo ],
]

program
  .name('create-project')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Output the current version.')
  .usage('[DIRECTORY] [OPTION]...')
  .argument('[directory]')
  .option('-d, --dry-run', 'Report actions that would be performed without writing out results.', false)
  .option('-o, --overwrite', 'When the target directory is not empty, the contents will be overwritten.', false)
  .option('-t, --template <template>', 'Use a specific template.', undefined)
  .action(async (argName: string, options: Record<string, boolean | string>) => {
    await new Action().handle(argName, options)
  })
  .helpOption('-h, --help', 'Output usage information.')
  .addHelpText(
    'after',
    `\nAvailable templates: ${ TEMPLATES.map(([ color, text ]) => `\n ${ gray`-` } ${ color(text) }`).join('') }`,
  )
  .parse(process.argv)


program.on('command:*', () => {
  console.error(`\n${ red`Error` } Invalid command: ${ red`%s` }`, program.args.join(' '))
  console.log(`See ${ red`--help` } for a list of available commands.\n`)
  process.exit(1)
})
