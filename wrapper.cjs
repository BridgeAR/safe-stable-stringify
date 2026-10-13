'use strict'

require('./index.js')

const sharedGlobal = /** @type {Record<symbol, typeof import('./index.js').default>} */ (
  globalThis
)

module.exports = sharedGlobal[Symbol.for('safe-stable-stringify@3.0.0')]
