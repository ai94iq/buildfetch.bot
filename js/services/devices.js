// Device data fetching and processing

import { DEVICES_URL } from '../config.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

export async function fetchDevicesAndMaintainers() {
    // Check cache first
    const cachedData = getCachedData('devices');
    if (cachedData) {
        return cachedData;
    }
    
    try {
        const response = await fetch(DEVICES_URL, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`);
        }
        
        // Try to parse as JSON first
        let deviceData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            deviceData = await response.json();
        } else {
            // Fall back to text parsing if not JSON
            return parseTextDeviceData(await response.text());
        }
        
        // Process JSON data
        const devices = {};
        const maintainersMap = {};
        const supportGroups = {};

        // Process each device in the JSON
        for (const [codename, info] of Object.entries(deviceData)) {
            // Add to devices map
            devices[codename.toLowerCase()] = info.device_name;
            
            // Add to maintainers map
            if (info.maintainer) {
                if (!maintainersMap[info.maintainer]) {
                    maintainersMap[info.maintainer] = [];
                }
                maintainersMap[info.maintainer].push(info.device_name);
            }
            
            // Add to support groups map
            if (info.support_group) {
                supportGroups[codename.toLowerCase()] = info.support_group;
            }
        }

        // Debug logging
        console.log(`Loaded ${Object.keys(devices).length} devices from JSON`);
        
        // Cache the results
        const result = [devices, maintainersMap, supportGroups];
        setCachedData('devices', result);
        
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
        return [{}, {}, {}];
    }
}

// Helper function to parse text-based device data
function parseTextDeviceData(text) {
    // Create maps
    const devices = {};
    const maintainersMap = {};
    const supportGroups = {};

    // Parse the text file line by line
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
        // Skip comments or empty lines
        if (line.startsWith('#') || !line.includes('=')) {
            continue;
        }
        
        // Split by delimiter
        const parts = line.split('=');
        
        if (parts.length >= 2) {
            const codename = parts[0].trim().toLowerCase();
            const deviceName = parts[1].trim();
            
            // Add to devices map
            devices[codename] = deviceName;
            
            // If there's maintainer info (3rd part)
            if (parts.length >= 3 && parts[2].trim()) {
                const maintainer = parts[2].trim();
                if (!maintainersMap[maintainer]) {
                    maintainersMap[maintainer] = [];
                }
                maintainersMap[maintainer].push(deviceName);
            }
            
            // If there's support group info (4th part)
            if (parts.length >= 4 && parts[3].trim()) {
                supportGroups[codename] = parts[3].trim();
            }
        }
    }

    console.log(`Loaded ${Object.keys(devices).length} devices from text format`);
    
    return [devices, maintainersMap, supportGroups];
}

export function getMaintainerForDevice(maintainers, codename, devices) {
    // Check if the device exists
    if (!devices[codename]) return null;
    
    // Direct lookup from maintainers map
    for (const [maintainer, devicesList] of Object.entries(maintainers)) {
        if (devicesList.includes(devices[codename])) {
            return maintainer;
        }
    }
    
    return null;
}