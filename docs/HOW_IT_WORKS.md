# How Does it Work?

`baler` has two different strategies for optimizing JavaScript delivery

## Core Bundle

The "core" bundle contains the code that `baler` can determine is critical to the first render of the page. This includes the Magento core libraries, along with some theme-specific and feature-specific code.

## Graph Preloading

The JavaScript included in the "core" bundle only includes dependencies that can be statically-analyzed from a theme's `requirejs-config.js`. However, many parts of the Magento front-end are controlled by widgets that are specified using a declarative notation in `.phtml` files.

This is where Graph Preloading comes in. When `baler` is run, it crawls the file system and determines which `.phtml` are eligible to be used in a specific area (`frontend`/`adminhtml`/`base`). These templates are then analyzed for any AMD module dependencies.

When a graph of dependencies has been collected for each `.phtml` file, the lists are flattened and deduped against the "core" bundle. Then, when a shopper requests a page of your store, [`preload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content) tags are injected that instruct the browser to immediately begin fetching necessary dependencies.
