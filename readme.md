# koa-some

[![Build Status](https://travis-ci.org/uNmAnNeR/koa-some.svg?branch=master)](https://travis-ci.org/uNmAnNeR/koa-some)
[![npm version](https://badge.fury.io/js/koa-some.svg)](https://badge.fury.io/jas/koa-some)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Weird `some` middleware

**NOTE:** Implements shallow copying of koa `ctx.response` which is not supported out of the koa box and done 'as is'. Acceptable only for simple scenarios.

## Install

```js
npm install koa-some
```

## Use

### some([a, b, c, ...])

Returns new middleware which select first one of passed.
