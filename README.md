# AuthApex Core

A core authentification library for AuthApex platform.

[![][npm-version]][npm-url] [![][gitlab-last-release]][npm-url] [![][npm-downloads]][npm-url]

## Libraries used
* axios
* nestjs
* express
* date-fns
* nanoid

[npm-version]: https://badgen.net/npm/v/@authapex/core?label=version&color=green
[npm-downloads]: https://badgen.net/npm/dt/@authapex/core
[npm-url]: https://www.npmjs.com/package/@authapex/core
[gitlab-last-release]: https://badgen.net/github/release/stanek-r/@authapex/core/babel

## How to use

The library requires the following environment variables:

```
APP_NAME=sample-app
APP_URL=http://127.0.0.1:5173

JWT_SECRET=123456789
JWT_EXPIRES_IN=7d
```

Optionally, you can set the following environment variables:

```
DEVELOPMENT=true

AUTH_URL=https://id.authapex.net
AUTH_API_KEY=123456789
```