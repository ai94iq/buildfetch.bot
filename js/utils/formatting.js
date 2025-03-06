// Formatting utility functions

export function humanReadableSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

export function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
}