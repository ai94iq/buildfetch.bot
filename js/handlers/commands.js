// Command handlers

import { sendMessage } from '../utils/telegram.js';
import { fetchDevicesAndMaintainers, getMaintainerForDevice } from '../services/devices.js';
import { fetchBuildData } from '../services/builds.js';

export async function sendStart(chatId) {
    return sendMessage(chatId,
        "Welcome to Axion Build Checker!\n" +
        "Use /axion <codename> to check latest builds\n" +
        "Example: /axion pipa\n\n" +
        "Use /devices to see all officially supported devices"
    );
}

export async function sendHelp(chatId) {
    return sendMessage(chatId,
        "📱 *Axion Build Checker Commands:*\n\n" +
        "/start - Start the bot\n" +
        "/axion <codename> - Check builds for a specific device\n" +
        "/devices - List all officially supported devices\n" +
        "/help - Show this help message",
        { parse_mode: 'Markdown' }
    );
}

export async function handleAxionCommand(chatId, codename) {
    if (!codename) {
        return sendMessage(chatId, "Please provide a device codename!\nExample: /axion a71");
    }

    try {
        const [devices, maintainers, supportGroups] = await fetchDevicesAndMaintainers();
        
        // Check if device exists in official list
        if (!devices[codename]) {
            // Try to find similar codenames for suggestion
            const similarCodenames = Object.keys(devices)
                .filter(device => device.includes(codename) || codename.includes(device))
                .slice(0, 3);
            
            let message = `Device "${codename}" not found in official devices list.`;
            if (similarCodenames.length > 0) {
                message += `\n\nDid you mean:\n${similarCodenames.map(c => `• ${c} (${devices[c]})`).join('\n')}`;
            }
            
            return sendMessage(chatId, message);
        }
        
        const [vanillaData, gmsData] = await Promise.all([
            fetchBuildData(codename, 'VANILLA'),
            fetchBuildData(codename, 'GMS')
        ]);

        if (!vanillaData && !gmsData) {
            return sendMessage(chatId, `No builds found for ${codename}!`);
        }

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

        return sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
    } catch (error) {
        console.error('Error:', error);
        return sendMessage(chatId, "Failed to fetch build information. Please try again later.");
    }
}

export async function handleDevicesCommand(chatId) {
    try {
        const [devices, maintainers] = await fetchDevicesAndMaintainers();
        
        if (Object.keys(devices).length === 0) {
            return sendMessage(chatId, "No devices found. Please try again later.");
        }
        
        // Sort devices by name
        const sortedDevices = Object.entries(devices).sort((a, b) => a[1].localeCompare(b[1]));
        
        // Group devices by manufacturer
        const manufacturers = {};
        for (const [codename, name] of sortedDevices) {
            // Extract manufacturer from device name (usually the first word)
            const manufacturer = name.split(' ')[0];
            if (!manufacturers[manufacturer]) {
                manufacturers[manufacturer] = [];
            }
            manufacturers[manufacturer].push({ codename, name });
        }
        
        // Create message with manufacturers and devices
        let message = "📱 *Officially Supported Devices*\n\n";
        
        for (const [manufacturer, deviceList] of Object.entries(manufacturers)) {
            message += `*${manufacturer}*\n`;
            for (const device of deviceList) {
                message += `• ${device.name} (\`${device.codename}\`)\n`;
            }
            message += '\n';
        }
        
        message += "Use /axion <codename> to check builds for a specific device";
        
        // Split message if it's too long (Telegram has 4096 character limit)
        if (message.length > 4000) {
            const chunks = [];
            let currentChunk = '';
            
            const lines = message.split('\n');
            for (const line of lines) {
                if (currentChunk.length + line.length + 1 > 4000) {
                    chunks.push(currentChunk);
                    currentChunk = line;
                } else {
                    currentChunk += (currentChunk ? '\n' : '') + line;
                }
            }
            
            if (currentChunk) {
                chunks.push(currentChunk);
            }
            
            // Send chunks one by one
            for (const chunk of chunks) {
                await sendMessage(chatId, chunk, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                });
            }
            
            return new Response('OK');
        } else {
            return sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return sendMessage(chatId, "Failed to fetch device information. Please try again later.");
    }
}