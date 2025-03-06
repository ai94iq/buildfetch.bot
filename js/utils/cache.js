// Cache management utilities

// In-memory cache storage
const cacheStore = {
    devices: null,
    maintainers: null,
    supportGroups: null,
    devicesCacheTime: 0,
    builds: {}
};

export function getCachedData(type, key = null) {
    const now = Date.now();
    
    if (type === 'devices') {
        // Return devices, maintainers, and support groups if cache is valid
        if (cacheStore.devices && cacheStore.maintainers && 
            (now - cacheStore.devicesCacheTime < 60 * 1000)) {
            return [cacheStore.devices, cacheStore.maintainers, cacheStore.supportGroups];
        }
        return null;
    }
    
    if (type === 'build' && key) {
        // Return build data if cache is valid
        if (cacheStore.builds[key] && (now - cacheStore.builds[key].timestamp < 60 * 1000)) {
            return cacheStore.builds[key].data;
        }
        return null;
    }
    
    return null;
}

export function setCachedData(type, data, key = null) {
    const now = Date.now();
    
    if (type === 'devices' && Array.isArray(data) && data.length >= 3) {
        // Cache devices, maintainers, and support groups
        cacheStore.devices = data[0];
        cacheStore.maintainers = data[1];
        cacheStore.supportGroups = data[2];
        cacheStore.devicesCacheTime = now;
    }
    
    if (type === 'build' && key) {
        // Cache build data
        cacheStore.builds[key] = {
            data,
            timestamp: now
        };
    }
}