# JavaScript Bundling in Magento

Bundling your JavaScript has been considered a best-practice on the web for a _long_ time, and although some strategies have changed, the general idea has not.

The goal of this document is to explain the technical limitations of the [current bundling implementation in Magento](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/themes/js-bundling.html), and justify the creation of a new tool.

# Table of Contents

-   [Summary](#summary)
    -   [Built-in Bundling](#built-in-bundling)
    -   [Unbundled](#unbundled)
-   [Common Magento Bundling Questions](#common-magento-bundling-questions)
    -   [What are the problems with the built-in bundling feature?](#what-are-the-problems-with-the-built-in-bundling-feature)
    -   [Doesn't the "Bundle Size" option help?](#doesnt-the-bundle-size-option-help)
    -   [What about the "Advanced JS Bundling" docs? Why not instruct people to use those?](#what-about-the-advanced-js-bundling-docs-why-not-instruct-people-to-use-those)
    -   [Why not just load JS unbundled?](#why-not-just-load-js-unbundled)
    -   [Why not use webpack/Parcel/{favorite bundler here}](#why-not-use-webpack-parcel--favorite-bundler-here)
    -   [Why not deprecate all the features that make bundling with webpack/Parcel/etc difficult?](#why-not-use-webpackparcelfavorite-bundler-here)
    -   [How are folks working around this today?](#how-are-folks-working-around-this-today)
    -   [What are you going to do to address this?](#what-are-you-going-to-do-to-address-this)
        -   [Scraper](#scraper)
        -   [Static Analysis](#static-analysis)

## Summary

### Built-in Bundling

-   Lowers total # of HTTP requests (good)
-   Increases total bytes downloaded/parsed/executed (bad)
-   Blocking in head, pushes out time to first paint (bad)

### Unbundled

-   Ships less bytes than build-in bundling (good)
-   Doesn't delay first paint (good)
-   Poor network utilization due to waterfall loading (bad)

## Common Magento Bundling Questions

### What are the problems with the built-in bundling feature?

-   The bundling mechanism does not operate against a dependency graph. Instead, it's rather naive and just concatenates all JavaScript together. That means, even if an AMD module is not imported anywhere, it still ends up in the bundle. We're not utilizing the value that a module system provides (explicitly declared dependencies).
-   The bundling mechanism does not split code into per-page or per-feature chunks, so a user on the home page ends up having to download all the JavaScript for the checkout page.
-   The bundling mechanism shoves every AMD module into a string inside of a bundle file, and then runs it through `eval` later (by way of `new Function()()`). This disables optimizations (specifically streaming parsing) in modern browsers
    -   This also prevents users from using a Content Security Policy without having to enable `unsafe-eval`

### Doesn't the "Bundle Size" option help?

This option really isn't useful, since modules are not sorted in any way.

As en example, imagine that you have 1mb of JS, in 10 chunks of 100kb each (yes, I know, 1024, just go with it).

-   Chunk 1 (loaded first) has an entry point, `Module A`, which depends on `Module Z`
-   Chunk 10 (loaded last) has `Module Z`

In this example, the majority of JavaScript won't start executing until the final chunk is downloaded + executed, because `Module A` can't run until its dependency on `Module Z` has been satisfied.

### What about the "Advanced JS Bundling" docs? Why not instruct people to use those?

[Advanced JS Bundling Documentation](https://devdocs.magento.com/guides/v2.3/performance-best-practices/advanced-js-bundling.html)

-   The process is extremely tedious and error-prone, and most people I've seen try to use it end up giving up
-   The docs won't work for Windows users (could be fixed, but not worth the time)

### Why not just load JS unbundled?

Loading AMD modules unbundled (how it works in development) is far from an optimal delivery mechanism for production, and creates a situation where you end up with waterfall/cascading downloads.

As an example, imagine a website with a JavaScript entry point of `bootstrap.js`, which has 3 dependencies.

```js
// bootstrap.js
define(['foo', 'bizz', 'bar'], function(foo, bizz, bar) {
    // use foo, bizz, bar
});
```

The browser cannot know to start downloading `foo.js`, `bizz.js`, and `bar.js` until `bootstrap.js` is already downloaded and executed. Now imagine that the implementation of `foo.js` is the following:

```js
// foo.js
define(['cat', 'dog', 'horse'], function(cat, dog, horse) {
    // use cat, dog, horse
});
```

The problem is now worse. The browser has to take the following steps now:

1. Download/parse/execute `bootstrap.js`
2. Start download of `foo.js`, `bizz.js`, and `bar.js`
3. When `foo.js` is done, parse/execute it, and start fetching its dependencies
4. When `cat.js`, `dog.js`, and `horse.js` are downloaded/parsed/executed, start fetching their respective dependencies

Over a large dependency graph, it should be clear how time consuming this can be. This makes the site load slower, but it also wastes time when the network is mostly idle and could be further utilized.

**Example of Magento 2 Home Page, unbundled**
![example waterfall](https://i.imgur.com/7jNtDUe.png)

There are 2 benefits of unbundled code, though:

1. Loads significantly less code than Magento's built-in bundling mechanism
2. Non-blocking (unlike Magento's built-in bundling mechanism), so it doesn't delay the first paint

The other problem with not bundling is compression. `gzip` and `brotli` both work better the more repetitive text they're fed. Because the gzip/brotli dictionaries are not shared across assets, you'll end up shipping more bytes when you ship code per-file.

### Why not use webpack/Parcel/{favorite bundler here}

Modern bundlers rely heavily on static analysis, and will not work as expected when dependencies are fully dynamic. Unfortunately Magento has a list of features that prevent analyzing a good chunk of the graph:

-   `mage-init` ([docs](https://devdocs.magento.com/guides/v2.3/javascript-dev-guide/javascript/js_init.html))
-   `uiComponents` template handling ([docs](https://devdocs.magento.com/guides/v2.3/ui_comp_guide/bk-ui_comps.html))
-   Inline `require/define` in HTML (by way of `.phtml` files or other mechanisms) ([example](https://github.com/magento/magento2/blob/6478d2b09297859c4a082d71a78186d7b6600177/app/code/Magento/Customer/view/frontend/templates/form/register.phtml#L176-L179))

Because the values passed to `require/define` dynamically could change without a deployment, it's critical that a bundling solution for Magento supports some form of "fallback," where a module can be fetched from the network _only if it's missing from a bundle_. With the modern bundlers I'm familiar with, a build or runtime error would occur.

### Why not deprecate all the features that make bundling with webpack/Parcel/etc difficult?

One of the biggest selling points for Magento is the massive ecosystem of extensions. Almost any extension that has front-end assets uses at least one of these mechanisms. A deprecation would require a massive re-write effort for folks, and that's not a good use of time while Magento is already investing in the future, decoupled front-end separately (PWA project, which uses ECMAScript modules + webpack). Finding a good solution that works for 95% of people, imo, is better than finding a great solution that works for 5% of people.

### How are folks working around this today?

Various options exist.

1. Hand-rolling configuration for the [RequireJS optimizer](https://requirejs.org/docs/optimization.html) (similar to Advanced Bundling docs)
2. Using [`WeareJH/config-gen`](https://github.com/WeareJH/config-gen) to generate a config for the RequireJS optimizer
3. Using [`magento/m2-devtools`](https://github.com/magento/m2-devtools) to generate a config for the RequireJS optimizer
4. Using [`magesuite/magepack`](https://github.com/magesuite/magepack) to generate a config for the RequireJS optimizer
