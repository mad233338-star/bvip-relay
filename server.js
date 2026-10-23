const WebSocket = require('ws');

const port = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port }, () => {
    console.log(`Relay server running on port ${port}`);
});

const rooms = {};

wss.on('connection', (ws) => {
    let currentRoom = null;
    let userRole = null;

    ws.on('message', (message, isBinary) => {
        if (!currentRoom && !isBinary) {
            const parts = message.toString().split(':');
            if (parts[0] === 'JOIN' && parts.length === 3) {
                currentRoom = parts[1];
                userRole = parts[2];

                if (!rooms[currentRoom]) {
                    rooms[currentRoom] = {};
                }
                rooms[currentRoom][userRole] = ws;
                console.log(`[${currentRoom}] ${userRole} connected.`);
                return;
            }
        }

        if (currentRoom && rooms[currentRoom]) {
            const targetRole = userRole === 'TECH' ? 'CLIENT' : 'TECH';
            const targetWs = rooms[currentRoom][targetRole];

            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(message, { binary: isBinary });
            }
        }
    });

    ws.on('close', () => {
        if (currentRoom && rooms[currentRoom]) {
            delete rooms[currentRoom][userRole];
            if (Object.keys(rooms[currentRoom]).length === 0) {
                delete rooms[currentRoom];
            }
            console.log(`[${currentRoom}] ${userRole} disconnected.`);
        }
    });
});
