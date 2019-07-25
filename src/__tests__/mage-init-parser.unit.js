const { parse } = require('../mage-init-parser');

test('single script in phtml with inline php values', () => {
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

    const [first] = parse(input);
    expect(first).toEqual({
        '*': {
            'Dotdigitalgroup_Email/js/dashboard': {
                contactLink:
                    '<?= $block->escapeUrl($block->getContactSyncLink()); ?>',
                importerLink:
                    '<?= $block->escapeUrl($block->getImporterLink()); ?>',
            },
        },
    });
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

    const [first] = parse(input);
    expect(first).toEqual({
        amazonButton: { buttonType: 'PwA' },
    });
});

test('single data-bind mageInit in .phtml file', () => {
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

    const [first] = parse(input);
    expect(first).toEqual({
        dropdown: { activeClass: '_active' },
    });
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

    const [first] = parse(input);
    expect(first).toEqual({
        'Magento_Ui/js/modal/modal': {
            type: 'custom',
            modalClass: 'opc-sidebar opc-summary-wrapper',
        },
    });
});
