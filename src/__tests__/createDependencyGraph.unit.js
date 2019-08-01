const { createDependencyGraph } = require('../createDependencyGraph');

test('Can create new graph without error', () => {
    expect(createDependencyGraph).not.toThrow();
});

test('PHTML Dependency can be added to graph', () => {
    const graph = createDependencyGraph().addPHTMLDependency({
        path: 'vendor/magento/module-foo/file.phtml',
        deps: ['foo', 'bar'],
    });
    expect(graph.toDOTGraph()).toMatchInlineSnapshot(`
        "digraph {
          \\"vendor/magento/module-foo/file.phtml\\" -> \\"foo\\"
          \\"vendor/magento/module-foo/file.phtml\\" -> \\"bar\\"
          \\"vendor/magento/module-foo/file.phtml\\" [shape=square, style=filled, fillcolor=orange]
        }"
    `);
});

test('AMD Dependency can be added to graph', () => {
    const graph = createDependencyGraph().addAMDDependency({
        requireID: 'Magento_Foo/js/bar',
        deps: ['bizz', 'buzz'],
    });
    expect(graph.toDOTGraph()).toMatchInlineSnapshot(`
        "digraph {
          \\"Magento_Foo/js/bar\\" -> \\"bizz\\"
          \\"Magento_Foo/js/bar\\" -> \\"buzz\\"
        }"
    `);
});

test('Kitchen sink', () => {
    const foo = {
        path: 'vendor/magento/module-bar/foo.phtml',
        deps: ['jquery'],
    };
    const bootstrap = {
        deps: [
            'jquery',
            'mage/apply/main',
            'Magento_Ui/js/lib/knockout/bootstrap',
        ],
        requireID: 'mage/bootstrap',
        isEntry: true,
    };
    const main = {
        deps: ['underscore', 'jquery'],
        requireID: 'mage/apply/main',
    };
    const jquery = {
        deps: [],
        requireID: 'jquery',
    };

    const graph = createDependencyGraph()
        .addAMDDependency(bootstrap)
        .addAMDDependency(jquery)
        .addAMDDependency(main)
        .addPHTMLDependency(foo);

    expect(graph.toDOTGraph()).toMatchInlineSnapshot(`
        "digraph {
          \\"mage/bootstrap\\" -> \\"jquery\\"
          \\"mage/bootstrap\\" -> \\"mage/apply/main\\"
          \\"mage/bootstrap\\" -> \\"Magento_Ui/js/lib/knockout/bootstrap\\"
          \\"mage/apply/main\\" -> \\"underscore\\"
          \\"mage/apply/main\\" -> \\"jquery\\"
          \\"vendor/magento/module-bar/foo.phtml\\" -> \\"jquery\\"
          \\"mage/bootstrap\\" [shape=square, style=filled, fillcolor=orange]
          \\"vendor/magento/module-bar/foo.phtml\\" [shape=square, style=filled, fillcolor=orange]
        }"
    `);
});
