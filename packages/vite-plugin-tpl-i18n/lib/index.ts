import type { Plugin, ViteDevServer, ConfigEnv } from 'vite'
import type { transformOptions } from 'tpl-i18n-core'
import { createTransformer } from 'tpl-i18n-core'
import toSource from 'tosource'

const tplRegExp = new RegExp('\\.tpl$')

interface PluginOptions extends transformOptions {
  /** 词条写入路径 */
  yamlPath: string

  command: ConfigEnv['command']
}

function tplI18nPlugin (options: PluginOptions): Plugin {
  let server: ViteDevServer
  let { genExpression, genKey } = options
  let transformTpl = createTransformer({
    genKey,
    genExpression
  })

  return {
    name: 'vite:plugin-i18n-tpl',

    configureServer (_server) {
      server = _server
    },

    async transform (source, id) {
      if (!tplRegExp.test(id)) {
        return;
      }
      
      const { moduleGraph } = server
      const moduleInfo = moduleGraph.getModulesByFile(id)!

      // console.log(moduleInfo)

      // tpl 文件的处理通过 core 模块处理
      const { code } = await transformTpl(source)
      console.log(code)
      // 这一层的职责主要是获取关联模块，将 tpl 的转化结果写入到引用者对应的函数块中
      for (let { importers } of moduleInfo) {

      }

      // todo 将词条写入 yaml 文件

      return `export default ${toSource(code)}`
    }
  }
}

export default tplI18nPlugin