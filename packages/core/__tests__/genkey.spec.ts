import { beforeEach, describe, expect, test, beforeAll } from 'vitest'
import type { Element, Attribute } from 'parse5'
import { createKeyTransformer } from '../lib/index'
let transform;

describe('normal usage', () => {

  beforeEach(() => {
    transform = createKeyTransformer({
      genKey: (node) => 'test',
      genExpression: (value) => `{[ this.${value} ]}`
    })
  })

  test('default value', () => {
    let attr: Attribute = {
      name: '',
      value: ''
    }
    const res = transform(attr)

    expect(res.key).toBe('test')
    expect(res.expression).toBe('{[ this.test ]}')
  })

  test('set key value', () => {
    let attr: Attribute = {
      name: '',
      value: ''
    }
    const res = transform(attr)

    res.key = 'hello'
    expect(res.key).toBe('hello')
    expect(res.expression).toBe('{[ this.hello ]}')
  })

  test('set expression value', () => {
    let attr: Attribute = {
      name: '',
      value: ''
    }
    const res = transform(attr)
    expect(() => { res.expression = 'hello' }).toThrowError(/^Modification of the expression property alone is not supported$/)
  })

})

describe('genKey and genExpression other usage', () => {
  beforeAll(() => {
    transform = createKeyTransformer({
      genKey: (node) => '',
      genExpression: (value) => `{[ this.${value} ]}`
    })
  })

  test('empty value', () => {
    let attr: Attribute = {
      name: '',
      value: ''
    }

    expect(() => { transform(attr) }).toThrowError(/^The entry key cannot be empty$/)
  })
})