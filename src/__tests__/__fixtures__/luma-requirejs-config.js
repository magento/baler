(function(require) {
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    rowBuilder: 'Magento_Theme/js/row-builder',
                    toggleAdvanced: 'mage/toggle',
                    translateInline: 'mage/translate-inline',
                    sticky: 'mage/sticky',
                    tabs: 'mage/tabs',
                    zoom: 'mage/zoom',
                    collapsible: 'mage/collapsible',
                    dropdownDialog: 'mage/dropdown',
                    dropdown: 'mage/dropdowns',
                    accordion: 'mage/accordion',
                    loader: 'mage/loader',
                    tooltip: 'mage/tooltip',
                    deletableItem: 'mage/deletable-item',
                    itemTable: 'mage/item-table',
                    fieldsetControls: 'mage/fieldset-controls',
                    fieldsetResetControl: 'mage/fieldset-controls',
                    redirectUrl: 'mage/redirect-url',
                    loaderAjax: 'mage/loader',
                    menu: 'mage/menu',
                    popupWindow: 'mage/popup-window',
                    validation: 'mage/validation/validation',
                    welcome: 'Magento_Theme/js/view/welcome',
                    breadcrumbs: 'Magento_Theme/js/view/breadcrumbs',
                },
            },
            paths: {
                'jquery/ui': 'jquery/jquery-ui',
            },
            deps: [
                'jquery/jquery.mobile.custom',
                'mage/common',
                'mage/dataPost',
                'mage/bootstrap',
            ],
            config: {
                mixins: {
                    'Magento_Theme/js/view/breadcrumbs': {
                        'Magento_Theme/js/view/add-home-breadcrumb': true,
                    },
                    'jquery/jquery-ui': {
                        'jquery/patches/jquery-ui': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            waitSeconds: 0,
            map: {
                '*': {
                    ko: 'knockoutjs/knockout',
                    knockout: 'knockoutjs/knockout',
                    mageUtils: 'mage/utils/main',
                    rjsResolver: 'mage/requirejs/resolver',
                },
            },
            shim: {
                'jquery/jquery-migrate': ['jquery'],
                'jquery/jstree/jquery.hotkeys': ['jquery'],
                'jquery/hover-intent': ['jquery'],
                'mage/adminhtml/backup': ['prototype'],
                'mage/captcha': ['prototype'],
                'mage/common': ['jquery'],
                'mage/new-gallery': ['jquery'],
                'mage/webapi': ['jquery'],
                'jquery/ui': ['jquery'],
                MutationObserver: ['es6-collections'],
                moment: {
                    exports: 'moment',
                },
                matchMedia: {
                    exports: 'mediaCheck',
                },
                'jquery/jquery-storageapi': {
                    deps: ['jquery/jquery.cookie'],
                },
            },
            paths: {
                'jquery/validate': 'jquery/jquery.validate',
                'jquery/hover-intent': 'jquery/jquery.hoverIntent',
                'jquery/file-uploader':
                    'jquery/fileUploader/jquery.fileupload-fp',
                prototype: 'legacy-build.min',
                'jquery/jquery-storageapi': 'jquery/jquery.storageapi.min',
                text: 'mage/requirejs/text',
                domReady: 'requirejs/domReady',
                spectrum: 'jquery/spectrum/spectrum',
                tinycolor: 'jquery/spectrum/tinycolor',
            },
            deps: ['jquery/jquery-migrate'],
            config: {
                mixins: {
                    'jquery/jstree/jquery.jstree': {
                        'mage/backend/jstree-mixin': true,
                    },
                    jquery: {
                        'jquery/patches/jquery': true,
                    },
                },
                text: {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            },
        };

        require(['jquery'], function($) {
            'use strict';

            $.noConflict();
        });

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    quickSearch: 'Magento_Search/js/form-mini',
                    'Magento_Search/form-mini': 'Magento_Search/js/form-mini',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    checkoutBalance: 'Magento_Customer/js/checkout-balance',
                    address: 'Magento_Customer/js/address',
                    changeEmailPassword:
                        'Magento_Customer/js/change-email-password',
                    passwordStrengthIndicator:
                        'Magento_Customer/js/password-strength-indicator',
                    zxcvbn: 'Magento_Customer/js/zxcvbn',
                    addressValidation: 'Magento_Customer/js/addressValidation',
                    'Magento_Customer/address': 'Magento_Customer/js/address',
                    'Magento_Customer/change-email-password':
                        'Magento_Customer/js/change-email-password',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            deps: ['jquery/jquery.cookie'],
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    compareList: 'Magento_Catalog/js/list',
                    relatedProducts: 'Magento_Catalog/js/related-products',
                    upsellProducts: 'Magento_Catalog/js/upsell-products',
                    productListToolbarForm:
                        'Magento_Catalog/js/product/list/toolbar',
                    catalogGallery: 'Magento_Catalog/js/gallery',
                    priceBox: 'Magento_Catalog/js/price-box',
                    priceOptionDate: 'Magento_Catalog/js/price-option-date',
                    priceOptionFile: 'Magento_Catalog/js/price-option-file',
                    priceOptions: 'Magento_Catalog/js/price-options',
                    priceUtils: 'Magento_Catalog/js/price-utils',
                    catalogAddToCart: 'Magento_Catalog/js/catalog-add-to-cart',
                },
            },
            config: {
                mixins: {
                    'Magento_Theme/js/view/breadcrumbs': {
                        'Magento_Catalog/js/product/breadcrumbs': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    addToCart: 'Magento_Msrp/js/msrp',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    bundleOption: 'Magento_Bundle/bundle',
                    priceBundle: 'Magento_Bundle/js/price-bundle',
                    slide: 'Magento_Bundle/js/slide',
                    productSummary: 'Magento_Bundle/js/product-summary',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    creditCardType: 'Magento_Payment/js/cc-type',
                    'Magento_Payment/cc-type': 'Magento_Payment/js/cc-type',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    giftMessage: 'Magento_Sales/js/gift-message',
                    ordersReturns: 'Magento_Sales/js/orders-returns',
                    'Magento_Sales/gift-message':
                        'Magento_Sales/js/gift-message',
                    'Magento_Sales/orders-returns':
                        'Magento_Sales/js/orders-returns',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    discountCode: 'Magento_Checkout/js/discount-codes',
                    shoppingCart: 'Magento_Checkout/js/shopping-cart',
                    regionUpdater: 'Magento_Checkout/js/region-updater',
                    sidebar: 'Magento_Checkout/js/sidebar',
                    checkoutLoader: 'Magento_Checkout/js/checkout-loader',
                    checkoutData: 'Magento_Checkout/js/checkout-data',
                    proceedToCheckout:
                        'Magento_Checkout/js/proceed-to-checkout',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    downloadable: 'Magento_Downloadable/js/downloadable',
                    'Magento_Downloadable/downloadable':
                        'Magento_Downloadable/js/downloadable',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    configurable: 'Magento_ConfigurableProduct/js/configurable',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    catalogSearch: 'Magento_CatalogSearch/form-mini',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    requireCookie: 'Magento_Cookie/js/require-cookie',
                    cookieNotices: 'Magento_Cookie/js/notices',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    transparent: 'Magento_Payment/js/transparent',
                    'Magento_Payment/transparent':
                        'Magento_Payment/js/transparent',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    taxToggle: 'Magento_Weee/js/tax-toggle',
                    'Magento_Weee/tax-toggle': 'Magento_Weee/js/tax-toggle',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    giftOptions: 'Magento_GiftMessage/js/gift-options',
                    extraOptions: 'Magento_GiftMessage/js/extra-options',
                    'Magento_GiftMessage/gift-options':
                        'Magento_GiftMessage/js/gift-options',
                    'Magento_GiftMessage/extra-options':
                        'Magento_GiftMessage/js/extra-options',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            shim: {
                'tiny_mce_4/tinymce.min': {
                    exports: 'tinyMCE',
                },
            },
            paths: {
                'ui/template': 'Magento_Ui/templates',
            },
            map: {
                '*': {
                    uiElement: 'Magento_Ui/js/lib/core/element/element',
                    uiCollection: 'Magento_Ui/js/lib/core/collection',
                    uiComponent: 'Magento_Ui/js/lib/core/collection',
                    uiClass: 'Magento_Ui/js/lib/core/class',
                    uiEvents: 'Magento_Ui/js/lib/core/events',
                    uiRegistry: 'Magento_Ui/js/lib/registry/registry',
                    consoleLogger: 'Magento_Ui/js/lib/logger/console-logger',
                    uiLayout: 'Magento_Ui/js/core/renderer/layout',
                    buttonAdapter: 'Magento_Ui/js/form/button-adapter',
                    tinymce4: 'tiny_mce_4/tinymce.min',
                    wysiwygAdapter:
                        'mage/adminhtml/wysiwyg/tiny_mce/tinymce4Adapter',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    pageCache: 'Magento_PageCache/js/page-cache',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    multiShipping: 'Magento_Multishipping/js/multi-shipping',
                    orderOverview: 'Magento_Multishipping/js/overview',
                    payment: 'Magento_Multishipping/js/payment',
                    billingLoader: 'Magento_Checkout/js/checkout-loader',
                    cartUpdate:
                        'Magento_Checkout/js/action/update-shopping-cart',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            shim: {
                acceptjs: {
                    exports: 'Accept',
                },
                acceptjssandbox: {
                    exports: 'Accept',
                },
            },
            paths: {
                acceptjssandbox: 'https://jstest.authorize.net/v1/Accept',
                acceptjs: 'https://js.authorize.net/v1/Accept',
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    captcha: 'Magento_Captcha/js/captcha',
                    'Magento_Captcha/captcha': 'Magento_Captcha/js/captcha',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    transparent: 'Magento_Payment/js/transparent',
                    'Magento_Payment/transparent':
                        'Magento_Payment/js/transparent',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    orderReview: 'Magento_Paypal/js/order-review',
                    'Magento_Paypal/order-review':
                        'Magento_Paypal/js/order-review',
                    paypalCheckout: 'Magento_Paypal/js/paypal-checkout',
                },
            },
            paths: {
                paypalInContextExpressCheckout:
                    'https://www.paypalobjects.com/api/checkout',
            },
            shim: {
                paypalInContextExpressCheckout: {
                    exports: 'paypal',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            config: {
                mixins: {
                    'Magento_Customer/js/customer-data': {
                        'Magento_Persistent/js/view/customer-data-mixin': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    loadPlayer: 'Magento_ProductVideo/js/load-player',
                    fotoramaVideoEvents:
                        'Magento_ProductVideo/js/fotorama-add-video-events',
                },
            },
            shim: {
                vimeoAPI: {},
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    recentlyViewedProducts:
                        'Magento_Reports/js/recently-viewed',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    braintree:
                        'https://js.braintreegateway.com/js/braintree-2.32.0.min.js',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            config: {
                mixins: {
                    'Magento_Checkout/js/action/place-order': {
                        'Magento_CheckoutAgreements/js/model/place-order-mixin': true,
                    },
                    'Magento_Checkout/js/action/set-payment-information': {
                        'Magento_CheckoutAgreements/js/model/set-payment-information-mixin': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            shim: {
                'Magento_Tinymce3/tiny_mce/tiny_mce_src': {
                    exports: 'tinymce',
                },
            },
            map: {
                '*': {
                    tinymceDeprecated: 'Magento_Tinymce3/tiny_mce/tiny_mce_src',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    editTrigger: 'mage/edit-trigger',
                    addClass: 'Magento_Translation/js/add-class',
                    'Magento_Translation/add-class':
                        'Magento_Translation/js/add-class',
                },
            },
            deps: ['mage/translate-inline'],
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            config: {
                mixins: {
                    'Magento_Checkout/js/view/payment/list': {
                        'Magento_PaypalCaptcha/js/view/payment/list-mixin': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * MageSpecialist
         *
         * NOTICE OF LICENSE
         *
         * This source file is subject to the Open Software License (OSL 3.0)
         * that is bundled with this package in the file LICENSE.txt.
         * It is also available through the world-wide-web at this URL:
         * http://opensource.org/licenses/osl-3.0.php
         * If you did not receive a copy of the license and are unable to
         * obtain it through the world-wide-web, please send an email
         * to info@magespecialist.it so we can send you a copy immediately.
         *
         * @copyright  Copyright (c) 2017 Skeeller srl (http://www.magespecialist.it)
         * @license    http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
         */

        'use strict';

        // eslint-disable-next-line no-unused-vars
        var config = {
            config: {
                mixins: {
                    'Magento_Ui/js/view/messages': {
                        'MSP_ReCaptcha/js/ui-messages-mixin': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            map: {
                '*': {
                    wishlist: 'Magento_Wishlist/js/wishlist',
                    addToWishlist: 'Magento_Wishlist/js/add-to-wishlist',
                    wishlistSearch: 'Magento_Wishlist/js/search',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
         *
         * Licensed under the Apache License, Version 2.0 (the "License").
         * You may not use this file except in compliance with the License.
         * A copy of the License is located at
         *
         *  http://aws.amazon.com/apache2.0
         *
         * or in the "license" file accompanying this file. This file is distributed
         * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
         * express or implied. See the License for the specific language governing
         * permissions and limitations under the License.
         */

        var config = {
            map: {
                '*': {
                    amazonLogout: 'Amazon_Login/js/amazon-logout',
                    amazonOAuthRedirect: 'Amazon_Login/js/amazon-redirect',
                    amazonCsrf: 'Amazon_Login/js/amazon-csrf',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
         *
         * Licensed under the Apache License, Version 2.0 (the "License").
         * You may not use this file except in compliance with the License.
         * A copy of the License is located at
         *
         *  http://aws.amazon.com/apache2.0
         *
         * or in the "license" file accompanying this file. This file is distributed
         * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
         * express or implied. See the License for the specific language governing
         * permissions and limitations under the License.
         */
        var config = {
            map: {
                '*': {
                    amazonCore: 'Amazon_Payment/js/amazon-core',
                    amazonWidgetsLoader:
                        'Amazon_Payment/js/amazon-widgets-loader',
                    amazonButton: 'Amazon_Payment/js/amazon-button',
                    amazonProductAdd: 'Amazon_Payment/js/amazon-product-add',
                    bluebird: 'Amazon_Payment/js/lib/bluebird.min',
                    amazonPaymentConfig:
                        'Amazon_Payment/js/model/amazonPaymentConfig',
                    sjcl: 'Amazon_Payment/js/lib/sjcl.min',
                },
            },
            config: {
                mixins: {
                    'Amazon_Payment/js/action/place-order': {
                        'Amazon_Payment/js/model/place-order-mixin': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * This file is part of the Klarna KP module
         *
         * (c) Klarna Bank AB (publ)
         *
         * For the full copyright and license information, please view the NOTICE
         * and LICENSE files that were distributed with this source code.
         */
        var config = {
            config: {
                mixins: {
                    'Magento_Checkout/js/action/get-payment-information': {
                        'Klarna_Kp/js/action/override': true,
                    },
                },
            },
            map: {
                '*': {
                    klarnapi: 'https://x.klarnacdn.net/kp/lib/v1/api.js',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        // eslint-disable-next-line no-unused-vars
        var config = {
            config: {
                mixins: {
                    'Magento_Paypal/js/view/payment/method-renderer/payflowpro-method': {
                        'Magento_PaypalReCaptcha/js/payflowpro-method-mixin': true,
                    },
                },
            },
        };

        require.config(config);
    })();
    (function() {
        var config = {
            paths: {
                temandoCheckoutFieldsDefinition:
                    'Temando_Shipping/js/model/fields-definition',
                temandoDeliveryOptions:
                    'Temando_Shipping/js/model/delivery-options',
                temandoShippingRatesValidator:
                    'Temando_Shipping/js/model/shipping-rates-validator/temando',
                temandoShippingRatesValidationRules:
                    'Temando_Shipping/js/model/shipping-rates-validation-rules/temando',
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * @copyright  Vertex. All rights reserved.  https://www.vertexinc.com/
         * @author     Mediotype                     https://www.mediotype.com/
         */

        var config = {
            map: {
                '*': {
                    'set-checkout-messages':
                        'Vertex_Tax/js/model/set-checkout-messages',
                },
            },
        };

        require.config(config);
    })();
    (function() {
        /**
         * Copyright © Magento, Inc. All rights reserved.
         * See COPYING.txt for license details.
         */

        var config = {
            deps: ['Magento_Theme/js/responsive', 'Magento_Theme/js/theme'],
        };

        require.config(config);
    })();
})(require);
