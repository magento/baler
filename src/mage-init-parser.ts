import { Parser } from 'htmlparser2';
import * as acorn from 'acorn';
import { generate } from 'escodegen';
import json5 from 'json5';

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
            const mageInit = extractMageInitKeyFromDataBind(dataBind);
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
 * @summary Get just the `mageInit` key from a `data-bind` attribute
 *          for knockout. This is challening because the value is
 *          neither valid JSON or valid JavaScript, and there can
 *          be multiple comma-separated values. Wrapping the
 *          value in `({ valuehere })` makes it a valid
 *          JavaScript object expression. So, we wrap, parse,
 *          modify the AST to only include the `mageInit` key, then we
 *          stringify back to JavaScript, and use json5 to parse the
 *          code that is now valid JavaScript, but not valid JSON
 */
function extractMageInitKeyFromDataBind(attrValue: string) {
    try {
        const valueWrappedAsObjectLiteral = `({${attrValue}})`;
        const ast = acorn.parse(valueWrappedAsObjectLiteral);
        // @ts-ignore missing types for AST from acorn
        const objExpression = ast.body[0].expression;
        objExpression.properties = objExpression.properties.filter(
            (p: any) => p.key.name === 'mageInit',
        );

        return json5.parse(generate(objExpression)).mageInit;
    } catch (err) {
        console.error(
            'Failed parsing value of a "data-bind" attribute while looking for the "mageInit" binding',
        );
        console.error(attrValue);
        throw err;
    }
}
