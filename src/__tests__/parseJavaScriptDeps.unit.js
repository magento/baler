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
