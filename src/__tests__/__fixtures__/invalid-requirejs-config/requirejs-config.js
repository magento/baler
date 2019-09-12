(function() {
    require.config({
        map: {
            '*': {
                foo: window.fooPath()
            }
        }
    });
})();
