import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parse } from 'path'
import { optimize } from 'svgo'
import { globSync } from 'tinyglobby'
import { normalizePath, Plugin } from 'vite'


interface ViteSvgIconsPlugin {
  iconDirs: string[];
  domId: string;
  symbolId: string;
}

const createSymbolCode = (iconDirs: string[], symbolId?: string, domId?: string) => {
  const ids = new Set()
  const textArr = iconDirs
    .map(d => normalizePath(d))
    .flatMap(
      cwd => globSync(
        [ '**/*.svg' ],
        {
          cwd,
          onlyFiles: true,
          absolute: true,
        },
      )
        .map(fullPath => {
          const { dir, name: fileName } = parse(fullPath)
          const dirName = dir.replace(cwd, '').replaceAll('/', '-')
          
          const id = (symbolId ?? 'symbol-[dir]-[name]')
            .replace(/\[dir]/g, dirName)
            .replace(/-{2,}/g, '-')
            .replace(/\[name]/g, fileName)
          
          const input = readFileSync(fullPath).toString()
          const { data: code } = optimize(input)
          return { code, id }
        })
        .map(({ code, id }) => {
          ids.add(id)
          
          return code
            .replace(/<svg([^>+].*?)>/, (_$1, $2: string) => {
              const formatId = (id: string) => id
                .replace(/[\s'‘’]/g, '')
                .replace(/[(){}（）【】\[\]]/g, '_')
              
              const attrsVal = <T extends string = string>(str: string, attr: string, def: T): T | string => str
                .match(new RegExp(`(?<=${ attr }=")([^>+].*?)(?=")`, 'g'))?.[0] ?? def
              
              const width = attrsVal($2, 'width', '1024')
              const height = attrsVal($2, 'height', '1024')
              const viewBox = attrsVal($2, 'viewBox', `0, 0, ${ width }, ${ height }`)
              
              return `<symbol id="${ formatId(id) }" viewBox="${ viewBox }">`
            })
            .replace('</svg>', '</symbol>')
        }),
    )
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">${ textArr.join('') }</svg>`
  const code = `
    if (typeof window !== 'undefined') {
      function loadSvg() {
        const body = document.body;
        const id = '${ domId }' ?? 'svg-icons-dom';
        let svgDom = document.getElementById(id);
        if(!svgDom) {
          svgDom = document.createElement('div');
          svgDom.id = id;
          document.body.appendChild(svgDom);
        }
        svgDom.innerHTML = '${ svg }';
        body.insertBefore(svgDom, body.lastChild);
      }
      if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSvg);
      } else {
        loadSvg()
      }
    }
    export default {}
  `
  const idSet = `export default ${ JSON.stringify([ ...ids ]) }`
  
  return { code, idSet }
}


const simpleEtag = (body: string, weak = true) => {
  const hash = createHash('sha1').update(body).digest('base64')
  return `${ weak ? 'W/' : '' }"${ hash }"`
}


export function createSvgIconsPlugin(opt: ViteSvgIconsPlugin): Plugin {
  const { iconDirs, symbolId, domId } = opt
  
  const SVG_ICONS_REGISTER_NAME = 'virtual:svg-icons-register'
  const SVG_ICONS_CLIENT = 'virtual:svg-icons-names'
  
  let isBuild = false
  let { code, idSet } = createSymbolCode(iconDirs, symbolId, domId)
  
  return {
    name: 'SvgIconsPlugin',
    configResolved({ command }) {
      isBuild = command === 'build'
    },
    resolveId(id) {
      if ([ SVG_ICONS_REGISTER_NAME, SVG_ICONS_CLIENT ].includes(id)) {
        return id
      }
      return null
    },
    async load(id, ssr) {
      if (!isBuild && !ssr) return null
      const isRegister = id.endsWith(SVG_ICONS_REGISTER_NAME)
      const isClient = id.endsWith(SVG_ICONS_CLIENT)
      
      if (ssr && !isBuild && (isRegister || isClient)) {
        return `export default {}`
      }
      
      if (isRegister) {
        return code
      }
      
      if (isClient) {
        return idSet
      }
    },
    configureServer: ({ middlewares }) => {
      middlewares.use(async (req, res, next) => {
        const url = normalizePath(req.url!)
        
        const registerId = `/@id/${ SVG_ICONS_REGISTER_NAME }`
        const clientId = `/@id/${ SVG_ICONS_CLIENT }`
        
        if ([ registerId, clientId ].some((item) => url.endsWith(item))) {
          const content = url.endsWith(registerId) ? code : idSet
          const tag = simpleEtag(content, true)
          
          // ETag 命中，直接 304
          if (req.headers['if-none-match'] === tag) {
            res.statusCode = 304
            return res.end()
          }
          
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Etag', tag)
          
          res.statusCode = 200
          res.end(content)
        } else {
          next()
        }
      })
    },
  }
}
