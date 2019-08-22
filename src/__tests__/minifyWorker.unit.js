const { join, basename } = require('path');
const { copyFile } = require('../fsPromises');
const { minify } = require('../minifyWorker');
const { readFile } = require('../fsPromises');
const tempy = require('tempy');

const moveFileToTmpDir = async path => {
    const tmpDir = tempy.directory();
    const filename = basename(path);
    const tmpPath = join(tmpDir, filename);
    await copyFile(path, tmpPath);
    return { tmpPath, tmpDir };
};
const getFixturePath = (fixtureName, path) =>
    join(__dirname, '__fixtures__', fixtureName, path);

test('Minifies JS file', async () => {
    const srcPath = getFixturePath('basic-minify', 'bundle.js');
    const { tmpDir, tmpPath } = await moveFileToTmpDir(srcPath);

    const result = await minify(tmpPath);
    const resultFilePath = join(tmpDir, result.minFilename);
    const minifiedCode = await readFile(resultFilePath, 'utf8');

    expect(minifiedCode).toMatchInlineSnapshot(
        `"define([\\"a\\"],function(n){console.log(n)});"`,
    );
});

test('Minfies JS file and chains sourcemap', async () => {
    const srcPath = getFixturePath('source-mapped-minify', 'bundle.js');
    const { tmpDir, tmpPath } = await moveFileToTmpDir(srcPath);

    const result = await minify(tmpPath);
    const resultFilePath = join(tmpDir, result.minFilename);
    const minifiedCode = await readFile(resultFilePath, 'utf8');

    expect(minifiedCode).toMatchInlineSnapshot(
        `"define([\\"a\\"],function(n){(0,console.log)(n)});"`,
    );
    // TODO: Assert that sourcemap was chained properly
});
