import parse5 from 'parse5'
import type { Element, Attribute } from 'parse5'
import MagicString from 'magic-string'
import path from 'path'
import { readFile } from 'fs/promises'

const LANG_TAG_NAME = 'lang'
const LANG_TEXT_REG = /^<lang>(.*?)<\/lang>$/

interface LANG_ITEM {
  content: string
  startOffset: number
  endOffset: number
}

interface replaceInfo {
  key: string,
  expression: string
}

/** 外部传入的配置 */
interface transformOptions {
  genKey: (node: Element | Attribute) => string
  genExpression (str: string): string
}

type internalConfig = transformOptions & {
  i18nTransform (node: Element | Attribute): replaceInfo
}

export function parse(source: string) {
  return parse5.parse(source, {
    sourceCodeLocationInfo: true
  })
}

export function createKeyTransformer (config: transformOptions) {
  const { genKey, genExpression } = config
  
  return (node: Element | Attribute): replaceInfo => {
    let res = new Proxy({
      key: '',
      expression: ''
    }, {
      get (target, key) {
        return target[key]
      },
      set (target, key, value) {
        // 不能单独修改表达式
        if (key === 'expression') {
          throw Error('Modification of the expression property alone is not supported')
        }
  
        // 词条key不能为空
        if (value === '') {
          throw Error('The entry key cannot be empty')
        }
  
        target[key] = value
  
        // 产品线这里很多情况，有 {[]} 的、有 {}(apply 传参的)、有直接将 $i 传入到 tpl 中
        target.expression = genExpression(value)
  
        return true
      }
    })
  
    // todo key 的生成规则，这里需要两台规则，分别对应两种接口的数据
    res.key = genKey(node)
  
    return res
  }
  
}

function resolveOptions(options: transformOptions): internalConfig {
  let config = {
    ...options,
    i18nTransform: createKeyTransformer(options)
  }

  return config
}

export function traverse(tree, func: (param: Element) => void) {
  tree = tree ?? []
  let nodes = Array.isArray(tree) ? tree : [tree]

  for (let node of nodes) {
    if (node?.sourceCodeLocation) {
      func(node)
    }

    traverse(node.childNodes, func)
  }
}


/**
 * 判断是否 lang 的父级
 *
 * @param {Element} node
 * @return {*}  {boolean}
 */
function hasLangParents(node: Element): boolean {
  let parent = node.parentNode

  while (parent) {
    if (parent.nodeName === LANG_TAG_NAME) {
      return true
    }

    parent = (parent as Element)?.parentNode
  }

  return false
}

export function createTransformer(
  options: transformOptions
) {
  const { i18nTransform } = resolveOptions(options)

  return async (source: string) => {
    const langMap = new Map<string, string>()

    if (!source) {
      return {
        code: '',
        langMap
      }
    }

    const ast = parse(source)
    const s = new MagicString(source)

    // 递归遍历 ast，找到有 lang 的标签或者属性就做字符串操作
    traverse(ast, (node: Element) => {
      const { sourceCodeLocation } = node

      // tagName === 'lang' 并且没有父级的 lang
      if (node.nodeName === LANG_TAG_NAME && !hasLangParents(node)) {
        const { startOffset, endOffset } = sourceCodeLocation!
        let text = s.slice(startOffset, endOffset)
        const matchers = text.match(LANG_TEXT_REG)
        text = matchers ? matchers[1] : parse5.serialize(node)

        // 替换 tpl 时，替换代码跟key是两个东西，key 代表语言包中的词条 key，expression 表示的是要真实替换到tpl代码中的字符串
        const { key, expression } = i18nTransform(node)
        langMap.set(key, text)

        s.overwrite(startOffset, endOffset, expression)
      }
 
      // attrs 数组里面的项包含 lang
      (node?.attrs || []).forEach(attr => {
        const { value } = attr
        const matchers = value.match(LANG_TEXT_REG)

        if (matchers) {
          // 替换 tpl 时，替换代码跟key是两个东西，key 代表语言包中的词条 key，expression 表示的是要真实替换到tpl代码中的字符串
          const { key, expression } = i18nTransform(attr)
          langMap.set(key, matchers[1])

          s.replace(value, expression)
         
        }
      })
    })

    return {
      code: s.toString(),
      langMap
    };
  }
}

export async function transformFromFile(file: string, options: transformOptions) {
  const source = await readFile(path.resolve(process.cwd(), file), 'utf-8')
  const result = await createTransformer(options)(source)

  return result
}
