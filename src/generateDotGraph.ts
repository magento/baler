export function generateDotGraph(graph: Record<string, string[]>) {
    const strBuilder = ['digraph {'];
    for (const [id, deps] of Object.entries(graph)) {
        strBuilder.push(...deps.map(d => `  "${id}" -> "${d}"`));
    }
    strBuilder.push('}');
    return strBuilder.join('\n');
}
