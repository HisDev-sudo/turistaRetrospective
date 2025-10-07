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
        this.skipPropertyBtn = document.getElementById('skipPropertyBtn');
        this.propertyActions = document.getElementById('propertyActions');
        this.gamePlayersList = document.getElementById('gamePlayersList');
        this.gameMessages = document.getElementById('gameMessages');
        
        // Modal
        this.spaceModal = document.getElementById('spaceModal');
        this.closeModal = document.querySelector('.close-modal');
        this.modalSpaceName = document.getElementById('modalSpaceName');
        this.modalSpaceDetails = document.getElementById('modalSpaceDetails');
        this.modalSpaceOwner = document.getElementById('modalSpaceOwner');
        this.modalSpaceImage = document.querySelector('.modal-space-image');
        
        // Pestañas
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanels = document.querySelectorAll('.tab-panel');
        this.myProperties = document.getElementById('myProperties');
        
        // Modal de hipoteca
        this.mortgageModal = document.getElementById('mortgageModal');
        this.mortgageProperties = document.getElementById('mortgageProperties');
        this.neededAmount = document.getElementById('neededAmount');
        this.mortgageAmount = document.getElementById('mortgageAmount');
        this.confirmMortgage = document.getElementById('confirmMortgage');
        this.selectedMortgages = [];
        
        // Modal de subasta
        this.auctionModal = document.getElementById('auctionModal');
        this.auctionProperty = document.getElementById('auctionProperty');
        this.currentBid = document.getElementById('currentBid');
        this.highestBidder = document.getElementById('highestBidder');
        this.timeLeft = document.getElementById('timeLeft');
        this.bidAmount = document.getElementById('bidAmount');
        this.placeBid = document.getElementById('placeBid');
        this.currentAuction = null;
        
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
        this.skipPropertyBtn.addEventListener('click', () => this.skipProperty());
        
        // Modal events
        this.closeModal.addEventListener('click', () => this.hideSpaceModal());
        this.spaceModal.addEventListener('click', (e) => {
            if (e.target === this.spaceModal) this.hideSpaceModal();
        });
        
        // Actualizar propiedades automáticamente
        this.updateMyProperties();
        
        // Mortgage events
        this.confirmMortgage.addEventListener('click', () => this.processMortgage());
        
        // Auction events
        this.placeBid.addEventListener('click', () => this.submitBid());
        this.bidAmount.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitBid();
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
            this.currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
            this.updateGameState(data);
            this.updateMyProperties();
            const isImportant = data.message.includes('Carta') || data.message.includes('Cafecito') || data.message.includes('Detención');
            this.addGameMessage(data.message, isImportant);
        });

        this.socket.on('propertyBought', (data) => {
            this.currentRoom = data.room;
            // Actualizar currentPlayer
            this.currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
            this.updateGamePlayers();
            this.updateMyProperties();
            this.addGameMessage(`🏠 ${data.player.name} compró ${data.property.name} por $${data.property.price}`, true);
        });
        
        this.socket.on('turnCompleted', (data) => {
            this.currentRoom = data.room;
            this.currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
            this.updateGamePlayers();
            this.updateCurrentPlayer();
            this.propertyActions.classList.add('hidden');
        });

        this.socket.on('playerLeft', (data) => {
            this.currentRoom = data.room;
            this.updatePlayersList();
            this.updateGamePlayers();
        });
        
        this.socket.on('needMortgage', (data) => {
            this.showMortgageModal(data.neededAmount);
        });
        
        this.socket.on('propertiesMortgaged', (data) => {
            this.currentRoom = data.room;
            this.currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
            this.updateGamePlayers();
            this.updateMyProperties();
            this.addGameMessage(`💰 ${data.player.name} hipotecó propiedades por $${data.amount}`, true);
        });
        
        this.socket.on('playerBankrupt', (data) => {
            this.addGameMessage(`💸 ${data.player} está en bancarrota y sale del juego`, true);
        });
        
        this.socket.on('auctionStarted', (data) => {
            this.currentAuction = data.auction;
            this.showAuctionModal();
            this.addGameMessage(data.message, true);
        });
        
        this.socket.on('newBid', (data) => {
            this.updateAuctionDisplay(data);
            this.addGameMessage(`💰 ${data.bidder} ofrece $${data.amount}`, true);
        });
        
        this.socket.on('auctionUpdate', (data) => {
            this.updateAuctionTimer(data.timeLeft);
        });
        
        this.socket.on('auctionEnded', (data) => {
            this.hideAuctionModal();
            this.currentRoom = data.room;
            this.currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
            this.updateGamePlayers();
            this.updateMyProperties();
            this.addGameMessage(data.message, true);
        });
        
        this.socket.on('auctionCancelled', (data) => {
            this.hideAuctionModal();
            this.addGameMessage(data.message, true);
        });
        
        this.socket.on('disconnect', () => {
            // Ocultar modal de subasta si está abierto
            if (this.currentAuction) {
                this.hideAuctionModal();
                this.addGameMessage('Conexión perdida - subasta cancelada', true);
            }
        });
        
        this.socket.on('reconnect', () => {
            this.addGameMessage('Reconectado al servidor', true);
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
    
    skipProperty() {
        this.socket.emit('skipProperty', this.currentRoom.code);
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
        
        // Ocultar botones de compra
        this.propertyActions.classList.add('hidden');
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
        
        // Mostrar botones de compra si es aplicable
        const currentPlayer = this.currentRoom.players.find(p => p.id === this.socket.id);
        if (currentPlayer && data.player.id === this.socket.id) {
            const currentSpace = this.currentRoom.board[currentPlayer.position];
            if (currentSpace.type === 'property' && 
                currentPlayer.money >= currentSpace.price &&
                !this.currentRoom.players.some(p => p.properties.includes(currentSpace.id))) {
                this.propertyActions.classList.remove('hidden');
                this.rollDiceBtn.classList.add('hidden'); // Ocultar dados hasta decidir
            } else {
                this.propertyActions.classList.add('hidden');
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
        
        // Auto-scroll suave
        setTimeout(() => {
            this.gameMessages.scrollTop = this.gameMessages.scrollHeight;
        }, 100);
        
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
    

    
    updateMyProperties() {
        if (!this.currentRoom || !this.currentPlayer) {
            this.myProperties.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Cargando...</p>';
            return;
        }
        
        this.myProperties.innerHTML = '';
        
        if (!this.currentPlayer.properties || this.currentPlayer.properties.length === 0) {
            this.myProperties.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem; font-size: 0.9rem;">No tienes propiedades aún</p>';
            return;
        }
        
        this.currentPlayer.properties.forEach(propId => {
            const property = this.currentRoom.board[propId];
            if (!property) return;
            
            const isMortgaged = this.currentPlayer.mortgaged && this.currentPlayer.mortgaged.includes(propId);
            
            const propDiv = document.createElement('div');
            propDiv.className = `property-item ${isMortgaged ? 'mortgaged' : ''}`;
            propDiv.innerHTML = `
                <div class="property-info">
                    <div class="property-name">${property.name} ${isMortgaged ? '(Hipotecada)' : ''}</div>
                    <div class="property-rent">Renta: $${property.rent === 'special' ? 'Especial' : property.rent}</div>
                </div>
                <div class="property-value">$${Math.floor(property.price / 2)}</div>
            `;
            this.myProperties.appendChild(propDiv);
        });
    }
    
    showMortgageModal(neededMoney) {
        if (!this.currentPlayer || this.currentPlayer.properties.length === 0) {
            alert('No tienes propiedades para hipotecar');
            return;
        }
        
        this.neededAmount.textContent = neededMoney;
        this.mortgageAmount.textContent = '0';
        this.selectedMortgages = [];
        
        this.mortgageProperties.innerHTML = '';
        
        this.currentPlayer.properties.forEach(propId => {
            const property = this.currentRoom.board[propId];
            const isMortgaged = this.currentPlayer.mortgaged && this.currentPlayer.mortgaged.includes(propId);
            
            if (!isMortgaged) {
                const mortgageValue = Math.floor(property.price / 2);
                const propDiv = document.createElement('div');
                propDiv.className = 'mortgage-property';
                propDiv.innerHTML = `
                    <input type="checkbox" class="mortgage-checkbox" data-prop-id="${propId}" data-value="${mortgageValue}">
                    <div class="property-info">
                        <div class="property-name">${property.name}</div>
                        <div class="property-rent">Valor hipoteca: $${mortgageValue}</div>
                    </div>
                `;
                
                const checkbox = propDiv.querySelector('.mortgage-checkbox');
                checkbox.addEventListener('change', () => this.updateMortgageSelection());
                
                this.mortgageProperties.appendChild(propDiv);
            }
        });
        
        this.mortgageModal.classList.remove('hidden');
    }
    
    updateMortgageSelection() {
        const checkboxes = this.mortgageProperties.querySelectorAll('.mortgage-checkbox:checked');
        let totalValue = 0;
        this.selectedMortgages = [];
        
        checkboxes.forEach(cb => {
            const propId = parseInt(cb.dataset.propId);
            const value = parseInt(cb.dataset.value);
            this.selectedMortgages.push(propId);
            totalValue += value;
            
            cb.closest('.mortgage-property').classList.add('selected');
        });
        
        // Deseleccionar no marcados
        this.mortgageProperties.querySelectorAll('.mortgage-checkbox:not(:checked)').forEach(cb => {
            cb.closest('.mortgage-property').classList.remove('selected');
        });
        
        this.mortgageAmount.textContent = totalValue;
        
        const needed = parseInt(this.neededAmount.textContent);
        this.confirmMortgage.disabled = totalValue < needed;
    }
    
    processMortgage() {
        if (this.selectedMortgages.length === 0) return;
        
        this.socket.emit('mortgageProperties', {
            roomCode: this.currentRoom.code,
            properties: this.selectedMortgages
        });
        
        this.mortgageModal.classList.add('hidden');
    }
    
    showAuctionModal() {
        if (!this.currentAuction) return;
        
        this.auctionProperty.textContent = this.currentAuction.propertyName;
        this.currentBid.textContent = `$${this.currentAuction.currentBid}`;
        this.highestBidder.textContent = this.currentAuction.highestBidder ? 
            this.currentRoom.players.find(p => p.id === this.currentAuction.highestBidder)?.name || 'Desconocido' : 
            'Ninguno';
        this.timeLeft.textContent = `${this.currentAuction.timeLeft}s`;
        
        // Configurar oferta mínima
        this.bidAmount.min = this.currentAuction.currentBid + 100;
        this.bidAmount.placeholder = `Mínimo: $${this.currentAuction.currentBid + 100}`;
        this.bidAmount.value = '';
        
        this.auctionModal.classList.remove('hidden');
    }
    
    hideAuctionModal() {
        if (this.auctionModal) {
            this.auctionModal.classList.add('hidden');
        }
        this.currentAuction = null;
        
        // Limpiar campos de oferta
        if (this.bidAmount) {
            this.bidAmount.value = '';
        }
    }
    
    updateAuctionDisplay(data) {
        if (!this.currentAuction) return;
        
        this.currentAuction = data.auction;
        this.currentBid.textContent = `$${data.amount}`;
        this.highestBidder.textContent = data.bidder;
        
        // Actualizar oferta mínima
        this.bidAmount.min = data.amount + 100;
        this.bidAmount.placeholder = `Mínimo: $${data.amount + 100}`;
        this.bidAmount.value = '';
    }
    
    updateAuctionTimer(timeLeft) {
        if (!this.timeLeft || !this.currentAuction) return;
        
        this.timeLeft.textContent = `${timeLeft}s`;
        
        // Agregar clase urgente si quedan menos de 10 segundos
        if (timeLeft <= 10) {
            this.timeLeft.classList.add('urgent');
        } else {
            this.timeLeft.classList.remove('urgent');
        }
        
        // El servidor maneja el cierre de la subasta
    }
    
    submitBid() {
        if (!this.currentAuction || !this.currentPlayer || !this.currentRoom) {
            this.addGameMessage('Error: No se puede realizar la oferta en este momento', true);
            return;
        }
        
        const amount = parseInt(this.bidAmount.value);
        const minBid = this.currentAuction.currentBid + 100;
        
        if (!amount || isNaN(amount) || amount < minBid) {
            alert(`La oferta mínima es $${minBid.toLocaleString()}`);
            return;
        }
        
        if (amount > this.currentPlayer.money) {
            alert('No tienes suficiente dinero para esta oferta');
            return;
        }
        
        // Deshabilitar botón temporalmente para evitar doble envío
        this.placeBid.disabled = true;
        
        this.socket.emit('placeBid', {
            roomCode: this.currentRoom.code,
            amount: amount
        });
        
        // Rehabilitar botón después de un segundo
        setTimeout(() => {
            if (this.placeBid) {
                this.placeBid.disabled = false;
            }
        }, 1000);
    }
    
    showAuctionNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'auction-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MonopolyGame();
    console.log('Juego inicializado');
});