// This file starts both the bot and the web dashboard in the same process
// which is perfect for cloud hosting platforms like JustRunMyApp!

console.log('[System] Starting Discord Bot...');
require('./bot/index.js');

console.log('[System] Starting Web Dashboard...');
require('./dashboard/server.js');
