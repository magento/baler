import { join, parse, dirname } from 'path';
import { readFile, writeFile } from './fsPromises';
import terser from 'terser';
import { RawSourceMap } from 'source-map';
import { wrapP } from './wrapP';

export type MinificationResult = {
    totalBytes: number;
    minFilename: string;
};

export async function minify(path: string): Promise<MinificationResult> {
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
    const result = terser.minify(source);
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

    const map = JSON.parse(mapSrc as string) as RawSourceMap;
    const result = terser.minify(source, {
        sourceMap: {
            content: map,
            url: sourceMapName,
        },
    });

    if (result.error) throw result.error;

    await writeFile(targetFilePath, result.code);
    return {
        totalBytes: Buffer.from(result.code as string).byteLength,
        minFilename: targetFilename,
    };
}
