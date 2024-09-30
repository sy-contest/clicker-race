let database;
let carMoveDistance;

function calculateCarMoveDistance() {
    const screenHeight = window.innerHeight;
    const carHeight = 100; // Height of the car image
    const bottomMargin = 10; // Margin from the bottom of the screen
    carMoveDistance = (screenHeight - (carHeight + bottomMargin)) / 100;
}

window.addEventListener('load', () => {
    calculateCarMoveDistance();
    fetch('/config')
        .then(response => response.json())
        .then(firebaseConfig => {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            const gameId = window.location.pathname.split('/').pop();
            listenForGameUpdates(gameId);
        })
        .catch(error => {
            console.error('Error loading Firebase config:', error);
            alert('Failed to load Firebase configuration. Please try again later.');
        });
});

function listenForGameUpdates(gameId) {
    const gameRef = database.ref(`games/${gameId}`);
    gameRef.on('value', (snapshot) => {
        const game = snapshot.val();
        updateGameInfo(game);
        moveCar('player1', game.player1_clicks);
        moveCar('player2', game.player2_clicks);
    });
}

function updateGameInfo(game) {
    const gameInfo = document.getElementById('game-info');
    gameInfo.innerHTML = `
        <p>Status: ${game.status}</p>
        <p>Player 1: ${game.player1} (${game.player1_ready ? 'Ready' : 'Not Ready'})</p>
        <p>Player 2: ${game.player2} (${game.player2_ready ? 'Ready' : 'Not Ready'})</p>
        <p>Player 1 Clicks: ${game.player1_clicks}</p>
        <p>Player 2 Clicks: ${game.player2_clicks}</p>
        ${game.winner ? `<p>Winner: ${game.winner}</p>` : ''}
    `;
}

function moveCar(player, clicks) {
    const car = document.getElementById(player === 'player1' ? 'car1' : 'car2');
    const newPosition = window.innerHeight - (100 + 10 + (clicks * carMoveDistance));
    car.style.top = `${newPosition}px`;
}