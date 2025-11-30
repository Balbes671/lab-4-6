
let canvas, ctx;
let player = {
    x: 400,
    y: 300,
    width: 32,
    height: 32,
    speed: 2,
    health: 100,
    maxHealth: 100,
    hasSword: false,
    name: "Link",
    direction: "down",
    attacking: false,
    attackTimer: 0
};
let sword = {
    x: 400,
    y: 200,
    width: 24,
    height: 24,
    collected: false
};
let enemies = [];
let doors = [];
let obstacles = [];
let caves = [];
let keys = {};
let gameState = "playing";
let currentScreen = 1;
let totalScreens = 4;
let attackSword = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false
};

// Настройка обработчиков событий для меню
function setupMenuEventListeners() {
    document.getElementById('new-game-btn').addEventListener('click', showCharacterCreation);
    document.getElementById('start-game-btn').addEventListener('click', startGame);
}

// Инициализация игры
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    window.addEventListener('keydown', function(e) {
        keys[e.key] = true;

        if (e.key === ' ' && player.hasSword && !player.attacking) {
            player.attacking = true;
            player.attackTimer = 15;
            updateAttackSwordPosition();
        }
    });

    window.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });

    loadScreen(1);
    gameLoop();
}

// Загрузка экрана
function loadScreen(screenNumber) {
    currentScreen = screenNumber;

    // Сброс позиции игрока в зависимости от экрана
    if (screenNumber === 1) {
        player.x = 400;
        player.y = 300;
    } else if (screenNumber === 2) { // Пещера
        player.x = 400;
        player.y = 500;
    } else if (screenNumber === 3) { // Второй экран
        player.x = 50;
        player.y = 300;
    } else if (screenNumber === 4) { // Третий экран
        player.x = 50;
        player.y = 300;
    }

    player.attacking = false;
    player.attackTimer = 0;

    document.getElementById('current-screen').textContent = `Экран: ${Math.min(screenNumber, 3)}/3`;

    enemies = [];
    doors = [];
    obstacles = [];
    caves = [];

    // Не сбрасываем состояние меча при загрузке экрана
    if (screenNumber !== 2) {
        sword.collected = player.hasSword;
    }

    switch(screenNumber) {
        case 1:
            // Первый экран - с пещерой
            document.getElementById('weapon-slot').classList.toggle('empty', !player.hasSword);

            // Добавляем пещеру как объект для входа
            caves.push({
                x: 350,
                y: 200,
                width: 100,
                height: 80,
                type: 'entrance'
            });

            obstacles.push(
                { x: 100, y: 100, width: 40, height: 40, type: 'rock' },
                { x: 600, y: 100, width: 40, height: 40, type: 'rock' },
                { x: 100, y: 450, width: 60, height: 60, type: 'tree' },
                { x: 600, y: 450, width: 60, height: 60, type: 'tree' },
                { x: 350, y: 500, width: 40, height: 40, type: 'rock' }
            );

            // Дверь заблокирована пока не найден меч
            doors.push({
                x: 750,
                y: 250,
                width: 30,
                height: 100,
                nextScreen: 3,
                locked: !player.hasSword
            });
            break;

        case 2:
            // Экран пещеры - здесь лежит меч
            sword.x = 400;
            sword.y = 200;
            sword.collected = player.hasSword; // Сохраняем состояние меча

            // Выход из пещеры
            doors.push({
                x: 350,  // Более центральное положение
                y: 550,  // Оставляем внизу
                width: 100,  // Шире для легкого прохождения
                height: 30,
                nextScreen: 1,
                locked: false
            });

            // Стены пещеры
            obstacles.push(
                { x: 0, y: 0, width: 800, height: 50, type: 'cave-wall' },
                { x: 0, y: 0, width: 50, height: 600, type: 'cave-wall' },
                { x: 750, y: 0, width: 50, height: 600, type: 'cave-wall' },
                // Убираем сплошную нижнюю стену, заменяем на две части с проходом посередине
                { x: 0, y: 550, width: 350, height: 50, type: 'cave-wall' },
                { x: 450, y: 550, width: 350, height: 50, type: 'cave-wall' }
            );
            break;

        case 3:
            // Второй экран - несколько врагов
            document.getElementById('weapon-slot').classList.remove('empty');

            enemies = [
                {
                    x: 600, y: 150, width: 32, height: 32, speed: 1, health: 30,
                    type: 'patrol', patrolPoints: [{x: 600, y: 150}, {x: 700, y: 150}, {x: 700, y: 250}, {x: 600, y: 250}],
                    currentPatrolIndex: 0, direction: 1
                },
                {
                    x: 100, y: 400, width: 32, height: 32, speed: 1, health: 30,
                    type: 'circle', centerX: 150, centerY: 350, radius: 80, angle: 0
                }
            ];

            obstacles.push(
                { x: 200, y: 150, width: 40, height: 40, type: 'rock' },
                { x: 400, y: 300, width: 60, height: 60, type: 'tree' },
                { x: 600, y: 400, width: 40, height: 40, type: 'rock' }
            );

            doors.push({
                x: 750,
                y: 250,
                width: 30,
                height: 100,
                nextScreen: 4,
                locked: enemies.length > 0
            });
            break;

        case 4:
            // Третий экран - больше врагов и босс
            document.getElementById('weapon-slot').classList.remove('empty');

            enemies = [
                {
                    x: 600, y: 150, width: 32, height: 32, speed: 1, health: 30,
                    type: 'random', moveTimer: 0, targetX: 600, targetY: 150
                },
                {
                    x: 100, y: 400, width: 32, height: 32, speed: 1, health: 30,
                    type: 'patrol', patrolPoints: [{x: 100, y: 400}, {x: 200, y: 400}, {x: 200, y: 300}, {x: 100, y: 300}],
                    currentPatrolIndex: 0, direction: 1
                },
                {
                    x: 400, y: 100, width: 32, height: 32, speed: 1, health: 30,
                    type: 'circle', centerX: 400, centerY: 150, radius: 50, angle: 0
                },
                {
                    x: 200, y: 500, width: 55, height: 55, speed: 0.7, health: 500, // Увеличил здоровье босса
                    type: 'chase', chaseTimer: 0,
                    isBoss: true,
                    shootTimer: 0, // Таймер для стрельбы
                    projectiles: [] // Массив снарядов босса
                }
            ];

            obstacles.push(
                { x: 300, y: 200, width: 40, height: 40, type: 'rock' },
                { x: 500, y: 200, width: 40, height: 40, type: 'rock' },
                { x: 300, y: 400, width: 60, height: 60, type: 'tree' },
                { x: 500, y: 400, width: 60, height: 60, type: 'tree' }
            );
            break;
    }
}

