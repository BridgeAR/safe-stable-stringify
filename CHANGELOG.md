# Changelog

## v2.0.0

- [BREAKING] Convert BigInt to number by default instead of ignoring these values
  If you wish to ignore these values similar to v1.1.1, just use the new `bigint` option and set it to `false`.
- [BREAKING] Support ESM
- [BREAKING] Requires ES6
- Optional BigInt support
- Deterministic behavior is now optional
- The value to indicate a circular structure is now adjustable
- Significantly faster TypedArray stringification
- Smaller Codebase
- Removed stateful indentation to guarantee side-effect freeness

## v1.1.1

- Fixed an indentation issue in combination with empty arrays and objects
- Updated dev dependencies

## v1.1.0

- Add support for IE11 (917b612)
- Fix issue with undefined values (4196f87, 4eab558)
- Fix typescript definition (7a87478)
- Improve code coverage (ed8cadc, b58c494)
- Update dev dependencies (b857ea8)
- Improve docs