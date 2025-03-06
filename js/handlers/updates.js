// Update handling logic

import { answerCallbackQuery } from '../utils/telegram.js';
import { handleBackButton, handleBuildDetails } from './callbacks.js';
import { sendStart, sendHelp, handleAxionCommand, handleDevicesCommand } from './commands.js';

export async function handleUpdate(update) {
    try {
        if (update.callback_query) {
            await answerCallbackQuery(update.callback_query.id);
            const data = update.callback_query.data;
            const [action, codename] = data.split('_');
            
            if (action === 'back') {
                return handleBackButton(update.callback_query, codename);
            }
            return handleBuildDetails(update.callback_query, action, codename);
        }

        if (update.message && update.message.text) {
            const message = update.message.text;
            const chatId = update.message.chat.id;
            const args = message.split(/\s+/);
            const command = args[0].toLowerCase();

            // Extract the base command without bot username
            let baseCommand = command;
            if (command.includes('@')) {
                const [cmd, botUsername] = command.split('@');
                baseCommand = cmd;
            }

            if (baseCommand === '/start') {
                return sendStart(chatId);
            }
            else if (baseCommand === '/axion') {
                const codename = args[1]?.toLowerCase();
                return handleAxionCommand(chatId, codename);
            }
            else if (baseCommand === '/devices') {
                return handleDevicesCommand(chatId);
            }
            else if (baseCommand === '/help') {
                return sendHelp(chatId);
            }
        }

        return new Response('OK');
    } catch (error) {
        console.error('Error handling update:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}