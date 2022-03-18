import { defineConfig } from 'vite'
import path from 'path'
import tplPlugin from '../../packages/vite-plugin-tpl-i18n/dist/index'

let index = 1

export default defineConfig(({ command, mode }) => {

  console.log(command, mode)

  return {
    plugins: [
      tplPlugin({
        command,
        genKey: () => {
          index++;
  
          return `test_${index}`
        },
        genExpression: (value) => `{[ this.${value} ]}`,
        yamlPath: path.resolve(__dirname, 'index.yaml')
      })
    ]
  }
})