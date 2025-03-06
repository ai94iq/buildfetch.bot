// Telegram API communication utilities

import { API_BASE } from '../config.js';

export async function answerCallbackQuery(callbackQueryId, text = '') {
    try {
        const params = new URLSearchParams({
            callback_query_id: callbackQueryId,
            text: text
        });

        await fetch(`${API_BASE}/answerCallbackQuery?${params}`);
    } catch (error) {
        console.error('Error answering callback query:', error);
    }
}

export async function sendMessage(chatId, text, options = {}) {
    try {
        const params = new URLSearchParams({
            chat_id: chatId,
            text,
            parse_mode: options.parse_mode || '',
            disable_web_page_preview: options.disable_web_page_preview || false
        });

        if (options.reply_markup) {
            params.append('reply_markup', JSON.stringify(options.reply_markup));
        }

        const response = await fetch(`${API_BASE}/sendMessage?${params}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Telegram API error:', errorData);
            
            // If message is too long, try to handle it
            if (errorData.description && errorData.description.includes('message is too long')) {
                // Split the message and send in chunks
                const maxLength = 4000; // Safe limit for Telegram
                for (let i = 0; i < text.length; i += maxLength) {
                    const chunk = text.substring(i, i + maxLength);
                    await sendMessage(chatId, chunk, {
                        parse_mode: options.parse_mode,
                        disable_web_page_preview: true
                    });
                }
                return new Response('OK');
            }
        }
        
        return new Response('OK');
    } catch (error) {
        console.error('Error sending message:', error);
        return new Response('Failed to send message', { status: 500 });
    }
}

export async function editMessage(query, text, options = {}) {
    try {
        const params = new URLSearchParams({
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            text,
            parse_mode: options.parse_mode || ''
        });

        if (options.reply_markup) {
            params.append('reply_markup', JSON.stringify(options.reply_markup));
        }

        const response = await fetch(`${API_BASE}/editMessageText?${params}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Telegram API error:', errorData);
        }
        
        return new Response('OK');
    } catch (error) {
        console.error('Error editing message:', error);
        return new Response('Failed to edit message', { status: 500 });
    }
}