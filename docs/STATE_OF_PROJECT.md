# State of the Project

Although `baler` is actively being developed, it is not yet feature complete or considered to be production ready.

## Completed

1. Generation of `core-bundle.js` for all `frontend` area themes
2. Discovery of all statically-analyzable dependencies in `.phtml` files

## Incomplete

1. Graph Preloading (depends on [#3](https://github.com/DrewML/baler/issues/3) and [#1](https://github.com/DrewML/baler/issues/1))
2. Support for > 1 locale (depends on [#2](https://github.com/DrewML/baler/issues/2), but easy to work around by manually copying artifacts from first locale)
3. Minification (depends on [#4](https://github.com/DrewML/baler/issues/4), but trivial to work around)

## How to Load Bundles?

The module ([#1](https://github.com/DrewML/baler/issues/1)) that is needed to load bundles is currently in development. For the time being, you can load `core-bundle.js` by making layout modifications to replace `requirejs-config.js` with `requirejs-bundle-config.js`.
