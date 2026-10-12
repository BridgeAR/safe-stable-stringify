import '../index.js'

const sharedGlobal = /** @type {Record<symbol, typeof import('../index.js').default>} */ (
  globalThis
)

export const stringify = sharedGlobal[Symbol.for('safe-stable-stringify@3.0.0')]
export const configure = stringify.configure
export default stringify
