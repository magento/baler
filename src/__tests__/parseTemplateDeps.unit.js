/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

const { parseTemplateDeps } = require('../parseTemplateDeps');

test('script in phtml with inline php values', () => {
    const input = `
        <?php /** @var \Dotdigitalgroup\Email\Block\Adminhtml\Dashboard $block */?>
        <div class="content-header">
            <?= $block->getChildHtml('adminhtml.system.config.switcher');?>
        </div>
        <script type="text/x-magento-init">
            {
                "*": {
                    "Dotdigitalgroup_Email/js/dashboard":{
                        "contactLink":"<?= $block->escapeUrl($block->getContactSyncLink()); ?>",
                        "importerLink":"<?= $block->escapeUrl($block->getImporterLink()); ?>"
                    }
                }
            }
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['Dotdigitalgroup_Email/js/dashboard']);
    expect(incompleteAnalysis).toBe(false);
});

test('data-mage-init in .phtml file', () => {
    const input = `
        <?php /** @var \Amazon\Payment\Block\ProductPagePaymentLink $block */ ?>
        <div class="amazon-button-container centered-button">
            <div class="amazon-button-container__cell">
                <div id="PayWithAmazon-<?= /* @noEscape */ $block->getJsId() ?>"
                    class="login-with-amazon"
                    data-mage-init='{"amazonButton": {"buttonType": "PwA"}}'>
                </div>
            </div>
        </div>;
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['amazonButton']);
    expect(incompleteAnalysis).toBe(false);
});

test('data-bind mageInit in .phtml file', () => {
    const input = `
        <div class="field-tooltip-content" data-target="dropdown" aria-hidden="true">
            <span class="field-tooltip-action action-help"
                data-bind="mageInit: {'dropdown':{'activeClass': '_active'}}"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false">
            </span>
        </div>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['dropdown']);
    expect(incompleteAnalysis).toBe(false);
});

test('data-bind mageInit with multiple values in single attribute', () => {
    const input = `
        <div id="opc-sidebar" data-bind="afterRender:setModalElement, mageInit: {
            'Magento_Ui/js/modal/modal':{
                'type': 'custom',
                'modalClass': 'opc-sidebar opc-summary-wrapper'
            }
        }">
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['Magento_Ui/js/modal/modal']);
    expect(incompleteAnalysis).toBe(false);
});

test('Malformed data-bind attr with mageInit still works', () => {
    const input = `
        <!-- purposely missing a comma in data-bind -->
        <div id="opc-sidebar" data-bind="afterRender:setModalElement mageInit: {
            'Magento_Ui/js/modal/modal':{
                'type': 'custom',
                'modalClass': 'opc-sidebar opc-summary-wrapper'
            }
        }">
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['Magento_Ui/js/modal/modal']);
    expect(incompleteAnalysis).toBe(false);
});

test('Malformed open/close delimiters are fixed for attributes due to <?= ?> contents', () => {
    const input = `
        <div class="field captcha no-label"
            data-captcha="<?= $block->escapeHtmlAttr($block->getFormId()) ?>"
            id="captcha-container-<?= $block->escapeHtmlAttr($block->getFormId()) ?>"
            data-mage-init='{"captcha":{"url": "<?= $block->escapeUrl($block->getRefreshUrl()) ?>",
                                    "imageLoader": "<?= $block->escapeUrl($block->getViewFileUrl('images/loader-2.gif')) ?>",
                                        "type": "<?= $block->escapeHtmlAttr($block->getFormId()) ?>"}}'>
        </div>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['captcha']);
    expect(incompleteAnalysis).toBe(false);
});

