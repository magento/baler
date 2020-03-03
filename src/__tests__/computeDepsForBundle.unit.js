/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { computeDepsForBundle } = require('../computeDepsForBundle');

test('Graph with 1 entry point and no cycles', () => {
    const graph = {
        a: ['b'],
        b: ['c', 'd'],
        c: ['d'],
        d: [],
    };
    const entries = ['a'];
    expect(computeDepsForBundle(graph, entries)).toEqual(['a', 'b', 'c', 'd']);
});

test('Graph with 2 entry points and no cycles', () => {
    const graph = {
        a: ['b'],
        b: ['c'],
        c: ['d'],
        d: [],
        e: ['f'],
        f: ['g'],
    };
    const entries = ['a', 'e'];
    expect(computeDepsForBundle(graph, entries)).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
    ]);
});

test('Graph with 1 entry point and a cycle', () => {
    const graph = {
        a: ['b'],
        b: ['a'],
    };
    const entries = ['a'];
    expect(computeDepsForBundle(graph, entries)).toEqual(['a', 'b']);
});

test('Graph with 2 entry points and a cycle in first entry point', () => {
    const graph = {
        a: ['b'],
        b: ['a'],
        c: [],
    };
    const entries = ['a', 'c'];
    expect(computeDepsForBundle(graph, entries)).toEqual(['a', 'b', 'c']);
});

test('Excluded file js-translation.json not in computed dep list', () => {
    const graph = {
        a: ['b'],
        b: ['text!js-translation.json'],
    };
    const entries = ['a'];
    expect(computeDepsForBundle(graph, entries)).toEqual(['a', 'b']);
});
