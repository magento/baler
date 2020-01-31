/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

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
