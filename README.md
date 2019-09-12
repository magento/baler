# baler

[![CircleCI](https://circleci.com/gh/DrewML/baler.svg?style=svg)](https://circleci.com/gh/DrewML/baler)

`baler` is an [AMD module](https://requirejs.org/) bundler and preloader for [Magento 2](https://u.magento.com/magento-2) stores.

## Getting Started (Early Alpha)

If you're willing to test alpha software, [please proceed](docs/ALPHA.md)

## Docs

-   [How Does it Work?](docs/HOW_IT_WORKS.md)
-   [Why a Custom Bundler?](docs/WHY_CUSTOM.md)
-   [State of the Project](docs/STATE_OF_PROJECT.md)

## Usage

```sh
Usage
  $ baler <command> [options]

  Commands
    build --theme Vendor/name
    graph --theme Vendor/name

  Examples
    Optimize all eligible themes
    $ baler build

    Optimize multiple themes
    $ baler build --theme Magento/foo --theme Magento/bar

    Generate Dependency Graph
    $ baler graph --theme Magento/luma
```

## Debugging

#### node.js debugger

1. Run `node --inspect-brk $(which baler)`
2. In Chrome, visit `chrome://inspect`
3. Click `Inspect` on the pending connection

#### Tracing

Run the CLI with the `--trace` flag. An event log will be written to `baler-trace-{timestamp}.txt`