// Переключение между экранами
function showMainMenu() {
    gameState = "menu";

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('main-menu').classList.add('active');
}

function showCharacterCreation() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('character-creation').classList.add('active');
}


function startGame() {
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput.value.trim() !== '') {
        player.name = playerNameInput.value.trim();
    } else {
        player.name = "Link";
    }

    document.getElementById('player-name-display').textContent = player.name;

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('game-screen').classList.add('active');

    // Полный сброс состояния игры
    player.x = 400;
    player.y = 300;
    player.health = 100;
    player.hasSword = false;
    player.attacking = false;
    player.attackTimer = 0;
    sword.collected = false;
    gameState = "playing";
    currentScreen = 1;

    // Очищаем массивы
    enemies = [];
    doors = [];
    obstacles = [];
    caves = [];

    // Сбрасываем клавиши
    keys = {};

    // Перезапускаем игру
    if (canvas) {
        init();
    } else {
        init();
    }
}

// Обновление позиции меча атаки
function updateAttackSwordPosition() {
    attackSword.visible = true;

    switch(player.direction) {
        case 'up':
            attackSword.width = 24;
            attackSword.height = 16;
            attackSword.x = player.x + 4;
            attackSword.y = player.y - 16;
            break;
        case 'down':
            attackSword.width = 24;
            attackSword.height = 16;
            attackSword.x = player.x + 4;
            attackSword.y = player.y + player.height;
            break;
        case 'left':
            attackSword.width = 16;
            attackSword.height = 24;
            attackSword.x = player.x - 16;
            attackSword.y = player.y + 4;
            break;
        case 'right':
            attackSword.width = 16;
            attackSword.height = 24;
            attackSword.x = player.x + player.width;
            attackSword.y = player.y + 4;
            break;
    }
}

