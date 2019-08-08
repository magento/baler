export function moduleIDToPath({ id, plugin }: { id: string; plugin: string }) {
    return `${id}.${plugin === 'text' ? 'html' : 'js'}`;
}
