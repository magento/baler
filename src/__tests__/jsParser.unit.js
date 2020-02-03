/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { parse, parseObjectExpression } = require('../jsParser');

test('parse works with basic code', () => {
    const code = 'var a = 1;';
    const ast = parse(code);
    expect(ast.type).toBe('Program');
});

test('parse fails on invalid JS code when loose is not enabled (default)', () => {
    const code = 'var a 1';
    expect(() => parse(code)).toThrow();
});

test('parse succeeds on valid JS code when loose is enabled', () => {
    const code = 'var a 1';
    const ast = parse(code, { loose: true });
    expect(ast.body[0].type).toBe('VariableDeclaration');
});

test('parseObjectExpression parses a valid object expression', () => {
    const code = '{ a: 1, b: 2 }';
    const ast = parseObjectExpression(code);
    expect(ast.type).toBe('ObjectExpression');
});

test('parseObjectExpression parses an invalid object expression', () => {
    // missing comma
    const code = '{ a: 1 b: 2 }';
    const ast = parseObjectExpression(code);
    expect(ast.type).toBe('ObjectExpression');
    expect(ast.properties[0].key.name).toBe('a');
    expect(ast.properties[1].key.name).toBe('b');
});
