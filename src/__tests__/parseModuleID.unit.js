const { parseModuleID } = require('../parseModuleID');

test('No plugin', () => {
    expect(parseModuleID('foo')).toEqual({ id: 'foo', plugin: '' });
});

test('text plugin', () => {
    expect(parseModuleID('text!foo')).toEqual({ id: 'foo', plugin: 'text' });
});

test('domReady plugin', () => {
    expect(parseModuleID('domReady!foo')).toEqual({
        id: 'foo',
        plugin: 'domReady',
    });
});

test('domReady as a module with no plugins', () => {
    expect(parseModuleID('domReady')).toEqual({ id: 'domReady', plugin: '' });
});

test('domReady plugin on domReady dep', () => {
    expect(parseModuleID('domReady!domReady')).toEqual({
        id: 'domReady',
        plugin: 'domReady',
    });
});