test('Works when value of keys in data-bind mageInit are function calls', () => {
    const input = `
        <form class="form" id="co-transparent-form" action="#" method="post" data-bind="mageInit: {
            'transparent':{
                'context': context(),
                'controller': getControllerName(),
                'gateway': getCode(),
                'orderSaveUrl':getPlaceOrderUrl(),
                'cgiUrl': getCgiUrl(),
                'dateDelim': getDateDelim(),
                'cardFieldsMap': getCardFieldsMap(),
                'nativeAction': getSaveOrderUrl()
            }, 'validation':[]}">
            <!-- ko template: 'Magento_Payment/payment/cc-form' --><!-- /ko -->
        </form>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['transparent', 'validation']);
    expect(incompleteAnalysis).toBe(false);
});

test('data-bind mageInit dependency keys can be unquoted strings', () => {
    const input = `
        <span class="cart-tax-total" data-bind="mageInit: {taxToggle: {itemTaxId : '#subtotal-item-tax-details'+$parents[2].item_id}}">
            <span class="price" data-bind="text: getFormattedPrice(getRowDisplayPriceInclTax($parents[2]))"></span>
        </span>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['taxToggle']);
    expect(incompleteAnalysis).toBe(false);
});

test('Script in .phtml with php delimiters/expressions in the selector field', () => {
    const input = `
        <script type="text/x-magento-init">
            {
                "#payment_form_<?= $block->escapeJs($block->escapeHtml($block->getMethodCode())) ?>": {
                    "Magento_AuthorizenetAcceptjs/js/payment-form": {
                        "config": <?= /* @noEscape */ $block->getPaymentConfig() ?>
                    }
                }
            }
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['Magento_AuthorizenetAcceptjs/js/payment-form']);
    expect(incompleteAnalysis).toBe(false);
});

test('Works when data-mage-init is not valid JSON', () => {
    const input = `
        <div id="<?= $block->getHtmlId() ?>" class="uploader"
            data-mage-init='{
                "Magento_Backend/js/media-uploader" : {
                    "maxFileSize": <?= /* @escapeNotVerified */ $block->getFileSizeService()->getMaxFileSize() ?>,
                    "maxWidth": <?= /* @escapeNotVerified */ $block->getImageUploadMaxWidth() ?>,
                    "maxHeight": <?= /* @escapeNotVerified */ $block->getImageUploadMaxHeight() ?>,
                    "isResizeEnabled": <?= /* @noEscape */ $block->getImageUploadConfigData()->getIsResizeEnabled() ?>
                }
            }'
        >
        </div>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['Magento_Backend/js/media-uploader']);
    expect(incompleteAnalysis).toBe(false);
});

test('Reports deps and incomplete when both are present in one input', () => {
    const input = `
        <div class="search-global" data-mage-init='{"globalSearch": {}}'>
            <form action="#" id="form-search">
                <div class="search-global-field">
                    <label class="search-global-label" for="search-global"></label>
                    <input
                            type="text"
                            class="search-global-input"
                            id="search-global"
                            name="query"
                            data-mage-init='<?= /* @noEscape */ $this->helper('Magento\Framework\Json\Helper\Data')->jsonEncode($block->getWidgetInitOptions()) ?>'>
                    <button
                        type="submit"
                        class="search-global-action"
                        title="<?= /* @escapeNotVerified */ __('Search') ?>"
                        ></button>
                </div>
            </form>
        </div>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['globalSearch']);
    expect(incompleteAnalysis).toBe(true);
});

test('Multiple PHP delimiters in a mage-init on a single line', () => {
    const input = `
        <div class="block <?= /* @escapeNotVerified */ $class ?>" data-mage-init='{"relatedProducts":{"relatedCheckbox":".related.checkbox"}}' data-limit="<?= /* @escapeNotVerified */ $limit ?>" data-shuffle="<?= /* @escapeNotVerified */ $shuffle ?>">
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['relatedProducts']);
    expect(incompleteAnalysis).toBe(false);
});

test('Can handle PHP delimiter(s) starting with <?php', () => {
    const input = `
        <script type="text/x-magento-init">
            {
                "#product_addtocart_form": {
                    "configurable": {
                        "spConfig": <?= /* @escapeNotVerified */ $block->getJsonConfig() ?>,
                        "gallerySwitchStrategy": "<?php /* @escapeNotVerified */ echo $block->getVar('gallery_switch_strategy',
                            'Magento_ConfigurableProduct') ?: 'replace'; ?>"
                    }
                },
                "*" : {
                    "Magento_ConfigurableProduct/js/catalog-add-to-cart": {}
                }
            }
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual([
        'configurable',
        'Magento_ConfigurableProduct/js/catalog-add-to-cart',
    ]);
    expect(incompleteAnalysis).toBe(false);
});

test('Synchronous require inside define wrapper in script tag', () => {
    const input = `
        <script>
            define([], function() {
                var uiRegistry = require('uiRegistry');
                return uiRegistry;
            });
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['uiRegistry']);
    expect(incompleteAnalysis).toBe(false);
});

