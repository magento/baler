# Invalid Shim Warning(s)

## What are shims?

The [`shim`](https://requirejs.org/docs/api.html#config-shim) feature of [`RequireJS`](https://requirejs.org) is a way to declare the external dependencies for a 3rd party library that is _not_ authored as an AMD module.

As an example, consider you have the library `jquery-foo.js`, which has the following code:

```js
(function($) {
    // Implicit dependency on underscore being available globally
    $.fn.trim = _.trim;
})(jQuery);
```

For this code to work correctly, the `underscore` module has to:

1. Fully complete its loading/execution before `jquery-foo.js`
2. Expose its export (`_`) on the global object (`window` or `globalThis`)

To address this as an application developer, _without_ modifying `jquery-foo.js`, you need a way to express that it is dependent on `underscore`. This is exactly what shim config enables.

An example shim config for `jquery-foo.js` would be:

```js
{
  "shim": {
    'jquery-foo': {
      deps: ['underscore']
    }
  }
}
```

## Why am I seeing warnings?

You are seeing warnings because `baler` is able to detect _some_ invalid shim configurations, and encourages you to fix them. Although these _can_ work when loading the application without bundling, it is not possible for `baler` to ensure your application will work when invalid shims are detected.

An example warning from `baler`:

```sh
One or more invalid shim configurations were found while bundling Magento/luma. See https://github.com/DrewML/baler/blob/master/docs/INVALID_SHIM.md
   - mage/common
   - moment
   - jquery/jquery-storageapi
```

These shim configuration are invalid for the following reasons

### mage/common

`mage/common` has a shim config for `jQuery`, but `mage/common` is already an AMD module. Because `mage/common` has a direct dependency on `jQuery`, this shim does nothing

### moment

`moment` has a shim config specifying its exported member is `moment`. However, `moment` is already an AMD module, so this shim does nothing

### jquery/jquery-storageapi

`jquery/jquery-storageapi` has a shim configuration for `jquery.cookie`. However, `jquery/jquery-storageapi` is already an AMD module with its own list of dependencies. Because of this, `jquery.cookie` does not get loaded before `jquery/jquery-storageapi`, which breaks Magento 2 stores.