// Обновление состояния игры
function update() {
    if (gameState !== "playing") return;

    if (player.attacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.attacking = false;
            attackSword.visible = false;
        }
    }

    let prevX = player.x;
    let prevY = player.y;

    // Движение игрока (работает на всех экранах)
    if (keys['ArrowUp']) {
        player.y -= player.speed;
        player.direction = 'up';
    }
    if (keys['ArrowDown']) {
        player.y += player.speed;
        player.direction = 'down';
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.direction = 'right';
    }

    // Проверка столкновений с препятствиями
    let collisionWithObstacle = false;
    for (let obstacle of obstacles) {
        if (checkCollision(player, obstacle)) {
            collisionWithObstacle = true;
            break;
        }
    }

    // Если столкнулись с препятствием, возвращаем игрока
    if (collisionWithObstacle) {
        player.x = prevX;
        player.y = prevY;
    }

    // Ограничение движения в пределах холста
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Проверка входа в пещеру (только на первом экране)
    if (currentScreen === 1 && !player.hasSword) {
        for (let cave of caves) {
            if (checkCollision(player, cave)) {
                showScreenTransition();
                setTimeout(() => {
                    loadScreen(2); // Переход в пещеру
                    hideScreenTransition();
                }, 1000);
                break;
            }
        }
    }

    // Проверка подбора меча в пещере
    if (currentScreen === 2 && !sword.collected && checkCollision(player, sword)) {
        sword.collected = true;
        player.hasSword = true;
        document.getElementById('weapon-slot').classList.remove('empty');
    }

    // Проверка столкновения с дверями
    doors.forEach(door => {
        if (!door.locked && checkCollision(player, door)) {
            showScreenTransition();
            setTimeout(() => {
                loadScreen(door.nextScreen);
                hideScreenTransition();
            }, 1000);
        }
    });

    // Обновление позиции меча атаки
    if (player.attacking) {
        updateAttackSwordPosition();
    }

    // Движение врагов (только на экранах 3 и 4)
    if (currentScreen >= 3) {
        enemies.forEach(enemy => {
            let prevEnemyX = enemy.x;
            let prevEnemyY = enemy.y;

            switch(enemy.type) {
                case 'patrol':
                    let targetPoint = enemy.patrolPoints[enemy.currentPatrolIndex];
                    let dx = targetPoint.x - enemy.x;
                    let dy = targetPoint.y - enemy.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 5) {
                        enemy.currentPatrolIndex += enemy.direction;
                        if (enemy.currentPatrolIndex >= enemy.patrolPoints.length || enemy.currentPatrolIndex < 0) {
                            enemy.direction *= -1;
                            enemy.currentPatrolIndex += enemy.direction * 2;
                        }
                    } else {
                        enemy.x += (dx / distance) * enemy.speed;
                        enemy.y += (dy / distance) * enemy.speed;
                    }
                    break;

                case 'circle':
                    enemy.angle += 0.02;
                    enemy.x = enemy.centerX + Math.cos(enemy.angle) * enemy.radius;
                    enemy.y = enemy.centerY + Math.sin(enemy.angle) * enemy.radius;
                    break;

                case 'random':
                    enemy.moveTimer--;
                    if (enemy.moveTimer <= 0) {
                        enemy.targetX = Math.random() * (canvas.width - enemy.width);
                        enemy.targetY = Math.random() * (canvas.height - enemy.height);
                        enemy.moveTimer = 60 + Math.random() * 60;
                    }

                    let rdx = enemy.targetX - enemy.x;
                    let rdy = enemy.targetY - enemy.y;
                    let rdist = Math.sqrt(rdx * rdx + rdy * rdy);

                    if (rdist > 0) {
                        enemy.x += (rdx / rdist) * enemy.speed;
                        enemy.y += (rdy / rdist) * enemy.speed;
                    }
                    break;

                case 'chase':
                    enemy.chaseTimer--;
                    if (enemy.chaseTimer <= 0) {
                        let cdx = player.x - enemy.x;
                        let cdy = player.y - enemy.y;
                        let cdist = Math.sqrt(cdx * cdx + cdy * cdy);

                        if (cdist > 0) {
                            enemy.x += (cdx / cdist) * enemy.speed;
                            enemy.y += (cdy / cdist) * enemy.speed;
                        }

                        if (Math.random() < 0.1) {
                            enemy.chaseTimer = 30 + Math.random() * 30;
                        }
                    }
                    break;
            }

            let enemyCollision = false;
            for (let obstacle of obstacles) {
                if (checkCollision(enemy, obstacle)) {
                    enemyCollision = true;
                    break;
                }
            }

            if (enemyCollision) {
                enemy.x = prevEnemyX;
                enemy.y = prevEnemyY;
            }

            if (checkCollision(player, enemy)) {
                player.health -= 0.5;
                updateHealthBar();

                if (player.health <= 0) {
                    gameState = "gameOver";
                    setTimeout(() => {
                        alert("Вы погибли! Начните игру заново.");
                        showMainMenu();
                    }, 500);
                }
            }

            if (player.attacking && attackSword.visible && checkCollision(attackSword, enemy)) {
                enemy.health -= 10;
                if (enemy.health <= 0) {
                    enemies = enemies.filter(e => e !== enemy);

                    // Проверяем, нужно ли разблокировать дверь
                    if (currentScreen === 3 && enemies.length === 0) {
                        doors.forEach(door => {
                            if (door.nextScreen === 4) {
                                door.locked = false;
                            }
                        });
                    }
                }
            }
        });
    }

    // Проверка победы (последний экран и все враги побеждены)
    if (currentScreen === totalScreens && enemies.length === 0) {
        gameState = "victory";
        setTimeout(() => {
            alert("Поздравляем! Вы победили всех врагов и завершили игру!");
            showMainMenu();
        }, 500);
    }
}

