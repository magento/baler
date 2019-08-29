# baler

[![CircleCI](https://circleci.com/gh/DrewML/baler.svg?style=svg)](https://circleci.com/gh/DrewML/baler)

`baler` is an [AMD module](https://requirejs.org/) bundler and preloader for [Magento 2](https://u.magento.com/magento-2) stores.

## Goals

-   Improve client-side performance of all Magento 2 stores
-   Require little to no configuration for a typical Magento 2 store
-   Work against as many _frontend_ themes are possible
-   Be (and stay) fast

## Docs

-   [How Does it Work?](docs/HOW_IT_WORKS.md)
-   [Why a Custom Bundler?](docs/WHY_CUSTOM.md)
-   [State of the Project](docs/STATE_OF_PROJECT.md)

## Getting Started (Early Alpha)

As this project is still under heavy development, releases are not being published to `npm` yet. You must follow the `Development Setup` steps outlined in this document

## Development Setup

### Requirements

-   `node.js` version >= `10.12.0`
-   `npm` version >= `6.4.1`

### First-Time Setup

1. Clone the repository
2. Run `npm install` in the root of the repository to install necessary dependencies
3. Run `npm test` to verify all unit tests pass, which will help confirm a proper local setup
4. Run `npm run build` to run the TypeScript compiler and generate a usable copy of `baler`
5. Run `npm link` in the root of the repository. This will instruct `npm` to create a symlink that makes the `baler` binary available in your `$PATH`
6. Verify you either have `php` available in your `$PATH`, or set the `$BALER_PHP_PATH` environment variable to point to the binary

### Usage

1. In a terminal, in either the root or a subdirectory of a Magento 2 installation, run `baler`. No configuration is needed

### Debugging

#### node.js debugger

1. Run `node --inspect-brk $(which baler)`
2. In Chrome, visit `chrome://inspect`
3. Click `Inspect` on the pending connection

#### Verbose Logging

1. Run `baler` with `BALER_LOG_LEVEL=debug`
