import Handlebars from 'handlebars'


Handlebars.registerHelper('encode', aString => encodeURIComponent(aString))


export const render = <T extends Record<string, unknown>>(text: string, context: T) => {
  const template = Handlebars.compile(text)
  return template(context)
}
