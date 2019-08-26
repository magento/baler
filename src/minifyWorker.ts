import { join, parse, dirname } from 'path';
import { readFile, writeFile } from './fsPromises';
import terser, { MinifyOptions, SourceMapOptions } from 'terser';
import { wrapP } from './wrapP';

type FileMinificationResult = {
    totalBytes: number;
    minFilename: string;
};

type StringMinificationResult = {
    code: string;
    map?: string;
};

// The RequireJS runtime, in some cases
// relies on Function.prototype.toString
// to find calls to `require`. These must
// be preserved
const mangleOptions = {
    reserved: ['require'],
};

/**
 * @summary Minifies JS code, optionally chaining from
 *          a provided source-map
 */
export async function minifyFromString(
    code: string,
    filename: string,
    map?: string,
): Promise<StringMinificationResult> {
    const opts: MinifyOptions = {
        sourceMap: {
            filename,
            url: `${filename}.map`,
        },
        mangle: mangleOptions,
    };

    if (map) {
        try {
            const parsedMap = JSON.parse(map) as SourceMapOptions['content'];
            // @ts-ignore
            opts.sourceMap.content = parsedMap;
        } catch {}
    }

    const result = terser.minify(code, opts);
    if (result.error) throw result.error;

    return { code: result.code as string, map: result.map };
}

export async function minifyFromFilepath(
    path: string,
): Promise<FileMinificationResult> {
    const source = await readFile(path, 'utf8');
    const { 1: sourceMapName } =
        source.match(/\/\/#\ssourceMappingURL=(.+\.js\.map)/) || [];
    const parsedPath = parse(path);
    const targetFilename = `${parsedPath.name}.min${parsedPath.ext}`;
    const targetFilePath = join(parsedPath.dir, targetFilename);

    return sourceMapName
        ? minifyWithInputMap(
              source,
              targetFilename,
              targetFilePath,
              path,
              sourceMapName,
          )
        : minifyWithoutInputMap(source, targetFilename, targetFilePath);
}

async function minifyWithoutInputMap(
    source: string,
    targetFilename: string,
    targetFilePath: string,
) {
    const result = terser.minify(source, { mangle: mangleOptions });
    if (result.error) throw result.error;
    await writeFile(targetFilePath, result.code);
    return {
        totalBytes: Buffer.from(result.code as string).byteLength,
        minFilename: targetFilename,
    };
}

async function minifyWithInputMap(
    source: string,
    targetFilename: string,
    targetFilePath: string,
    sourcePath: string,
    sourceMapName: string,
) {
    const sourceDir = dirname(sourcePath);
    const mapPath = join(sourceDir, sourceMapName);
    const [err, mapSrc] = await wrapP(readFile(mapPath, 'utf8'));

    if (err) {
        // We don't want to fail a build because of a missing sourcemap,
        // so instead we fall back to just not using an input map
        return minifyWithoutInputMap(source, targetFilename, targetFilePath);
    }

    const map = JSON.parse(mapSrc as string) as SourceMapOptions['content'];
    const result = terser.minify(source, {
        sourceMap: {
            content: map,
            url: sourceMapName,
        },
        mangle: mangleOptions,
    });

    if (result.error) throw result.error;

    await writeFile(targetFilePath, result.code);
    return {
        totalBytes: Buffer.from(result.code as string).byteLength,
        minFilename: targetFilename,
    };
}
