import { Parser } from 'htmlparser2';
import * as acorn from 'acorn';
import { ObjectExpression, Program } from 'estree';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { ParserResult } from './types';

/**
 * @summary Given contents from a .phtml or .html file from Magento,
 *          will return all JavaScript dependencies. Sources include:
 *          - x-magento-init script tags
 *          - data-mage-init attributes
 *          - mageInit knockout directive
 *          - require() calls in script tags
 *          - define() calls in script tags
 * @see https://devdocs.magento.com/guides/v2.3/javascript-dev-guide/javascript/js_init.html
 */
export function parseTemplateDeps(input: string): ParserResult {
    const collector = new NodeCollector();
    const parser = new Parser(collector, {
        lowerCaseTags: true,
        lowerCaseAttributeNames: true,
    });
    const cleanedInput = replacePHPDelimiters(input);
    parser.write(cleanedInput);

    return {
        // kill duplicates
        deps: Array.from(new Set(collector.deps)),
        incompleteAnalysis: collector.incompleteAnalysis,
    };
}

/**
 * @summary Implements htmlparser2's `Handler` interface
 *          and collects all forms of mage-init directives
 */
class NodeCollector {
    deps: string[];
    incompleteAnalysis: boolean;
    inXMageInitScript: boolean;
    inScript: boolean;
    buffer: string;

    constructor() {
        this.deps = [];
        this.incompleteAnalysis = false;
        this.inXMageInitScript = false;
        this.inScript = false;
        this.buffer = '';
    }

    onopentag(name: string, attribs: Record<string, string>) {
        const dataMageInit = attribs['data-mage-init'];
        const dataBind = attribs['data-bind'];

        if (dataMageInit) {
            try {
                this.deps.push(
                    ...extractDepsFromDataMageInitAttr(dataMageInit),
                );
            } catch {
                this.incompleteAnalysis = true;
            }
        }

        if (dataBind && dataBind.includes('mageInit')) {
            try {
                this.deps.push(...extractMageInitDepsFromDataBind(dataBind));
            } catch {
                this.incompleteAnalysis = true;
            }
        }

        if (name === 'script') {
            const { type = 'text/javascript' } = attribs;
            if (type === 'text/javascript') {
                this.inScript = true;
            }
            if (type === 'text/x-magento-init') {
                this.inXMageInitScript = true;
            }
        }
    }

    ontext(value: string) {
        if (!(this.inXMageInitScript || this.inScript)) return;
        this.buffer += value;
    }

    onclosetag() {
        if (this.inXMageInitScript) {
            try {
                this.deps.push(...extractDepsFromXMagentoInit(this.buffer));
            } catch {
                this.incompleteAnalysis = true;
            }
            this.buffer = '';
            this.inXMageInitScript = false;
        }

        if (this.inScript) {
            try {
                const results = parseJavaScriptDeps(this.buffer, true);
                this.deps.push(...results.deps);
                if (results.incompleteAnalysis) this.incompleteAnalysis = true;
            } catch {
                this.incompleteAnalysis = true;
            }
            this.buffer = '';
            this.inScript = false;
        }
    }
}

function extractMageInitDepsFromDataBind(attrValue: string): string[] {
    // Knockout bindings form an object literal without the outer wrapping braces
    const objExpression = getASTFromObjectLiteral(`{${attrValue}}`);
    const mageInitProp = objExpression.properties.find(
        p => p.key.type === 'Identifier' && p.key.name === 'mageInit',
    );

    if (!mageInitProp) {
        throw new Error('Could not locate "mageInit" property');
    }

    const propValue = mageInitProp.value as ObjectExpression;
    return getPropertyNamesFromObjExpression(propValue);
}

function extractDepsFromDataMageInitAttr(attrValue: string): string[] {
    const objExpression = getASTFromObjectLiteral(attrValue);
    return getPropertyNamesFromObjExpression(objExpression);
}

/**
 * @summary Replace PHP delimiters (and their contents) with placeholder
 *          values that will not break HTML parsing when the delimiters
 *          are not wrapped as JS string literals
 */
function replacePHPDelimiters(input: string) {
    return input.replace(/(<\?(?:=|php)[\s\S]+?\?>)/g, 'PHP_DELIM_PLACEHOLDER');
}

function extractDepsFromXMagentoInit(input: string): string[] {
    const objExpression = getASTFromObjectLiteral(input);
    const deps: string[] = [];

    for (const selector of objExpression.properties) {
        const propValue = selector.value as ObjectExpression;
        deps.push(...getPropertyNamesFromObjExpression(propValue));
    }

    return deps;
}

/**
 * @summary Get an ESTree AST from an object literal in source text.
 * @see https://github.com/estree/estree
 */
function getASTFromObjectLiteral(input: string) {
    // An opening brace in statement-position is parsed as
    // a block, so we force an expression by wrapping in parens
    const valueWrappedAsObjectLiteral = `(${input})`;
    // Acorn types are incomplete, but ESTree types match
    const ast = (acorn.parse(valueWrappedAsObjectLiteral) as any) as Program;
    const [firstStatement] = ast.body;

    if (
        firstStatement.type === 'ExpressionStatement' &&
        firstStatement.expression.type === 'ObjectExpression'
    ) {
        return firstStatement.expression;
    }

    throw new Error(
        'Expected an ObjectExpression to be the first expression in input',
    );
}

/**
 * @summary Given an AST for an object literal, return all literal
 *          property names, and report when a key can not be statically
 *          analyzed
 */
function getPropertyNamesFromObjExpression(node: ObjectExpression) {
    const keys: string[] = [];
    for (const { key } of node.properties) {
        if (key.type === 'Literal' && typeof key.value === 'string') {
            keys.push(key.value);
        }

        if (key.type === 'Identifier') {
            keys.push(key.name);
        }
    }
    return keys;
}
