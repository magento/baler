const { parse } = require('../mage-init-parser');

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
    </script>`;

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['Dotdigitalgroup_Email/js/dashboard']);
    expect(warnings).toHaveLength(0);
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
    </div>;`;

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['amazonButton']);
    expect(warnings).toHaveLength(0);
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['dropdown']);
    expect(warnings).toHaveLength(0);
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['Magento_Ui/js/modal/modal']);
    expect(warnings).toHaveLength(0);
});

test('Malformed data-bind attr with mageInit reports a warning', () => {
    const input = `
        <!-- purposely missing a comma in data-bind -->
    <div id="opc-sidebar" data-bind="afterRender:setModalElement mageInit: {
        'Magento_Ui/js/modal/modal':{
            'type': 'custom',
            'modalClass': 'opc-sidebar opc-summary-wrapper'
        }
    }">
    `;

    const { deps, warnings } = parse(input);
    expect(deps).toHaveLength(0);
    expect(warnings).toHaveLength(1);
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['captcha']);
    expect(warnings).toHaveLength(0);
});

test('Works when value of keys in mageInit are function calls', () => {
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['transparent', 'validation']);
    expect(warnings).toHaveLength(0);
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['Magento_AuthorizenetAcceptjs/js/payment-form']);
    expect(warnings).toHaveLength(0);
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['Magento_Backend/js/media-uploader']);
    expect(warnings).toHaveLength(0);
});

test('Reports deps and warnings when both are present in one input', () => {
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['globalSearch']);
    expect(warnings).toHaveLength(1);
});

test('Multiple PHP delimiters in a mage-init on a single line', () => {
    const input = `
        <div class="block <?= /* @escapeNotVerified */ $class ?>" data-mage-init='{"relatedProducts":{"relatedCheckbox":".related.checkbox"}}' data-limit="<?= /* @escapeNotVerified */ $limit ?>" data-shuffle="<?= /* @escapeNotVerified */ $shuffle ?>">
    `;

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['relatedProducts']);
    expect(warnings).toHaveLength(0);
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual([
        'configurable',
        'Magento_ConfigurableProduct/js/catalog-add-to-cart',
    ]);
    expect(warnings).toHaveLength(0);
});

// TODO: See if we can get this working without breaking other things
test.skip('Handles multi-line php if statement in x-magento-init', () => {
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

    const { deps, warnings } = parse(input);
    expect(deps).toEqual(['slide']);
    expect(warnings).toHaveLength(0);
});