// Показать переход между экранами
function showScreenTransition() {
    const transition = document.getElementById('screen-transition');
    transition.classList.remove('hidden');
}

// Скрыть переход между экранами
function hideScreenTransition() {
    const transition = document.getElementById('screen-transition');
    transition.classList.add('hidden');
}

// Проверка столкновения между двумя объектами
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

// Обновление полоски здоровья
function updateHealthBar() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = `${healthPercent}%`;
}

// Отрисовка игры
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка фона в зависимости от экрана
    switch(currentScreen) {
        case 1:
            ctx.fillStyle = '#1a472a'; // Зеленый для первого экрана
            break;
        case 2:
            ctx.fillStyle = '#2a1a2a'; // Темно-фиолетовый для пещеры
            break;
        case 3:
            ctx.fillStyle = '#2d5a5a'; // Сине-зеленый для второго экрана
            break;
        case 4:
            ctx.fillStyle = '#5a2d4a'; // Фиолетовый для третьего экрана
            break;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Отрисовка препятствий
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'rock') {
            ctx.fillStyle = '#666666';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            ctx.fillStyle = '#888888';
            ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 10, 10);
            ctx.fillRect(obstacle.x + 25, obstacle.y + 15, 8, 8);
            ctx.fillRect(obstacle.x + 15, obstacle.y + 25, 12, 12);
        } else if (obstacle.type === 'tree') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obstacle.x + 20, obstacle.y + 40, 20, 20);

            ctx.fillStyle = '#2d5a2d';
            ctx.beginPath();
            ctx.arc(obstacle.x + 30, obstacle.y + 30, 25, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'cave-wall') {
            ctx.fillStyle = '#3a2a3a';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Текстура стены пещеры
            ctx.fillStyle = '#4a3a4a';
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(
                            obstacle.x + i * (obstacle.width / 5),
                            obstacle.y + j * (obstacle.height / 5),
                            obstacle.width / 5 - 2,
                            obstacle.height / 5 - 2
                        );
                    }
                }
            }
        }
    });

    // Отрисовка пещеры на первом экране
    if (currentScreen === 1) {
        caves.forEach(cave => {
            ctx.fillStyle = '#333333';
            ctx.fillRect(cave.x, cave.y, cave.width, cave.height);

            // Вход в пещеру
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(cave.x + 10, cave.y + 10, cave.width - 20, cave.height - 10);

            // Надпись у пещеры
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Пещера', cave.x + cave.width / 2, cave.y - 10);
        });
    }

    // Отрисовка меча в пещере
    if (currentScreen === 2 && !sword.collected) {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(sword.x, sword.y, sword.width, sword.height);

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(sword.x + 8, sword.y, 8, 12);

        // Свечение меча
        ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
        ctx.beginPath();
        ctx.arc(sword.x + sword.width / 2, sword.y + sword.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Отрисовка игрока
    ctx.fillStyle = player.hasSword ? '#0066cc' : '#999999';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 8, player.y + 8, 4, 4);
    ctx.fillRect(player.x + 20, player.y + 8, 4, 4);

    // Отрисовка меча атаки
    if (player.attacking && attackSword.visible) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(attackSword.x, attackSword.y, attackSword.width, attackSword.height);

        ctx.fillStyle = '#FFD700';
        if (player.direction === 'up' || player.direction === 'down') {
            ctx.fillRect(attackSword.x + 8, attackSword.y, 8, 8);
        } else {
            ctx.fillRect(attackSword.x, attackSword.y + 8, 8, 8);
        }
    }

    // Отрисовка врагов (только на экранах 3 и 4)
    if (currentScreen >= 3) {
        enemies.forEach(enemy => {
            if (enemy.health > 100) {
                ctx.fillStyle = '#990000';
            } else {
                ctx.fillStyle = '#cc0000';
            }
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4);
            ctx.fillRect(enemy.x + 20, enemy.y + 8, 4, 4);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(enemy.x + 10, enemy.y + 20, 12, 4);

            if (enemy.health > 100) {
                let bossHealthPercent = (enemy.health / 200) * 100;
                ctx.fillStyle = '#333333';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(enemy.x, enemy.y - 10, (enemy.width * bossHealthPercent) / 100, 5);
            }
        });
    }

    // Отрисовка дверей
    doors.forEach(door => {
        ctx.fillStyle = door.locked ? '#5D2906' : '#8B4513';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(door.x + 5, door.y + door.height / 2 - 5, 5, 10);

        // Подпись для выхода из пещеры
        if (currentScreen === 2) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Выход', door.x + door.width / 2, door.y - 10);
        }
    });

    // Отрисовка сообщений
    if (currentScreen === 1 && !player.hasSword) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Войдите в пещеру, чтобы найти меч!', canvas.width / 2, 50);
    } else if (currentScreen === 1 && player.hasSword) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Теперь вы можете пройти через дверь!', canvas.width / 2, 50);
    } else if (currentScreen === 2 && !player.hasSword) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Найдите меч в пещере!', canvas.width / 2, 50);
    } else if (currentScreen === 2 && player.hasSword) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Меч найден! Выйдите из пещеры.', canvas.width / 2, 50);
    } else if (currentScreen === 3 && enemies.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Победите всех врагов, чтобы открыть дверь!', canvas.width / 2, 50);
    } else if (currentScreen === 4) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Победите босса, чтобы завершить игру!', canvas.width / 2, 50);
    }

    if (gameState === "gameOver") {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ВЫ ПРОИГРАЛИ!', canvas.width / 2, canvas.height / 2);
    }

    if (gameState === "victory") {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ПОБЕДА!', canvas.width / 2, canvas.height / 2);
    }
}

// Игровой цикл
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    document.getElementById('weapon-slot').classList.add('empty');
    setupMenuEventListeners();
    showMainMenu();
});
