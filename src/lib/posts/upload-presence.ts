let reader: (() => boolean) | undefined;

export function registerUploadPresence(read: () => boolean): void {
    reader = read;
}

// Memory uploads cannot exist before the manager module has loaded and registered.
export function hasMemoryUploads(): boolean {
    return reader?.() ?? false;
}
