import './style.css'
import tpl from './index.tpl'
import tpl2 from './index2.tpl'
import pkg from './package.json'

document.querySelector('#app').innerHTML = `
  ${tpl}
  <h1>Hello ${pkg.name}!</h1>
  ${tpl2}
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`