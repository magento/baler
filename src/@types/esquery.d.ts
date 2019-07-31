declare module 'esquery' {
    function query(
        ast: import('estree').Program,
        query: string,
    ): import('estree').Node[];
    export { query };
}
