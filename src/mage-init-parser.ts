import { Parser } from 'htmlparser2';

/**
 * @summary Given contents from a .phtml or .html file from Magento,
 *          will return a normalized form of all the various
 *          ways to define mage-init directives
 * @see https://devdocs.magento.com/guides/v2.3/javascript-dev-guide/javascript/js_init.html
 */
export function parse(input: string): string[] {
    const collector = new NodeCollector();
    const parser = new Parser(collector, {
        lowerCaseTags: true,
        lowerCaseAttributeNames: true,
    });
    parser.write(input);

    // Using JSON5 instead of native JSON parser because
    // the mageInit knockout binding allows objects using
    // JS (not JSON) syntax
    return collector.mageInits;
}

/**
 * @summary Implements htmlparser2's `Handler` interface
 *          and collects all forms of mage-init directives
 */
class NodeCollector {
    mageInits: string[];

    inScript: boolean;

    buffer: string;

    constructor() {
        this.mageInits = [];
        this.inScript = false;
        this.buffer = '';
    }

    onopentag(name: string, attribs: Record<string, string>) {
        const dataMageInit = attribs['data-mage-init'];
        const dataBind = attribs['data-bind'];

        if (dataMageInit) {
            this.mageInits.push(JSON.parse(dataMageInit));
        }

        if (dataBind && dataBind.includes('mageInit')) {
            const mageInit = disgustingEvalForDataBindAttr(dataBind);
            this.mageInits.push(mageInit);
        }

        if (name === 'script' && attribs.type === 'text/x-magento-init') {
            this.inScript = true;
        }
    }

    ontext(value: string) {
        if (!this.inScript) return;
        this.buffer += value;
    }

    onclosetag() {
        if (this.inScript) {
            this.inScript = false;
            this.mageInits.push(JSON.parse(this.buffer));
            this.buffer = '';
        }
    }
}

/**
 * @summary This is a super gross hack, but it's unfortunately
 *          necessary unless we want to fork a JSON parser
 *          to add support for non-quoted strings as values.
 *
 *          See Magento_Checkout/template/sidebar.html for
 *          an example of a multi-value `data-bind` that this
 *          parses
 */
function disgustingEvalForDataBindAttr(attrValue: string) {
    return (0, eval)(`
        const proxy = new Proxy({}, {
            get(target, prop) {
                if (Reflect.has(target, prop)) {
                    return Reflect.get(target, prop);
                }
                return 'n/a';
            },
            has(target, prop) {
                return typeof prop !== 'symbol';
            },
        });

        with (proxy) {
            ({${attrValue}}).mageInit;
        }
    `);
}
