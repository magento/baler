import PHPParser, { Block } from 'php-parser';

/**
 * @summary Given the string contents of a Magento theme's
 *          registration.php, will return the theme's ID,
 *          as well as its area (frontend/adminhtml)
 */
export function parseThemeIDFromRegistration(
    code: string,
    registrationFilepath: string,
) {
    const ast = PHPParser.parseCode(code);
    const toVisit: Block[] = [ast];

    while (toVisit.length) {
        const node = toVisit.pop() as Block;

        if (node.kind === 'expressionstatement') {
            toVisit.push((node as any).expression as Block);
        }

        if (Array.isArray(node.children) && node.children.length) {
            toVisit.push(...(node.children as Block[]));
        }

        if (node.kind === 'call') {
            if (!isThemeRegisterCall(node)) continue;
            const [, secondArg] = (node as any).arguments as Block[];

            if (secondArg.kind !== 'string') {
                throw new Error(
                    'Expected the second argument in "registration.php" to be ' +
                        `a string, but it was instead a value of type "${secondArg.kind}"\n` +
                        `Source file: ${registrationFilepath}`,
                );
            }

            return parseThemeName((secondArg as any).value);
        }
    }
}

function parseThemeName(
    value: string,
): { themeID: string; area: 'frontend' | 'adminhtml' } {
    const [first, second, third] = value.split('/');
    if (first !== 'frontend' && first !== 'adminhtml') {
        throw new Error(
            `Unrecognized area for theme ${value}. Saw "${first}", ` +
                'but expected "frontend" or "adminhtml"',
        );
    }

    return {
        themeID: `${second}/${third}`,
        area: first,
    };
}

function isThemeRegisterCall(node: Block): Boolean {
    const what = (node as any).what as Block;
    const args = (node as any).arguments as Block[];

    const nodeIsRegistrar = (node: any) =>
        node.kind === 'staticlookup' &&
        node.what.kind === 'classreference' &&
        /ComponentRegistrar$/.test(node.what.name);

    const isCallToComponentRegistrar =
        nodeIsRegistrar(what) && (what as any).offset.name === 'register';

    const [firstArg] = args;
    const isFirstArgThemeConst =
        nodeIsRegistrar(firstArg) && (firstArg as any).offset.name === 'THEME';

    return isCallToComponentRegistrar && isFirstArgThemeConst;
}
