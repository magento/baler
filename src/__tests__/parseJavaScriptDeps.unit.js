const { parseJavaScriptDeps } = require('../parseJavaScriptDeps');

test('Parses top-level "define" deps in anonymous AMD module', () => {
    const input = `
        define([
            'jquery',
            'mage/apply/main'
        ], function ($, mage) {});
    `;

    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual(['jquery', 'mage/apply/main']);
    expect(incompleteAnalysis).toBe(false);
});

test('Parses top-level "define" deps in named AMD module', () => {
    const input = `
        define('foo', [
            'jquery',
            'mage/apply/main'
        ], function ($, mage) {});
    `;

    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual(['jquery', 'mage/apply/main']);
    expect(incompleteAnalysis).toBe(false);
});

test('Does not blow up when encountering a named module without a deps []', () => {
    const input = `define('foo', function(foo) {})`;
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual([]);
    expect(incompleteAnalysis).toBe(false);
});

test('Does not blow up when encountering an anonymous module without a deps []', () => {
    const input = `define(function(foo) {})`;
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual([]);
    expect(incompleteAnalysis).toBe(false);
});

test('Parses synchronous require', () => {
    const input = 'require("foo")';
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual(['foo']);
    expect(incompleteAnalysis).toBe(false);
});

test('Parses async require with callback', () => {
    const input = 'require(["foo"], function(foo) {})';
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual(['foo']);
    expect(incompleteAnalysis).toBe(false);
});

test('Parses async require without callback', () => {
    const input = 'require(["foo"])';
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual(['foo']);
    expect(incompleteAnalysis).toBe(false);
});

test('Reports incomplete analysis when a dep in require is not a string literal', () => {
    const input = 'require([foo], function(val) {})';
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(incompleteAnalysis).toBe(true);
    expect(deps).toHaveLength(0);
});

test('Incomplete analysis of require with some analyzable deps', () => {
    const input = 'require([foo, "bar"], function(val, bar) {})';
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(incompleteAnalysis).toBe(true);
    expect(deps).toEqual(['bar']);
});

test('Reports incomplete analsys when a dep in define is not a string literal', () => {
    const input = 'define([foo], function(val) {})';
    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(incompleteAnalysis).toBe(true);
    expect(deps).toHaveLength(0);
});

test('Can handle the UMD dance from knockout-es5.js in core', () => {
    const input = `
        function prepareExports() {
            if (typeof exports === 'object' && typeof module === 'object') {
            // Node.js case - load KO and WeakMap modules synchronously
            ko = require('knockout');
            var WM = require('../lib/weakmap');
            attachToKo(ko);
            weakMapFactory = function() { return new WM(); };
            module.exports = ko;
            } else if (typeof define === 'function' && define.amd) {
            define(['knockout'], function(koModule) {
                ko = koModule;
                attachToKo(koModule);
                weakMapFactory = function() { return new global.WeakMap(); };
                return koModule;
            });
            } else if ('ko' in global) {
            // Non-module case - attach to the global instance, and assume a global WeakMap constructor
            ko = global.ko;
            attachToKo(global.ko);
            weakMapFactory = function() { return new global.WeakMap(); };
            }
        }
    `;

    const { deps, incompleteAnalysis } = parseJavaScriptDeps(input);
    expect(deps).toEqual(['knockout']);
    expect(incompleteAnalysis).toBe(false);
});
