const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Almacén de salas en memoria
const rooms = new Map();

// Configuración del tablero (28 casillas) - Orden correcto
const boardSpaces = [
    // Lado inferior (8 casillas)
    { id: 0, name: 'Inicio', type: 'start', price: 0, reward: 1000 },
    { id: 1, name: 'Soporte', type: 'property', price: 2000, rent: 300, category: 'ligera' },
    { id: 2, name: 'Redes', type: 'property', price: 3000, rent: 600, category: 'media' },
    { id: 3, name: 'Abre un Email', type: 'card', price: 0, cardType: 'chusca' },
    { id: 4, name: 'Ciber Seguridad', type: 'property', price: 3500, rent: 700, category: 'media' },
    { id: 5, name: 'Site 1', type: 'property', price: 4000, rent: 'special', category: 'site' },
    { id: 6, name: 'Abre un Email', type: 'card', price: 0, cardType: 'chusca' },
    { id: 7, name: 'Detención 1', type: 'jail', price: 0 },
    
    // Lado derecho (7 casillas)
    { id: 8, name: 'SAP', type: 'property', price: 4000, rent: 800, category: 'media' },
    { id: 9, name: 'Back Office', type: 'property', price: 5000, rent: 1000, category: 'pesada' },
    { id: 10, name: 'Abre un Email', type: 'card', price: 0, cardType: 'retrospectiva' },
    { id: 11, name: 'QA', type: 'property', price: 3500, rent: 700, category: 'media' },
    { id: 12, name: 'Site 2', type: 'property', price: 4000, rent: 'special', category: 'site' },
    { id: 13, name: 'Abre un Email', type: 'card', price: 0, cardType: 'retrospectiva' },
    { id: 14, name: 'Cafecito Zone', type: 'cafecito', price: 0, reward: 500 },
    
    // Lado superior (7 casillas)
    { id: 15, name: 'Atención Clientes', type: 'property', price: 2000, rent: 300, category: 'ligera' },
    { id: 16, name: 'Documentación', type: 'property', price: 3000, rent: 600, category: 'media' },
    { id: 17, name: 'Abre un Email', type: 'card', price: 0, cardType: 'chusca' },
    { id: 18, name: 'UX/UI', type: 'property', price: 3500, rent: 700, category: 'media' },
    { id: 19, name: 'Site 3', type: 'property', price: 4000, rent: 'special', category: 'site' },
    { id: 20, name: 'Abre un Email', type: 'card', price: 0, cardType: 'chusca' },
    { id: 21, name: 'Detención 2', type: 'jail', price: 0 },
    
    // Lado izquierdo (6 casillas)
    { id: 22, name: 'Automatización', type: 'property', price: 4000, rent: 800, category: 'media' },
    { id: 23, name: 'Innovación', type: 'property', price: 3000, rent: 600, category: 'media' },
    { id: 24, name: 'Abre un Email', type: 'card', price: 0, cardType: 'dinamica' },
    { id: 25, name: 'Comunicación', type: 'property', price: 3500, rent: 700, category: 'media' },
    { id: 26, name: 'Site 4', type: 'property', price: 4000, rent: 'special', category: 'site' },
    { id: 27, name: 'Abre un Email', type: 'card', price: 0, cardType: 'dinamica' }
];

// Cartas del juego
const retrospectiveCards = [
    '😡 Deploy infernal – Algo que te frustró en el sprint. Paga $500',
    '😡 Demasiados cambios – Algo que te quitó el foco. Paga $300',
    '😔 Sprint largo, moral corta – Algo que te desanimó. Pierdes 1 turno',
    '😔 Ticket fantasma – Pendiente que nadie quería. Paga $400',
    '😄 Triunfo silencioso – Logro personal que te enorgullece. Gana $800',
    '😄 Demo estelar – Algo que salió tan bien que te hizo sonreír. Gana $1000',
    '💡 Mini mejora – Propón una mejora grupal. Gana $500',
    '💡 Sinergia desbloqueada – Algo que deberíamos mantener. Gana $600',
    '🧠 Nuevo conocimiento – Algo que aprendiste. Gana $400',
    '💬 Palabras sabias – Da feedback positivo a alguien. Gana $700'
];

