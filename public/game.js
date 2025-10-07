class MonopolyGame {
    constructor() {
        this.socket = io();
        this.currentRoom = null;
        this.currentPlayer = null;
        this.gameState = 'home';
        
        this.initializeElements();
        this.bindEvents();
        this.setupSocketListeners();
    }

    initializeElements() {
        // Pantallas
        this.homeScreen = document.getElementById('homeScreen');
        this.lobbyScreen = document.getElementById('lobbyScreen');
        this.gameScreen = document.getElementById('gameScreen');
        
        // Elementos de inicio
        this.playerNameInput = document.getElementById('playerName');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.joinRoomForm = document.getElementById('joinRoomForm');
        this.roomCodeInput = document.getElementById('roomCode');
        this.joinBtn = document.getElementById('joinBtn');
        
        // Elementos de lobby
        this.roomCodeDisplay = document.getElementById('roomCodeDisplay');
        this.playersList = document.getElementById('playersList');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        
        // Elementos de juego
        this.gameBoard = document.getElementById('gameBoard');
        this.currentPlayerInfo = document.getElementById('currentPlayerInfo');
        this.rollDiceBtn = document.getElementById('rollDiceBtn');
        this.diceResult = document.getElementById('diceResult');
        this.buyPropertyBtn = document.getElementById('buyPropertyBtn');
        this.gamePlayersList = document.getElementById('gamePlayersList');
        this.gameMessages = document.getElementById('gameMessages');
        
        // Modal
        this.spaceModal = document.getElementById('spaceModal');
        this.closeModal = document.querySelector('.close-modal');
        this.modalSpaceName = document.getElementById('modalSpaceName');
        this.modalSpaceDetails = document.getElementById('modalSpaceDetails');
        this.modalSpaceOwner = document.getElementById('modalSpaceOwner');
        this.modalSpaceImage = document.querySelector('.modal-space-image');
        
        // Debug
        console.log('Botón de dados encontrado:', this.rollDiceBtn);
    }

    bindEvents() {
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.showJoinForm());
        this.joinBtn.addEventListener('click', () => this.joinRoom());
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        
        // Event listener para dados con debug
        this.rollDiceBtn.addEventListener('click', (e) => {
            console.log('Click detectado en botón de dados');
            e.preventDefault();
            this.rollDice();
        });
        
        this.buyPropertyBtn.addEventListener('click', () => this.buyProperty());
        
        // Modal events
        this.closeModal.addEventListener('click', () => this.hideSpaceModal());
        this.spaceModal.addEventListener('click', (e) => {
            if (e.target === this.spaceModal) this.hideSpaceModal();
        });
        
        // Enter key handlers
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });
        this.roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
    }

    setupSocketListeners() {
        this.socket.on('roomCreated', (data) => {
            this.currentRoom = data.room;
            this.currentPlayer = data.room.players[0];
            this.showLobby();
        });

        this.socket.on('joinedRoom', (data) => {
            this.currentRoom = data.room;
            this.currentPlayer = data.room.players.find(p => p.id === this.socket.id);
            this.showLobby();
        });

        this.socket.on('playerJoined', (data) => {
            this.currentRoom = data.room;
            this.updatePlayersList();
            if (this.gameState === 'game') {
                this.updateGamePlayers();
            }
        });

        this.socket.on('gameStarted', (data) => {
            this.currentRoom = data.room;
            this.showGame();
        });

        this.socket.on('diceRolled', (data) => {
            this.currentRoom = data.room;
            this.updateGameState(data);
            const isImportant = data.message.includes('Carta') || data.message.includes('Cafecito') || data.message.includes('Detención');
            this.addGameMessage(data.message, isImportant);
        });

        this.socket.on('propertyBought', (data) => {
            this.currentRoom = data.room;
            this.updateGamePlayers();
            this.addGameMessage(`🏠 ${data.player.name} compró ${data.property.name} por $${data.property.price}`, true);
            this.buyPropertyBtn.classList.add('hidden');
        });

        this.socket.on('playerLeft', (data) => {
            this.currentRoom = data.room;
            this.updatePlayersList();
            this.updateGamePlayers();
        });

        this.socket.on('error', (message) => {
            alert(message);
        });
    }

    createRoom() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            alert('Ingresa tu nombre');
            return;
        }
        this.socket.emit('createRoom', playerName);
    }

    showJoinForm() {
        this.joinRoomForm.classList.remove('hidden');
        this.roomCodeInput.focus();
    }

    joinRoom() {
        const playerName = this.playerNameInput.value.trim();
        const roomCode = this.roomCodeInput.value.trim().toUpperCase();
        
        if (!playerName || !roomCode) {
            alert('Completa todos los campos');
            return;
        }
        
        this.socket.emit('joinRoom', { roomCode, playerName });
    }

    startGame() {
        this.socket.emit('startGame', this.currentRoom.code);
    }

    leaveRoom() {
        this.showHome();
        this.currentRoom = null;
        this.currentPlayer = null;
    }

    rollDice() {
        console.log('Lanzando dados...');
        this.rollDiceBtn.disabled = true;
        this.rollDiceBtn.textContent = '🎲 Lanzando...';
        this.socket.emit('rollDice', this.currentRoom.code);
    }

    buyProperty() {
        this.socket.emit('buyProperty', this.currentRoom.code);
    }

    showHome() {
        this.gameState = 'home';
        this.homeScreen.classList.add('active');
        this.lobbyScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');
        this.joinRoomForm.classList.add('hidden');
        this.playerNameInput.value = '';
        this.roomCodeInput.value = '';
    }

    showLobby() {
        this.gameState = 'lobby';
        this.homeScreen.classList.remove('active');
        this.lobbyScreen.classList.add('active');
        this.gameScreen.classList.remove('active');
        
        this.roomCodeDisplay.textContent = this.currentRoom.code;
        this.updatePlayersList();
    }

    showGame() {
        this.gameState = 'game';
        this.homeScreen.classList.remove('active');
        this.lobbyScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        
        this.createBoard();
        this.updatePlayerPositions(); // Sin animación inicial
        this.updateGamePlayers();
        this.updateCurrentPlayer();
        
        // Asegurar que el botón esté habilitado para el primer jugador
        this.rollDiceBtn.disabled = false;
        this.rollDiceBtn.textContent = '🎲 Lanzar Dados';
    }

    updatePlayersList() {
        this.playersList.innerHTML = '';
        this.currentRoom.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <div class="player-color" style="background-color: ${player.color}"></div>
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
            `;
            this.playersList.appendChild(playerDiv);
        });
        
        // Mostrar botón de iniciar solo si es host y hay al menos 2 jugadores
        if (this.currentPlayer && this.currentPlayer.isHost && this.currentRoom.players.length >= 2) {
            this.startGameBtn.classList.remove('hidden');
        } else {
            this.startGameBtn.classList.add('hidden');
        }
    }

    createBoard() {
        // Limpiar tablero existente
        const existingSpaces = this.gameBoard.querySelectorAll('.board-space');
        existingSpaces.forEach(space => space.remove());
        
        // Crear espacios del tablero
        const spacesContainer = document.createElement('div');
        spacesContainer.className = 'board-spaces';
        
        this.currentRoom.board.forEach((space, index) => {
            const spaceDiv = document.createElement('div');
            spaceDiv.className = `board-space space-${index} ${space.type}`;
            spaceDiv.innerHTML = `
                <div class="space-name">${space.name}</div>
                ${space.price > 0 ? `<div class="space-price">$${space.price}</div>` : ''}
            `;
            
            // Agregar click para modal
            spaceDiv.addEventListener('click', () => this.showSpaceModal(space, index));
            
            spacesContainer.appendChild(spaceDiv);
        });
        
        this.gameBoard.appendChild(spacesContainer);
    }

    updatePlayerPositions(animatePlayer = null) {
        // Remover piezas existentes
        const existingPieces = this.gameBoard.querySelectorAll('.player-piece');
        existingPieces.forEach(piece => piece.remove());
        
        // Crear nuevas piezas
        this.currentRoom.players.forEach((player, playerIndex) => {
            const piece = document.createElement('div');
            piece.className = 'player-piece';
            piece.style.backgroundColor = player.color;
            piece.setAttribute('data-initial', player.name.charAt(0).toUpperCase());
            piece.title = player.name;
            
            // Agregar animación si es el jugador que se movió
            if (animatePlayer && animatePlayer.id === player.id) {
                piece.classList.add('moving');
                setTimeout(() => piece.classList.remove('moving'), 600);
            }
            
            const spaceElement = this.gameBoard.querySelector(`.space-${player.position}`);
            if (spaceElement) {
                const rect = spaceElement.getBoundingClientRect();
                const boardRect = this.gameBoard.getBoundingClientRect();
                
                // Posicionar múltiples jugadores en la misma casilla
                const playersInSameSpace = this.currentRoom.players.filter(p => p.position === player.position);
                const indexInSpace = playersInSameSpace.findIndex(p => p.id === player.id);
                
                const offsetX = (indexInSpace % 2) * 15;
                const offsetY = Math.floor(indexInSpace / 2) * 15;
                
                piece.style.left = `${rect.left - boardRect.left + 25 + offsetX}px`;
                piece.style.top = `${rect.top - boardRect.top + 25 + offsetY}px`;
            }
            
            this.gameBoard.appendChild(piece);
        });
    }

    updateGamePlayers() {
        this.gamePlayersList.innerHTML = '';
        this.currentRoom.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `game-player-item ${index === this.currentRoom.currentPlayer ? 'current' : ''}`;
            playerDiv.style.borderLeftColor = player.color;
            
            const jailedStatus = player.jailed ? ' 🚫' : '';
            
            playerDiv.innerHTML = `
                <div class="player-avatar" style="background-color: ${player.color}">
                    ${player.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <div class="player-name">${player.name}${jailedStatus}</div>
                    <div style="font-size: 0.8rem; color: #666;">
                        🏠 ${player.properties.length} propiedades
                    </div>
                </div>
                <div class="player-money">$${player.money.toLocaleString()}</div>
            `;
            this.gamePlayersList.appendChild(playerDiv);
        });
    }

    updateCurrentPlayer() {
        const currentPlayer = this.currentRoom.players[this.currentRoom.currentPlayer];
        this.currentPlayerInfo.innerHTML = `
            <h3>Turno de: ${currentPlayer.name}</h3>
            <p style="color: ${currentPlayer.color};">●</p>
        `;
        
        // Mostrar/ocultar botón de dados
        if (currentPlayer.id === this.socket.id) {
            this.rollDiceBtn.classList.remove('hidden');
            this.rollDiceBtn.disabled = false;
        } else {
            this.rollDiceBtn.classList.add('hidden');
        }
        
        // Ocultar botón de compra
        this.buyPropertyBtn.classList.add('hidden');
    }

    updateGameState(data) {
        // Animar al jugador que se movió
        this.updatePlayerPositions(data.player);
        this.updateGamePlayers();
        this.updateCurrentPlayer();
        
        // Restaurar botón de dados
        this.rollDiceBtn.textContent = '🎲 Lanzar Dados';
        
        if (data.total > 0) {
            this.diceResult.innerHTML = `🎲 ${data.dice1} + ${data.dice2} = ${data.total}`;
        } else {
            this.diceResult.innerHTML = '🚫 Turno perdido';
        }
        
        // Mostrar botón de compra si es aplicable
        const currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
        if (currentPlayer && data.player.id === this.socket.id) {
            const currentSpace = this.currentRoom.board[currentPlayer.position];
            if (currentSpace.type === 'property' && 
                currentPlayer.money >= currentSpace.price &&
                !this.currentRoom.players.some(p => p.properties.includes(currentSpace.id))) {
                this.buyPropertyBtn.classList.remove('hidden');
            } else {
                this.buyPropertyBtn.classList.add('hidden');
            }
        }
    }

    addGameMessage(message, highlight = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message ${highlight ? 'highlight' : ''}`;
        
        // Agregar timestamp
        const time = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span>${message}</span>
                <small style="color: #666; font-size: 0.7rem;">${time}</small>
            </div>
        `;
        
        this.gameMessages.appendChild(messageDiv);
        this.gameMessages.scrollTop = this.gameMessages.scrollHeight;
        
        // Limitar mensajes a 50
        const messages = this.gameMessages.children;
        if (messages.length > 50) {
            messages[0].remove();
        }
    }
    
    showSpaceModal(space, index) {
        this.modalSpaceName.textContent = space.name;
        this.modalSpaceImage.style.backgroundImage = `url('Assets/${index + 1}.png')`;
        
        let details = '';
        if (space.type === 'property') {
            details = `
                <p><strong>💰 Precio:</strong> $${space.price}</p>
                <p><strong>🏠 Renta:</strong> $${space.rent === 'special' ? 'Especial (500 × dado × sites)' : space.rent}</p>
                <p><strong>🏷️ Categoría:</strong> ${space.category}</p>
            `;
        } else if (space.type === 'card') {
            details = `<p><strong>📧 Tipo:</strong> Carta ${space.cardType}</p>`;
        } else if (space.type === 'start') {
            details = `<p><strong>🎆 Recompensa:</strong> $${space.reward} al pasar</p>`;
        } else if (space.type === 'cafecito') {
            details = `<p><strong>☕ Recompensa:</strong> $${space.reward}</p>`;
        } else if (space.type === 'jail') {
            details = `<p><strong>🚫 Efecto:</strong> Pierdes 1 turno</p>`;
        }
        
        this.modalSpaceDetails.innerHTML = details;
        
        // Verificar propietario
        if (space.type === 'property') {
            const owner = this.currentRoom.players.find(p => p.properties.includes(index));
            if (owner) {
                this.modalSpaceOwner.className = 'modal-space-owner owned';
                this.modalSpaceOwner.innerHTML = `👤 Propietario: <span style="color: ${owner.color}">${owner.name}</span>`;
            } else {
                this.modalSpaceOwner.className = 'modal-space-owner available';
                this.modalSpaceOwner.textContent = '✅ Disponible para comprar';
            }
        } else {
            this.modalSpaceOwner.textContent = '';
        }
        
        this.spaceModal.classList.remove('hidden');
    }
    
    hideSpaceModal() {
        this.spaceModal.classList.add('hidden');
    }
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MonopolyGame();
    console.log('Juego inicializado');
});