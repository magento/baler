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

## Unfinished Work/TODO

1. Copy bundles to each locale within a deployed theme in `pub/static`
2. Minify bundles + separate JS source files
3. Generate preload manifest for backend
4. Write `Magento_Baler` module for loading core bundle + injecting preload tags
