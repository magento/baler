const {
    parseThemeIDFromRegistration,
} = require('../parseThemeIDFromRegistration');

test('With use statement', () => {
    const config = `
        <?php
        use \Magento\Framework\Component\ComponentRegistrar;

        ComponentRegistrar::register(ComponentRegistrar::THEME, 'frontend/Magento/foo', __DIR__);

    `;

    expect(parseThemeIDFromRegistration(config)).toEqual({
        themeID: 'Magento/foo',
        area: 'frontend',
    });
});

test('Fully qualified namespaces', () => {
    const config = `
        <?php

        \Magento\Framework\Component\ComponentRegistrar::register(
            \Magento\Framework\Component\ComponentRegistrar::THEME,
            'frontend/Magento/bar',
            __DIR__
        );
    `;

    expect(parseThemeIDFromRegistration(config)).toEqual({
        themeID: 'Magento/bar',
        area: 'frontend',
    });
});