test('async require in script tag', () => {
    const input = `
        <script>
            require(['uiRegistry'], function(uiRegistry) {});
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['uiRegistry']);
    expect(incompleteAnalysis).toBe(false);
});

test('Finds statically analyzable require deps when PHP interpolations create invalid JS', () => {
    const input = `
        <script>
            require(['jquery', 'domReady!'], function($){
                    switch (massAction) {
                        <?php if ($block->getUseSelectAll()):?>
                        case 'selectAll':
                            return <?= /* @escapeNotVerified */ $block->getJsObjectName() ?>.selectAll();
                            break;
                        case 'unselectAll':
                            return <?= /* @escapeNotVerified */ $block->getJsObjectName() ?>.unselectAll();
                            break;
                        <?php endif; ?>
                        case 'selectVisible':
                            return <?= /* @escapeNotVerified */ $block->getJsObjectName() ?>.selectVisible();
                            break;
                        case 'unselectVisible':
                            return <?= /* @escapeNotVerified */ $block->getJsObjectName() ?>.unselectVisible();
                            break;
                    }
                });
            });
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['jquery', 'domReady!']);
    expect(incompleteAnalysis).toBe(false);
});

test('Multiline php if statements and values php delimiters outside of strings', () => {
    const input = `
    <script type="text/x-magento-init">
        {
            "[data-gallery-role=gallery-placeholder]": {
                "mage/gallery/gallery": {
                    "mixins":["magnifier/magnify"],
                    "thumbmargin": 30,
                    "magnifierOpts": <?php /* @escapeNotVerified */ echo $block->getMagnifier(); ?>,
                    "data": <?php /* @escapeNotVerified */ echo $block->getGalleryImagesJson(); ?>,
                    "options": {
                        "nav": "<?php /* @escapeNotVerified */ echo $block->getVar("gallery/nav"); ?>",
                        <?php if (($block->getVar("gallery/loop"))): ?>
                            "loop": <?php /* @escapeNotVerified */ echo $block->getVar("gallery/loop"); ?>,
                        <?php endif; ?>
                        <?php if (($block->getVar("gallery/keyboard"))): ?>
                            "keyboard": <?php /* @escapeNotVerified */ echo $block->getVar("gallery/keyboard"); ?>,
                        <?php endif; ?>
                    },
                    "breakpoints": <?php /* @escapeNotVerified */ echo $block->getBreakpoints(); ?>
                }
            }
        }
    </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['mage/gallery/gallery']);
    expect(incompleteAnalysis).toBe(false);
});

// Not even bothering for now - Magento's uiComponents are going
// to be painful to support, but we'll have to do it at some point
test.skip('Can extract uiComponent components', () => {
    const input = `
        <script type="text/x-magento-init">
            {
                "*": {
                    "Magento_Ui/js/core/app": {
                        "components": {
                                "messages": {
                                    "component": "Magento_Theme/js/view/messages"
                                }
                            }
                        }
                    }
            }
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toBe([
        'Magento_Ui/js/core/app',
        'Magento_Theme/js/view/messages',
    ]);
    expect(incompleteAnalysis).toBe(false);
});

test('Handles multi-line php if statement in x-magento-init', () => {
    const input = `
        <script type="text/x-magento-init">
            {
                ".product-add-form": {
                    "slide": {
                        "slideSpeed": 1500,
                        "slideSelector": "#bundle-slide",
                        "slideBackSelector": ".action.customization.back",
                        "bundleProductSelector": "#bundleProduct",
                        "bundleOptionsContainer": ".product-add-form"
                        <?php if ($block->isStartCustomization()): ?>
                        ,"autostart": true
                        <?php endif;?>
                    }
                }
            }
        </script>
    `;

    const { deps, incompleteAnalysis } = parseTemplateDeps(input);
    expect(deps).toEqual(['slide']);
    expect(incompleteAnalysis).toBe(false);
});
