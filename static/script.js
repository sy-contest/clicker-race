let database;
let currentPlayer;

function checkDeviceAndOrientation() {
    const deviceMessage = document.getElementById('device-message');
    const orientationMessage = document.getElementById('orientation-message');
    const content = document.getElementById('content');

    if (window.innerWidth >= 768) {
        deviceMessage.style.display = 'block';
        orientationMessage.style.display = 'none';
        content.style.display = 'none';
    } else if (screen.orientation.angle === 90 || screen.orientation.angle === -90) {
        deviceMessage.style.display = 'none';
        orientationMessage.style.display = 'block';
        content.style.display = 'none';
    } else {
        deviceMessage.style.display = 'none';
        orientationMessage.style.display = 'none';
        content.style.display = 'block';
    }
}

window.addEventListener('load', checkDeviceAndOrientation);
window.addEventListener('resize', checkDeviceAndOrientation);
window.addEventListener('orientationchange', checkDeviceAndOrientation);

fetch('/config')
    .then(response => response.json())
    .then(firebaseConfig => {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        initializeEventListeners();
    })
    .catch(error => {
        console.error('Error loading Firebase config:', error);
        alert('Failed to load Firebase configuration. Please try again later.');
    });

function initializeEventListeners() {
    document.getElementById('login-button').addEventListener('click', login);
    document.getElementById('game-area').addEventListener('click', makeClick);
}

function login() {
    const username = document.getElementById('username').value;
    const gameId = document.getElementById('game-id').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, game_id: gameId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentPlayer = data.player;
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('game-area').style.display = 'flex';
            listenForGameUpdates(gameId);
        } else {
            alert(data.message || 'Failed to login');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while logging in');
    });
}

function makeClick() {
    fetch('/click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('your-clicks').textContent = data.clicks;
            if (data.winner) {
                alert('Congratulations! You won!');
                document.getElementById('game-area').removeEventListener('click', makeClick);
            }
        } else {
            alert(data.message || 'Failed to record click');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while clicking');
    });
}

function listenForGameUpdates(gameId) {
    const gameRef = database.ref(`games/${gameId}`);
    gameRef.on('value', (snapshot) => {
        const game = snapshot.val();
        updateClickCounts(game);
        if (game.status === 'finished') {
            alert(`Game over! The winner is ${game.winner}`);
            document.getElementById('game-area').removeEventListener('click', makeClick);
        }
    });
}

function updateClickCounts(game) {
    const yourClicks = currentPlayer === 'player1' ? game.player1_clicks : game.player2_clicks;
    const opponentClicks = currentPlayer === 'player1' ? game.player2_clicks : game.player1_clicks;
    document.getElementById('your-clicks').textContent = yourClicks;
    document.getElementById('opponent-clicks').textContent = opponentClicks;
}