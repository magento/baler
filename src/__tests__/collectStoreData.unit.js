const getModuleUnderTest = () => {
    jest.resetModules();
    return require('../collectStoreData');
};

const Deferred = () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        (resolve = res), (reject = rej);
    });
    return { promise, resolve, reject };
};

test('data is fetched from magentoFS in parallel', async () => {
    const enabledModulesDefer = Deferred();
    const componentsDefer = Deferred();
    const deployedThemesDefer = Deferred();

    const magentoFSMock = {
        getEnabledModules: jest
            .fn()
            .mockReturnValue(enabledModulesDefer.promise),
        getComponents: jest.fn().mockReturnValue(componentsDefer.promise),
        getDeployedThemes: jest
            .fn()
            .mockReturnValue(deployedThemesDefer.promise),
    };
    jest.mock('../magentoFS', () => magentoFSMock);
    const { collectStoreData } = getModuleUnderTest();

    const finishedPromise = collectStoreData('/some/magento/root');

    // verify all data-providing methods of magentoFS have been invoked
    // prior to resolving any of them, to ensure collectStoreData is
    // running async ops in parallel
    expect(magentoFSMock.getEnabledModules).toHaveBeenCalledTimes(1);
    expect(magentoFSMock.getComponents).toHaveBeenCalledTimes(1);
    expect(magentoFSMock.getDeployedThemes).toHaveBeenCalledTimes(1);

    [enabledModulesDefer, componentsDefer, deployedThemesDefer].forEach(d =>
        d.resolve(),
    );

    await finishedPromise;
});
