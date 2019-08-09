const { generateDotGraph } = require('../generateDotGraph');

test('Works on simple graph', () => {
    const graph = {
        main: ['foo'],
        foo: ['bar'],
        bar: [],
    };
    expect(generateDotGraph(graph)).toMatchInlineSnapshot(`
        "digraph {
          \\"main\\" -> \\"foo\\"
          \\"foo\\" -> \\"bar\\"
        }"
    `);
});
