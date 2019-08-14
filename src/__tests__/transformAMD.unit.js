/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const {
    wrapTextModule,
    wrapNonShimmedModule,
    wrapShimmedModule,
    renameModule,
} = require('../transformAMD');

test('wrapTextModule transforms HTML to module w/ escaping', () => {
    const result = wrapTextModule('bar', `<span>Hello World ''"</span>`);
    expect(result.toString()).toMatchInlineSnapshot(`
        "define('text!bar', function() {
            return '<span>Hello World \\\\'\\\\'\\"</span>';
        });"
    `);
});

test('wrapNonShimmedModule wraps module', () => {
    const result = wrapNonShimmedModule('bar', 'console.log("Hello World");');
    expect(result.toString()).toMatchInlineSnapshot(`
        "define('bar', function() {
            // baler-injected stub for non-AMD module (no shim config was found for this module)
        });
        // Original code for non-AMD module bar
        console.log(\\"Hello World\\");"
    `);
});

test('wrapShimmedModule injects non-AMD module into define body with deps', () => {
    const result = wrapShimmedModule('bar', 'log("hello world");', {
        bar: ['log'],
    });
    expect(result.toString()).toMatchInlineSnapshot(`
        "define('bar', [\\"log\\"], function() {
                // Shimmed by bundlegento
                (function() {
                    log(\\"hello world\\");;
                })();
                return window['undefined'];
            });"
    `);
});

test('renameModule renames anonymous AMD module with empty deps', () => {
    const result = renameModule('bar', 'define([], function() {});');
    expect(result.toString()).toMatchInlineSnapshot(
        `"define('bar', [], function() {});"`,
    );
});

test('renameModule renames anonymous AMD module with deps', () => {
    const result = renameModule('bar', `define(['foo'], function(foo) {});`);
    expect(result.toString()).toMatchInlineSnapshot(
        `"define('bar', ['foo'], function(foo) {});"`,
    );
});

test('renameModule renames anonymous AMD module with missing deps', () => {
    const result = renameModule('bar', `define(function() {});`);
    expect(result.toString()).toMatchInlineSnapshot(
        `"define('bar', function() {});"`,
    );
});

test('renameModule renames anonymous AMD module with space before invocation', () => {
    const result = renameModule('bar', `define  (function() {});`);
    expect(result.toString()).toMatchInlineSnapshot(
        `"define  ('bar', function() {});"`,
    );
});
