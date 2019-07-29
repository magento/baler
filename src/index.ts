import { fsCrawler } from './fsCrawler';
import { join } from 'path';
import { promises as fs } from 'fs';
import { parse } from './mage-init-parser';

export async function analyze(magentoRoot: string) {
    const files = await fsCrawler(magentoRoot);

    for (const file of files) {
        if (
            KNOWN_BAD_FILES.includes(file) ||
            POSSIBLE_BAD_FILES.includes(file)
        ) {
            continue;
        }
        const path = join(magentoRoot, file);
        const contents = await fs.readFile(path, 'utf8');
        const results = parse(contents);
        if (results.warnings.length) {
            console.log(file);
        }
    }
}

const KNOWN_BAD_FILES = [
    'app/code/Magento/AdminNotification/view/adminhtml/templates/system/messages.phtml',
    'app/code/Magento/Backend/view/adminhtml/templates/system/search.phtml',
    'app/code/Magento/Braintree/view/frontend/templates/paypal/button.phtml',
    'app/code/Magento/Catalog/view/frontend/templates/product/breadcrumbs.phtml',
    'app/code/Magento/Catalog/view/frontend/templates/product/list/toolbar.phtml',
    'app/code/Magento/Catalog/view/frontend/templates/product/listing.phtml',
    'app/code/Magento/Cms/view/adminhtml/templates/browser/tree.phtml',
    'app/code/Magento/Customer/view/frontend/templates/js/customer-data.phtml',
    'app/code/Magento/Customer/view/frontend/templates/js/customer-data/invalidation-rules.phtml',
    'app/code/Magento/Customer/view/frontend/templates/js/section-config.phtml',
    'app/code/Magento/Integration/view/adminhtml/templates/resourcetree.phtml',
    'app/code/Magento/Msrp/view/base/templates/product/price/msrp.phtml',
    'app/code/Magento/Paypal/view/frontend/templates/express/in-context/component.phtml',
    'app/code/Magento/Paypal/view/frontend/templates/express/in-context/shortcut/button.phtml',
    'app/code/Magento/Paypal/view/frontend/templates/express/shortcut_button.phtml',
    'app/code/Magento/Theme/view/frontend/templates/html/sections.phtml',
    'app/code/Magento/User/view/adminhtml/templates/role/edit.phtml',
    'app/code/Magento/Weee/view/adminhtml/templates/renderer/tax.phtml',
];

const POSSIBLE_BAD_FILES = [
    'app/code/Magento/Bundle/view/frontend/templates/catalog/product/view/summary.phtml',
];
