import { describe, test, expect, beforeAll, beforeEach } from 'vitest'
import { createTransformer, transformFromFile } from '../lib/index'
import path from 'path'

let transform

async function assetTransform (source: string, result: string) {
  const { code } = await transform(source)
  expect(code).toBe(result)
}

describe('tpl i18n no lang', () => {
  beforeAll(() => {
    transform = createTransformer({
      genKey: (node) => `node_test_1`,
      genExpression: (value) => `{[ this.${value} ]}`
    })
  })

  test('empty string', async () => {
    await assetTransform('', '')
  })

  test('blank character tpl', async () => {
    await assetTransform(' ', ' ')
  })

  test('html tpl', async () => {
    await assetTransform(`<html><body><div></div></body></html>`, `<html><body><div></div></body></html>`)
  })

  test('html fragment', async () => {
    await assetTransform('<p>hello</p>', '<p>hello</p>')
  })
})


describe('tpl i18n lang node', () => {
  let index

  beforeEach(() => {
    index = 0
    transform = createTransformer({
      genKey: (node) => {
        index++
        return `node_test_${index}`
      },
      genExpression: (value) => `{[ this.${value} ]}`
    })
  })

  test('html tpl with lang', async () => {
    const tpl = `<html><body><lang>中文</lang></body></html>`
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('<html><body>{[ this.node_test_1 ]}</body></html>')
    const map = {
      'node_test_1': '中文'
    }
    expect(langMap).toEqual(map)
  })

  test('html fragment with lang', async () => {
    const tpl = '<lang>汉字</lang><div>content<lang>内部用法</lang></div>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('{[ this.node_test_1 ]}<div>content{[ this.node_test_2 ]}</div>')
    const map = {
      'node_test_1': '汉字',
      'node_test_2': '内部用法'
    }
    expect(langMap).toEqual(map)
  })

  test('sibling lang', async () => {
    const tpl = '<lang>汉字</lang><lang>内部用法</lang>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('{[ this.node_test_1 ]}{[ this.node_test_2 ]}')
    const map = {
      'node_test_1': '汉字',
      'node_test_2': '内部用法'
    }
    expect(langMap).toEqual(map)
  })
  
  test('illegal lang', async () => {
    const tpl = '<div><lang>汉字</div></lang>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('<div>{[ this.node_test_1 ]}</div></lang>')
    const map = {
      'node_test_1': '汉字'
    }
    expect(langMap).toEqual(map)
  })

  test('test nested in lang tag', async () => {
    const tpl = '<lang>嵌套<input type="button" />尾部</lang>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('{[ this.node_test_1 ]}')
    const map = {
      'node_test_1': '嵌套<input type="button" />尾部'
    }
    expect(langMap).toEqual(map)
  })

  test('nested lang tag', async () => {
    const tpl = '<lang>头部<lang>中间</lang>尾部</lang>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('{[ this.node_test_1 ]}')
    const map = {
      'node_test_1': '头部<lang>中间</lang>尾部'
    }
    expect(langMap).toEqual(map)
  })

  test('empty lang tag', async () => {
    const tpl = '<lang></lang>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('{[ this.node_test_1 ]}')
    const map = {
      'node_test_1': ''
    }
    expect(langMap).toEqual(map)
  })

  test('special char', async () => {
    const tpl = '<lang>确定{#noun#}</lang>'
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('{[ this.node_test_1 ]}')
    const map = {
      'node_test_1': '确定{#noun#}'
    }
    expect(langMap).toEqual(map)
  })
})

describe('i18n lang attributes', () => {
  let index

  beforeEach(() => {
    index = 0
    transform = createTransformer({
      genKey: (node) => {
        index++
        return `node_test_${index}`
      },
      genExpression: (value) => `{[ this.${value} ]}`
    })
  })

  test('single attr', async () => {
    const tpl = `<input placeholder="<lang>请输入</lang>" />`
    const { code, langMap } = await transform(tpl)
    expect(code).toMatch('<input placeholder="{[ this.node_test_1 ]}" />')
    const map = {
      'node_test_1': '请输入'
    }
    expect(langMap).toEqual(map)
  })

  test('empty lang attr', async () => {
    const tpl = `<input placeholder="<lang></lang>" />`
    const { code, langMap } = await transform(tpl)
    expect(code).toMatch('<input placeholder="{[ this.node_test_1 ]}" />')
    const map = {
      'node_test_1': ''
    }
    expect(langMap).toEqual(map)
  })

  test('multi lang attr', async () => {
    const tpl = `<input placeholder="<lang>请输入</lang>" data-tip="<lang>输入整数</lang>" />`
    const { code, langMap } = await transform(tpl)
    expect(code).toBe('<input placeholder="{[ this.node_test_1 ]}" data-tip="{[ this.node_test_2 ]}" />')
    const map = {
      'node_test_1': '请输入',
      'node_test_2': '输入整数'
    }
    expect(langMap).toEqual(map)
  })

  test('single quota', async () => {
    const tpl = `<input placeholder='<lang>请输入</lang>' />`
    const { code, langMap } = await transform(tpl)
    expect(code).toBe(`<input placeholder='{[ this.node_test_1 ]}' />`)
    const map = {
      'node_test_1': '请输入'
    }
    expect(langMap).toEqual(map)
  })
})

describe ('transform file', () => {

  test('transform from file', async () => {
    const demoFile = path.resolve(__dirname, './demo/test.tpl')
    let index = 0
    const result = await transformFromFile(demoFile, {
      genKey: (node) => {
        index++
        return `node_test_${index}`
      },
      genExpression: (value) => `{[ this.${value} ]}`
    })

    expect(result.code).toMatchSnapshot()
    expect(result.langMap).toEqual({
        'node_test_1': 'hello',
        'node_test_2': '请输入'
    })
  })
})