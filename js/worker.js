// Main entry point for the bot

import { handleUpdate } from './handlers/updates.js';

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const update = await request.json();
            return handleUpdate(update);
        } catch (error) {
            console.error('Error parsing request:', error);
            return new Response('Bad Request', { status: 400 });
        }
    }
    return new Response('This webhook only accepts POST requests.', { status: 200 });
}

// Event listener for CloudFlare Workers
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
