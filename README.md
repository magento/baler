# baler

`baler` is an [AMD module](https://requirejs.org/) bundler and preloader for [Magento 2](https://u.magento.com/magento-2) stores.

## Goals

-   Improve client-side performance of all Magento 2 stores
-   Require little to no configuration for a typical Magento 2 store
-   Work against as many _frontend_ themes are possible
-   Be (and stay) fast

## How Does It Work?

`baler` has two different strategies for optimizing JavaScript delivery.

### Core Bundle

The "core" bundle contains the code that `baler` can determine is critical to the first render of the page. This includes the Magento core libraries, along with some theme-specific and feature-specific code.

### Graph Preloading

The JavaScript included in the "core" bundle only includes dependencies that can be statically-analyzed from a theme's `requirejs-config.js`. However, many parts of the Magento front-end are controlled by widgets that are specified using a declarative notation in `.phtml` files.

This is where Graph Preloading comes in. When `baler` is run, it crawls the file system and determines which `.phtml` are eligible to be used in a specific area (`frontend`/`adminhtml`/`base`). These templates are then analyzed for any AMD module dependencies.

When a graph of dependencies has been collected for each `.phtml` file, the lists are flattened and deduped against the "core" bundle. Then, when a shopper requests a page of your store, [`preload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content) tags are injected that instruct the browser to immediately begin fetching necessary dependencies.

## Why Does Magento Need a Custom Bundler?

This [has been discussed elsewhere](https://gist.github.com/DrewML/6a9712942e995bf236b0d242ec0d9c9c), but this repository will eventually be the home of that documentation.

## TODO

-   Document Usage
