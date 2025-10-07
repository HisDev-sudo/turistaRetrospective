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
            mortgaged: [],
            isHost: true,
            color: '#FF6B6B',
            jailed: false,
            eliminated: false
        }],
        gameState: 'waiting',
        currentPlayer: 0,
        board: boardSpaces,
        turnCount: 0,
        individualTurnCount: 0, // Contador individual de turnos
        mortgageQueue: [], // {propertyId, ownerId, turnMortgaged}
        activeAuctionTimer: null, // Referencia al timer activo
        turnState: 'waiting_dice', // 'waiting_dice', 'waiting_purchase_decision', 'turn_complete'
        pendingPurchase: null // {playerId, propertyId}
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
            mortgaged: [],
            isHost: false,
            color: colors[room.players.length],
            jailed: false,
            eliminated: false
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
        if (!room || room.gameState !== 'playing' || room.turnState !== 'waiting_dice') return;

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
                
                // Verificar bancarrota después del pago
                if (currentPlayer.money < 0) {
                    handleBankruptcy(room, currentPlayer);
                }
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
                if (currentPlayer.money < 0) {
                    handleBankruptcy(room, currentPlayer);
                }
            } else if (card.includes('Cobra $')) {
                const amount = parseInt(card.match(/Cobra \$([\d,]+)/)[1].replace(',', ''));
                currentPlayer.money += amount;
            } else if (card.includes('Pierdes 1 turno')) {
                currentPlayer.jailed = true;
            } else if (card.includes('ve a Detención')) {
                currentPlayer.jailed = true;
                const amount = parseInt(card.match(/Paga \$([\d,]+)/)[1].replace(',', ''));
                currentPlayer.money -= amount;
                if (currentPlayer.money < 0) {
                    handleBankruptcy(room, currentPlayer);
                }
            } else if (card.includes('Todos pagan $')) {
                const amount = parseInt(card.match(/Todos pagan \$([\d,]+)/)[1].replace(',', ''));
                room.players.forEach(p => {
                    if (p.id !== currentPlayer.id) {
                        p.money -= amount;
                        currentPlayer.money += amount;
                        if (p.money < 0) {
                            handleBankruptcy(room, p);
                        }
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

        // Verificar si puede comprar propiedad
        if (currentSpace.type === 'property') {
            const owner = room.players.find(p => p.properties.includes(currentSpace.id));
            if (!owner && currentPlayer.money >= currentSpace.price) {
                // Esperar decisión de compra
                room.turnState = 'waiting_purchase_decision';
                room.pendingPurchase = {
                    playerId: currentPlayer.id,
                    propertyId: currentSpace.id
                };
            } else {
                // No puede comprar, continuar turno
                completeTurn(room);
            }
        } else {
            // No es propiedad, continuar turno
            completeTurn(room);
        }

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
        if (!room || room.gameState !== 'playing' || room.turnState !== 'waiting_purchase_decision') return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player || !room.pendingPurchase || room.pendingPurchase.playerId !== player.id) return;
        
        const currentSpace = boardSpaces[room.pendingPurchase.propertyId];
        
        // Verificar que tenga dinero suficiente y no tenga dueño
        if (player.money >= currentSpace.price &&
            !room.players.some(p => p.properties.includes(currentSpace.id))) {
            
            player.money -= currentSpace.price;
            player.properties.push(currentSpace.id);
            
            io.to(roomCode).emit('propertyBought', { 
                player, 
                property: currentSpace,
                room 
            });
        }
        
        // Completar turno después de la compra
        completeTurn(room);
    });
    
    socket.on('skipProperty', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room || room.gameState !== 'playing' || room.turnState !== 'waiting_purchase_decision') return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player || !room.pendingPurchase || room.pendingPurchase.playerId !== player.id) return;
        
        // Completar turno sin comprar
        completeTurn(room);
    });
    
    socket.on('placeBid', ({ roomCode, amount }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.currentAuction || room.gameState !== 'playing') {
            socket.emit('error', 'Subasta no disponible');
            return;
        }
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.eliminated) {
            socket.emit('error', 'Jugador no válido');
            return;
        }
        
        // Validar que no sea el propietario original
        if (player.id === room.currentAuction.originalOwner) {
            socket.emit('error', 'No puedes ofertar por tu propia propiedad');
            return;
        }
        
        // Validar monto
        const minBid = room.currentAuction.currentBid + 100;
        if (!amount || isNaN(amount) || amount < minBid) {
            socket.emit('error', `La oferta mínima es $${minBid}`);
            return;
        }
        
        if (player.money < amount) {
            socket.emit('error', 'Dinero insuficiente');
            return;
        }
        
        // Validar que la subasta siga activa
        if (room.currentAuction.timeLeft <= 0) {
            socket.emit('error', 'Subasta finalizada');
            return;
        }
        
        room.currentAuction.currentBid = amount;
        room.currentAuction.highestBidder = socket.id;
        
        io.to(roomCode).emit('newBid', {
            bidder: player.name,
            amount: amount,
            auction: room.currentAuction
        });
    });
    
    socket.on('mortgageProperties', ({ roomCode, properties }) => {
        const room = rooms.get(roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        
        let totalValue = 0;
        properties.forEach(propId => {
            if (player.properties.includes(propId) && !player.mortgaged.includes(propId)) {
                const property = boardSpaces[propId];
                const mortgageValue = Math.floor(property.price / 2);
                totalValue += mortgageValue;
                player.mortgaged.push(propId);
                
                // Agregar a la cola de subastas (3 turnos individuales después)
                room.mortgageQueue.push({
                    propertyId: propId,
                    ownerId: player.id,
                    turnMortgaged: room.individualTurnCount,
                    auctionTurn: room.individualTurnCount + 3
                });
            }
        });
        
        player.money += totalValue;
        
        io.to(roomCode).emit('propertiesMortgaged', {
            player,
            properties,
            amount: totalValue,
            room
        });
    });
    
    function handleBankruptcy(room, player) {
        if (player.money < 0) {
            const availableProperties = player.properties.filter(propId => 
                !player.mortgaged.includes(propId)
            );
            
            if (availableProperties.length > 0) {
                // Hipotecar automáticamente todas las propiedades disponibles
                let totalMortgageValue = 0;
                availableProperties.forEach(propId => {
                    const property = boardSpaces[propId];
                    const mortgageValue = Math.floor(property.price / 2);
                    totalMortgageValue += mortgageValue;
                    player.mortgaged.push(propId);
                    
                    // Agregar a la cola de subastas (3 turnos individuales después)
                    room.mortgageQueue.push({
                        propertyId: propId,
                        ownerId: player.id,
                        turnMortgaged: room.individualTurnCount,
                        auctionTurn: room.individualTurnCount + 3
                    });
                });
                
                player.money += totalMortgageValue;
                
                io.to(room.code).emit('autoMortgage', {
                    player: player.name,
                    properties: availableProperties,
                    amount: totalMortgageValue,
                    message: `${player.name} hipotecó automáticamente ${availableProperties.length} propiedades por $${totalMortgageValue}`,
                    room
                });
                
                // Si aún está en negativo después de hipotecar todo
                if (player.money < 0) {
                    eliminatePlayer(room, player);
                }
            } else {
                // No tiene propiedades para hipotecar - eliminación
                eliminatePlayer(room, player);
            }
        }
    }
    
    function eliminatePlayer(room, player) {
        // Liberar todas las propiedades al banco
        player.properties = [];
        player.mortgaged = [];
        player.money = 0;
        player.eliminated = true;
        
        io.to(room.code).emit('playerEliminated', {
            player: player.name,
            message: `💸 ${player.name} ha sido eliminado por bancarrota`,
            room
        });
        
        // Verificar si solo queda un jugador
        const activePlayers = room.players.filter(p => !p.eliminated);
        if (activePlayers.length === 1) {
            io.to(room.code).emit('gameWon', {
                winner: activePlayers[0].name,
                message: `🏆 ¡${activePlayers[0].name} ha ganado el juego!`,
                room
            });
        }
    }
    
    function completeTurn(room) {
        // Incrementar contador individual de turnos
        room.individualTurnCount++;
        
        // Limpiar estado de turno
        room.turnState = 'waiting_dice';
        room.pendingPurchase = null;
        
        // Siguiente turno - saltar jugadores eliminados
        do {
            room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
        } while (room.players[room.currentPlayer].eliminated);
        
        // Incrementar contador de rondas cuando vuelve al primer jugador
        if (room.currentPlayer === 0) {
            room.turnCount++;
        }
        
        // Verificar subastas después de cada turno individual
        checkAuctions(room);
        
        // Notificar cambio de turno
        io.to(room.code).emit('turnCompleted', { room });
    }
    
    function checkAuctions(room) {
        if (!room || room.gameState !== 'playing') return;
        
        const currentTurn = room.individualTurnCount;
        const auctionsToProcess = room.mortgageQueue.filter(item => 
            item.auctionTurn <= currentTurn
        );
        
        auctionsToProcess.forEach(auction => {
            startAuction(room, auction);
        });
        
        // Remover subastas procesadas
        room.mortgageQueue = room.mortgageQueue.filter(item => 
            item.auctionTurn > currentTurn
        );
    }
    
    function startAuction(room, auction) {
        // Validar que la sala y el juego sigan activos
        if (!room || room.gameState !== 'playing' || room.currentAuction) {
            return; // Ya hay una subasta activa o el juego no está en curso
        }
        
        const property = boardSpaces[auction.propertyId];
        const owner = room.players.find(p => p.id === auction.ownerId);
        
        if (!owner || !owner.mortgaged.includes(auction.propertyId)) {
            return; // Propiedad ya no está hipotecada
        }
        
        const startingBid = Math.floor(property.price * 0.6); // 60% del precio original
        
        room.currentAuction = {
            propertyId: auction.propertyId,
            propertyName: property.name,
            currentBid: startingBid,
            highestBidder: null,
            participants: room.players.filter(p => p.id !== auction.ownerId && !p.eliminated),
            timeLeft: 60, // 60 segundos
            originalOwner: auction.ownerId
        };
        
        io.to(room.code).emit('auctionStarted', {
            auction: room.currentAuction,
            message: `🔨 Subasta iniciada: ${property.name} - Oferta inicial: $${startingBid}`,
            room
        });
        
        // Limpiar timer anterior si existe
        if (room.activeAuctionTimer) {
            clearInterval(room.activeAuctionTimer);
        }
        
        // Timer de subasta con validaciones
        room.activeAuctionTimer = setInterval(() => {
            // Validar que la sala y subasta sigan existiendo
            if (!room || !room.currentAuction || room.gameState !== 'playing') {
                clearInterval(room.activeAuctionTimer);
                room.activeAuctionTimer = null;
                return;
            }
            
            room.currentAuction.timeLeft--;
            
            if (room.currentAuction.timeLeft <= 0) {
                clearInterval(room.activeAuctionTimer);
                room.activeAuctionTimer = null;
                endAuction(room);
            } else {
                io.to(room.code).emit('auctionUpdate', {
                    timeLeft: room.currentAuction.timeLeft
                });
            }
        }, 1000);
    }
    
    function endAuction(room) {
        // Validar que la sala y subasta sigan existiendo
        if (!room || !room.currentAuction || room.gameState !== 'playing') {
            return;
        }
        
        const auction = room.currentAuction;
        const property = boardSpaces[auction.propertyId];
        const originalOwner = room.players.find(p => p.id === auction.originalOwner);
        
        // Validar que el propietario original siga en el juego
        if (!originalOwner) {
            room.currentAuction = null;
            return;
        }
        
        if (auction.highestBidder) {
            const winner = room.players.find(p => p.id === auction.highestBidder);
            
            // Validar que el ganador siga en el juego y tenga dinero suficiente
            if (winner && !winner.eliminated && winner.money >= auction.currentBid) {
                // Transferir propiedad
                originalOwner.properties = originalOwner.properties.filter(id => id !== auction.propertyId);
                originalOwner.mortgaged = originalOwner.mortgaged.filter(id => id !== auction.propertyId);
                winner.properties.push(auction.propertyId);
                
                // Transferir dinero
                winner.money -= auction.currentBid;
                originalOwner.money += auction.currentBid;
                
                io.to(room.code).emit('auctionEnded', {
                    winner: winner.name,
                    property: property.name,
                    amount: auction.currentBid,
                    message: `🎉 ${winner.name} ganó la subasta de ${property.name} por $${auction.currentBid}`,
                    room
                });
            } else {
                // El ganador ya no puede pagar - propiedad vuelve al banco
                originalOwner.properties = originalOwner.properties.filter(id => id !== auction.propertyId);
                originalOwner.mortgaged = originalOwner.mortgaged.filter(id => id !== auction.propertyId);
                
                io.to(room.code).emit('auctionEnded', {
                    winner: null,
                    property: property.name,
                    amount: 0,
                    message: `📋 ${property.name} vuelve al banco - el ganador no pudo pagar`,
                    room
                });
            }
        } else {
            // Sin ofertas - la propiedad vuelve al banco
            originalOwner.properties = originalOwner.properties.filter(id => id !== auction.propertyId);
            originalOwner.mortgaged = originalOwner.mortgaged.filter(id => id !== auction.propertyId);
            
            io.to(room.code).emit('auctionEnded', {
                winner: null,
                property: property.name,
                amount: 0,
                message: `📋 ${property.name} vuelve al banco por falta de ofertas`,
                room
            });
        }
        
        room.currentAuction = null;
    }

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        // Limpiar jugador de las salas
        for (const [code, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                // Limpiar timer de subasta si el jugador desconectado tenía una activa
                if (room.activeAuctionTimer && room.currentAuction) {
                    clearInterval(room.activeAuctionTimer);
                    room.activeAuctionTimer = null;
                    room.currentAuction = null;
                    io.to(code).emit('auctionCancelled', {
                        message: 'Subasta cancelada por desconexión de jugador'
                    });
                }
                
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    // Limpiar timer antes de eliminar la sala
                    if (room.activeAuctionTimer) {
                        clearInterval(room.activeAuctionTimer);
                    }
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
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en ${HOST}:${PORT}`);
    console.log(`🎮 Monopoly Corporativo listo para jugar!`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
});