const chuscaCards = [
    '☕ Cafecito eterno – Pierdes 1 turno',
    '💻 Bug ancestral – Gana $1,000',
    '🔥 Incidente P1 – Todos pagan $500',
    '💬 Teams inapropiado – Paga $1,000 y ve a Detención',
    '💻 Script milagroso – Gana $1,500',
    '🧠 Documentación épica – Cobra $500',
    '☕ Sprint sin café – Paga $300',
    '😴 Reunión eterna – Pierdes 1 turno',
    '🧑🏫 Mentor inesperado – Gana $500',
    '💅 Presentación top – Gana $2,000',
    '🐢 Red lenta – Paga $500',
    '🧾 Ticket duplicado – Paga $300',
    '🎉 Cumpleaños en la oficina – Gana $200',
    '🧩 Innovación reconocida – Cobra $1,000',
    '💻 Commit fallido – Paga $800'
];

const dinamicaCards = [
    '🎁 Bono sorpresa – Gana $1,000',
    '💸 Auditoría interna – Paga $500',
    '🪙 Dado del destino – Si sale par, ganas $1,000; si sale impar, pagas $500',
    '💬 Votación rápida – El equipo elige al de mejor actitud, gana $1,000',
    '🕹️ Hack del sprint – Comparte un tip, gana $500'
];

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(hostName, socketId) {
    const roomCode = generateRoomCode();
    const room = {
        code: roomCode,
        players: [{
            id: socketId,
            name: hostName,
            position: 0,
            money: 15000,
            properties: [],
            isHost: true,
            color: '#FF6B6B',
            jailed: false
        }],
        gameState: 'waiting',
        currentPlayer: 0,
        board: boardSpaces
    };
    rooms.set(roomCode, room);
    return room;
}

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('createRoom', (playerName) => {
        const room = createRoom(playerName, socket.id);
        socket.join(room.code);
        socket.emit('roomCreated', { roomCode: room.code, room });
    });

    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('error', 'Sala no encontrada');
            return;
        }
        if (room.players.length >= 5) {
            socket.emit('error', 'Sala llena');
            return;
        }
        if (room.gameState !== 'waiting') {
            socket.emit('error', 'Juego ya iniciado');
            return;
        }

        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const player = {
            id: socket.id,
            name: playerName,
            position: 0,
            money: 15000,
            properties: [],
            isHost: false,
            color: colors[room.players.length],
            jailed: false
        };

        room.players.push(player);
        socket.join(roomCode);
        
        // Enviar confirmación al jugador que se unió
        socket.emit('joinedRoom', { room });
        // Notificar a todos los demás
        io.to(roomCode).emit('playerJoined', { room });
    });

    socket.on('startGame', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room || room.players.length < 2) {
            socket.emit('error', 'Se necesitan al menos 2 jugadores');
            return;
        }
        
        const host = room.players.find(p => p.isHost);
        if (!host || host.id !== socket.id) {
            socket.emit('error', 'Solo el host puede iniciar el juego');
            return;
        }

        room.gameState = 'playing';
        io.to(roomCode).emit('gameStarted', { room });
    });

    socket.on('rollDice', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room || room.gameState !== 'playing') return;

        const currentPlayer = room.players[room.currentPlayer];
        if (currentPlayer.id !== socket.id) return;

        // Verificar si está en detención
        if (currentPlayer.jailed) {
            currentPlayer.jailed = false;
            room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
            io.to(roomCode).emit('diceRolled', { 
                dice1: 0, dice2: 0, total: 0, 
                player: currentPlayer, 
                space: null,
                message: `${currentPlayer.name} está en detención y pierde su turno`,
                room 
            });
            return;
        }

        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;

        const oldPosition = currentPlayer.position;
        currentPlayer.position = (currentPlayer.position + total) % boardSpaces.length;
        
        // Pasar por Inicio
        if (oldPosition + total >= boardSpaces.length) {
            currentPlayer.money += 3000;
        }

        const currentSpace = boardSpaces[currentPlayer.position];
        let message = `${currentPlayer.name} sacó ${dice1} + ${dice2} = ${total}`;

        // Lógica de casillas
        if (currentSpace.type === 'property') {
            const owner = room.players.find(p => p.properties.includes(currentSpace.id));
            if (!owner) {
                message += `. Puede comprar ${currentSpace.name} por $${currentSpace.price}`;
            } else if (owner.id !== currentPlayer.id) {
                let rentAmount = currentSpace.rent;
                if (currentSpace.category === 'site') {
                    // Sites: 500 × dado × sites que posee
                    const sitesOwned = owner.properties.filter(propId => {
                        const prop = boardSpaces.find(s => s.id === propId);
                        return prop && prop.category === 'site';
                    }).length;
                    rentAmount = 500 * total * sitesOwned;
                }
                currentPlayer.money -= rentAmount;
                owner.money += rentAmount;
                message += `. Paga $${rentAmount} a ${owner.name}`;
            }
        } else if (currentSpace.type === 'card') {
            let cards, cardName;
            if (currentSpace.cardType === 'retrospectiva') {
                cards = retrospectiveCards;
                cardName = 'Retrospectiva';
            } else if (currentSpace.cardType === 'chusca') {
                cards = chuscaCards;
                cardName = 'Chusca';
            } else {
                cards = dinamicaCards;
                cardName = 'Dinámica';
            }
            const card = cards[Math.floor(Math.random() * cards.length)];
            
            // Procesar efectos de las cartas
            if (card.includes('Gana $')) {
                const amount = parseInt(card.match(/Gana \$([\d,]+)/)[1].replace(',', ''));
                currentPlayer.money += amount;
            } else if (card.includes('Paga $')) {
                const amount = parseInt(card.match(/Paga \$([\d,]+)/)[1].replace(',', ''));
                currentPlayer.money -= amount;
            } else if (card.includes('Cobra $')) {
                const amount = parseInt(card.match(/Cobra \$([\d,]+)/)[1].replace(',', ''));
                currentPlayer.money += amount;
            } else if (card.includes('Pierdes 1 turno')) {
                currentPlayer.jailed = true;
            } else if (card.includes('ve a Detención')) {
                currentPlayer.jailed = true;
                const amount = parseInt(card.match(/Paga \$([\d,]+)/)[1].replace(',', ''));
                currentPlayer.money -= amount;
            } else if (card.includes('Todos pagan $')) {
                const amount = parseInt(card.match(/Todos pagan \$([\d,]+)/)[1].replace(',', ''));
                room.players.forEach(p => {
                    if (p.id !== currentPlayer.id) {
                        p.money -= amount;
                        currentPlayer.money += amount;
                    }
                });
            }
            
            message += `. Carta ${cardName}: ${card}`;
        } else if (currentSpace.type === 'start') {
            message += `. ¡Pasaste por Inicio! +$3000`;
        } else if (currentSpace.type === 'cafecito') {
            currentPlayer.money += 500;
            message += `. ¡Cafecito! +$500`;
        } else if (currentSpace.type === 'jail') {
            message += `. ¡Detención! Pierdes el siguiente turno`;
            currentPlayer.jailed = true;
        }

        // Siguiente turno
        room.currentPlayer = (room.currentPlayer + 1) % room.players.length;

        io.to(roomCode).emit('diceRolled', { 
            dice1, dice2, total, 
            player: currentPlayer, 
            space: currentSpace,
            message,
            room 
        });
    });

    socket.on('buyProperty', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        const currentSpace = boardSpaces[player.position];

        if (currentSpace.type === 'property' && player.money >= currentSpace.price) {
            player.money -= currentSpace.price;
            player.properties.push(currentSpace.id);
            
            io.to(roomCode).emit('propertyBought', { 
                player, 
                property: currentSpace,
                room 
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        // Limpiar jugador de las salas
        for (const [code, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    rooms.delete(code);
                } else {
                    io.to(code).emit('playerLeft', { room });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});