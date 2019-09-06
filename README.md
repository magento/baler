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

**Note**: You must already have `baler` installed. See [`Development Setup`](#Development-Setup)

| Command                                                    | Result                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `baler`                                                    | Optimize all deployed themes                                        |
| `baler build`                                              | Optimize all deployed themes                                        |
| `baler build --theme Magento/luma`                         | Optimize a single deployed theme                                    |
| `baler build --theme Magento/luma --theme MyVendor/custom` | Optimize multiple deployed themes                                   |
| `baler graph Magento/luma`                                 | Generate a dotviz graph of all AMD dependencies in a deployed theme |

## Debugging

#### node.js debugger

1. Run `node --inspect-brk $(which baler)`
2. In Chrome, visit `chrome://inspect`
3. Click `Inspect` on the pending connection

#### Tracing

Run the CLI with the `--trace` flag. An event log will be written to `baler-trace-{timestamp}.json`
