/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports['test.js TAP maximumBreadth config > must match snapshot 1'] = `
{
  "a": [
    "a",
    "b",
    "c"
  ]
}
`

exports['test.js TAP maximumBreadth config > must match snapshot 2'] = `
{
  "a": {
    "[DEBUG]": "2 keys not stringified",
    "a": 1,
    "b": 1,
    "c": 1
  }
}
`

exports['test.js TAP maximumDepth config > must match snapshot 1'] = `
{
  "a": {
    "b": "[Object]"
  }
}
`
