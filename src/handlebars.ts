import Handlebars from 'handlebars'


Handlebars.registerHelper('encode', aString => encodeURIComponent(aString))

Handlebars.registerHelper('shields', aString => aString.replaceAll('-', '--').replaceAll('_', '__'))


export const render = <T extends Record<string, unknown>>(text: string, context: T) => {
  const template = Handlebars.compile(text)
  return template(context)
}
