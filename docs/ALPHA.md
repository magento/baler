# Getting started with the alpha

While `baler` is still heavily under development, the setup process is not quite as simple as it's intended to be. This document will continue to be updated to describe the whole process of setup, from start to finish.

Please make sure to follow all steps in the order they're documented below.

## Verify PHP is installed

`baler` needs to run PHP and load classes from Magento, so make sure PHP is setup correctly for use with Magento. See the [Magento documentation](https://devdocs.magento.com/guides/v2.3/install-gde/system-requirements-tech.html#php) for more details.

Verify you either have `php` available in your `$PATH`, or set the `$BALER_PHP_PATH` environment variable to point to the binary.

## Get node.js

You will need a version of `node.js` that is >= `10.12.0`. You can check if this is already available from the command line via `node -v`.

An installation of `node.js` includes `npm`, which will be needed for the next steps.

## Clone the repository and install dependencies

`git clone` the repository locally. Then, `cd` into the root directory and run `npm install`.

## Verify unit tests pass

As a sanity check, run `npm test` to verify that baler's unit tests are passing

## Build from source

Run `npm run build` in the root of the `baler` directory to compile from source

## Install `baler` globally

Run `npm link` in the `baler` directory, which will add the `baler` binary to your \$PATH

## Install and configure the `Magento_Baler` module

-   [`Magento_Baler` repository](https://github.com/magento/m2-baler)

After the module is installed, run `bin/magento config:set dev/js/enable_baler_js_bundling 1` to enable loading of `baler` assets.

## Disable incompatible features in Magento

Run the following commands to disable incompatible features in your store:

```
bin/magento config:set dev/js/minify_files 0
bin/magento config:set dev/js/enable_js_bundling 0
bin/magento config:set dev/js/merge_files 0
```

## Fix some things in Magento core

You can see the details in [the open issue](https://github.com/DrewML/baler/issues/6). If you just want to apply the fixes, see [the patch in core](https://github.com/magento/magento2/commit/db43c11c6830465b764ede32abb7262258e5f574)

## Refresh `pub/static` contents

`rm -rf` the `pub/static` directory of your store, and then run `bin/magento setup:static-content:deploy` to ensure all files are deployed with incompatible features disabled.

## Run `baler`

In the root directory of your Magento 2 store, run `baler` to optimizize all deployed front-end themes.

## Clear Cache

To make sure that `Magento_Baler` gets a chance to participate in rendering, run `bin/magento cache:clean` so new page caches can be generated

## Visit your store

If all steps were followed in order, and you did not find any bugs, most pages in your storefront should now be faster than they were before.

If you found a bug, please [open a new issue](https://github.com/DrewML/baler/issues/new)
