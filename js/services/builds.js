// Build data fetching

import { BUILD_DATA_URL } from '../config.js';
import { humanReadableSize, formatTimestamp } from '../utils/formatting.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

export async function fetchBuildData(codename, variant) {
    // Create cache key
    const cacheKey = `${codename}_${variant}`;
    
    // Check cache first
    const cachedData = getCachedData('build', cacheKey);
    if (cachedData) {
        return cachedData;
    }
    
    try {
        // Fetch actual build data from GitHub OTA repository
        const url = `${BUILD_DATA_URL}/${variant}/${codename}.json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`No build data for ${codename} (${variant})`);
            return null;
        }
        
        const data = await response.json();
        
        if (!data.response || data.response.length === 0) {
            console.log(`Empty build data for ${codename} (${variant})`);
            return null;
        }
        
        // Get the latest build (first in the array)
        const latestBuild = data.response[0];
        
        // Format build data
        const buildData = {
            filename: latestBuild.filename,
            version: latestBuild.version,
            size: humanReadableSize(latestBuild.size),
            date: formatTimestamp(latestBuild.datetime),
            url: latestBuild.url,
            md5: latestBuild.md5sum || null
        };
        
        // Cache the result
        setCachedData('build', buildData, cacheKey);
        
        return buildData;
    } catch (error) {
        console.error(`Error fetching build data for ${codename} (${variant}):`, error);
        return null;
    }
}