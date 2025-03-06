// Callback query handlers

import { answerCallbackQuery, editMessage } from '../utils/telegram.js';
import { fetchDevicesAndMaintainers, getMaintainerForDevice } from '../services/devices.js';
import { fetchBuildData } from '../services/builds.js';

export async function handleBackButton(query, codename) {
    try {
        const [devices, maintainers, supportGroups] = await fetchDevicesAndMaintainers();
        const [vanillaData, gmsData] = await Promise.all([
            fetchBuildData(codename, 'VANILLA'),
            fetchBuildData(codename, 'GMS')
        ]);

        const deviceName = devices[codename];
        const maintainer = getMaintainerForDevice(maintainers, codename, devices);
        const supportGroup = supportGroups[codename];
        const keyboard = [];
        
        let message = `📱 *${deviceName}* (${codename})\n`;
        if (maintainer) message += `👤 Maintainer: ${maintainer}\n`;
        if (supportGroup) message += `💬 [Support Group](${supportGroup})\n`;
        message += "\n*Available builds:*\n";

        if (vanillaData) {
            keyboard.push([{ text: "Vanilla", callback_data: `vanilla_${codename}` }]);
            message += `\n• Vanilla: ${vanillaData.version}`;
        }
        if (gmsData) {
            keyboard.push([{ text: "GMS", callback_data: `gms_${codename}` }]);
            message += `\n• GMS: ${gmsData.version}`;
        }

        return editMessage(query, message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
    } catch (error) {
        console.error('Error:', error);
        return editMessage(query, "Failed to fetch build information. Please try again later.");
    }
}

export async function handleBuildDetails(query, variant, codename) {
    try {
        const [devices, maintainers, supportGroups] = await fetchDevicesAndMaintainers();
        const buildData = await fetchBuildData(codename, variant.toUpperCase());
        
        if (!buildData) {
            return editMessage(query, `No ${variant} build found for ${codename}!`);
        }

        const deviceName = devices[codename];
        const maintainer = getMaintainerForDevice(maintainers, codename, devices);
        const supportGroup = supportGroups[codename];
        
        let message = 
            `⚡ *${variant.toUpperCase()} Build*\n` +
            `📱 Device: ${deviceName} (${codename})\n` +
            `👤 Maintainer: ${maintainer || 'Not specified'}`;
            
        if (supportGroup) {
            message += `\n💬 [Support Group](${supportGroup})`;
        }
        
        message += `\n\n🔖 Version: ${buildData.version}\n` +
                   `📅 Date: ${buildData.date}\n` +
                   `📦 Size: ${buildData.size}`;

        const keyboard = [
            [{ text: "⬇️ Download", url: buildData.url }]
        ];
        
        // Add MD5 button if available
        if (buildData.md5) {
            keyboard.push([{ text: "📋 MD5: " + buildData.md5.substring(0, 16) + "...", callback_data: "md5_copy" }]);
        }
        
        keyboard.push([{ text: "🔙 Back", callback_data: `back_${codename}` }]);

        return editMessage(query, message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
    } catch (error) {
        console.error('Error:', error);
        return editMessage(query, "Failed to fetch build details. Please try again later.");
    }
}