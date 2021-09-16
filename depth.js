const stringify = require('./stable');  
function getNestedObject(depth) {
  const nested = {};
  const MAX_DEPTH = depth;
  let currentNestedObject = null;
  for (let i = 0; i < MAX_DEPTH; i++) {
    const k = 'nest_' + i;
    if (!currentNestedObject) {
      currentNestedObject = nested;
    }
    currentNestedObject[k] = {}
    currentNestedObject = currentNestedObject[k];
  }
  return nested
}
const obj = {
  test1: getNestedObject(10),
  test2: getNestedObject(10),
  test3: getNestedObject(10)
}
// console.log(stringify(nested, null, 2));
// console.log(stringify(obj))
console.log(JSON.stringify(JSON.parse(stringify(obj)), null, 2));