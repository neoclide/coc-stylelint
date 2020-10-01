# inspect-with-kind

> 🚧 Inlined dependency taken from [https://github.com/shinnn/inspect-with-kind](https://github.com/shinnn/inspect-with-kind).

---

[`util.inspect`][util.inspect] with additional type information

```javascript
const { inspect } = require("util");
const inspectWithKind = require("inspect-with-kind");

inspect([1, 2, 3]); //=> '[ 1, 2, 3 ]'
inspectWithKind([1, 2, 3]); //=> '[ 1, 2, 3 ] (array)'
```

## Installation

[Use npm.](https://docs.npmjs.com/cli/install)

```sh
npm install inspect-with-kind
```

## API

```javascript
const inspectWithKind = require("inspect-with-kind");
```

### inspectWithKind(_value_ [, *options*])

_value_: any type  
_options_: `Object` ([`util.inspect`][util.inspect] options)  
Return: `string`

Almost the same as `util.inspect`, but:

- It appends a type information to the string if the first argument is one of `boolean`, `string`, `number`, `bigint`, `Array`, `RegExp`, `Date`, `arguments` or a plain `Object`.
- Error stack trace is omitted.
- `breakLength` option defaults to `Infinity`.
- `maxArrayLength` option defaults to `10`.

```javascript
const util = require("util");
const inspectWithKind = require("inspect-with-kind");

// appends type info
util.inspect(1); //=> '1'
inspectWithKind(1); //=> '1 (number)'
util.inspect("1"); //=> '\'1\''
inspectWithKind("1"); //=> '\'1\' (string)'

// doesn't appends type info, because <Buffer ...> clearly expresses what it is
util.inspect(Buffer.from("1")); //=> '<Buffer 31>'
inspectWithKind(Buffer.from("1")); //=> '<Buffer 31>'

// omits stack trace
util.inspect(new Error("error!")); //=> 'Error: error!\n    at repl:1:14\n    at ContextifyScript ...'
inspectWithKind(new Error("error!")); //=> 'Error: error!'
```

## Example

This module is useful for making `TypeError` error messages in your Node.js library.

```javascript
const inspectWithKind = require("inspect-with-kind");

module.exports = function reverse(v) {
  if (typeof v !== "boolean") {
    throw new TypeError(
      `Expected a Boolean value, but got ${inspectWithKind(v)}.`
    );
  }

  return !v;
};
```

```javascript
const reverse = require("./reverse.js");

reverse(/true/); // TypeError: Expected a Boolean value, but got /true/ (regexp).
```

[util.inspect]: https://nodejs.org/api/util.html#util_util_inspect_object_options
