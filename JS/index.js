class Canvas {
    gameArea; // Canvas
    context;
    width; // Width
    height; // Height
    background = new Image(); // Background image
    backgroundLocation = "default"; // Map location name
    backgroundLocationTrigger = false; // Trigger to change location
    backgroundChangeAnimationCount = 0; // Iterator (for slide animation from left/right side)

    constructor(gameArea, context) {
        this.gameArea = gameArea;
        this.context = context;

        this.width = gameArea.width;
        this.height = gameArea.height;
    }

    SetBackground(backgroundUrl) {
        this.background.src = backgroundUrl;
        this.gameArea.style.background = this.background;
    }
};

class Player {
    imageUrl = new Image(); // Image
    width = 48; // Image width
    height = 48; // Image height
    positionX = (canvas.gameArea.width / 2) - this.width / 2;
    positionY = 0;
    speedX = 1;
    speedY = 1;
    state = "idle"; // State for movement/jump/attack or not
    statePrevious = "idle"; // Previous state
    stateDirection = true; // Direction (left/right)

    staggerFrames = 25; // Animation speed
    framesCount = 3; // Count images (for animate different states)
    frames = 0; // Iterator FPS - ('frames' % 'framesCount' == 0) for slowest player rendering

    health = 100;
    attackDamage = 10;
    isAlive = true;

    SetImage(imageUrl) {
        this.imageUrl.src = imageUrl;
    }

    SetSpeed(speedX, speedY) {
        this.speedX = speedX || 1;
        this.speedY = speedY || 1;
    }

    SetPositions(positionX, positionY) {
        this.positionX = positionX || (canvas.gameArea.width / 2) - this.width / 2;
        this.positionY = positionY || 0;
    }

    // Set count frames (animations), and slow/speed up animations
    SetFramesCountAndStaggerFrames(framesCount, staggerFrames) {
        this.framesCount = framesCount;
        this.staggerFrames = staggerFrames;
    }

    GetHP() {
        return this.health > 0; // bool
    }

    SetHP(attackDamage, playerNumber) { // playerNumber (1 or 2)
        attackDamage = attackDamage || 0;
        playerNumber = playerNumber || "";
        this.health -= attackDamage;
        document.getElementById(`divPlayer${playerNumber}Health`).innerHTML = `Health: ${this.health}`;
    }
};

const gameMusic = new Audio("Audio/Exit-the-Premises-[AudioTrimmer.com].mp3"); // Music

let gameFrame = 0; // Global game frames iterator
let globalStaggerFrames = 25; // For slow/speed up animations globally

let playersImageDirectory = ["Images/CharactersHuman/1 Biker", "Images/CharactersHuman/2 Punk"];
let drawGame = false; // To draw result

let backgrounds = ["Images/Backgrounds/Background.png", "Images/Backgrounds/Background2.png"]; // Background images
let arleadyOnLocation = false;

let canvas; // Map
let player; // Player1
let enemy; // Player2
let gameRounds = 0; // Rounds iterator
let saveGameCount = 0; // Iterator (ID) for save games in localstorage

let timer;
let timerId;

// Start game when all animations on site will finish their work
function PreloadAfterTimer() {
    if (!drawGame) {
        drawGame = true;
        canvas.gameArea.style.background = "black";
    }
};

// Timer for battle, also check if game is draw
function DecreaseTimer() {
    PreloadAfterTimer();

    if (timer > 0) {
        timerId = setTimeout(DecreaseTimer, 1000);
        timer--;
        document.querySelector('#labelTimer').innerHTML = timer;
    }

    if (timer === 0) {
        clearTimeout(timerId);

        // Result: Draw
        player.state = "death";
        player.isAlive = false;
        enemy.state = "death";
        enemy.isAlive = false;

        alert("Result: Draw\n\nPress: R for restart the game");
        SaveRounds("Draw");
    }
};

// Default values on objects and prepare it for the future
function LoadMainContent(timeoutForTimer) {
    // Canvas default dalues
    canvas = new Canvas(document.getElementById("canvasGame"), document.getElementById("canvasGame").getContext("2d"));
    canvas.SetBackground(backgrounds[0]);

    // Player default dalues
    player = new Player();
    player.SetHP();
    player.SetPositions(-canvas.gameArea.width + player.positionX * 2.3);
    player.isAlive = true;

    // Enemy default values
    enemy = new Player();
    enemy.SetHP(null, 2);
    enemy.SetPositions(enemy.positionX * 1.88);
    enemy.stateDirection = false;
    enemy.isAlive = true;

    // Music default values
    gameMusic.loop = true;
    gameMusic.volume = 0.8;

    // Timer
    clearTimeout(timerId);
    timer = 60;
    timeoutForTimer = timeoutForTimer || 0;
    setTimeout(DecreaseTimer, timeoutForTimer);
};
export { LoadMainContent };

// Check location change trigger
function CheckPlayerLocation(player) {
    if (player.positionX < -player.width) {
        canvas.backgroundLocationTrigger = true;
        canvas.backgroundLocation = "townAndTree";
        arleadyOnLocation = true;
    }
    if (player.positionX > canvas.gameArea.width) {
        canvas.backgroundLocationTrigger = true;
        canvas.backgroundLocation = "default";
        arleadyOnLocation = false;
    }
};

// Changing background while go over left side or right
function SetBackgroundLocation(player, enemy) {
    if (canvas.backgroundLocationTrigger) {
        let tempImage = new Image();

        enemy.SetPositions(canvas.gameArea.width - player.width * 2);
        player.SetPositions(player.width);

        if (arleadyOnLocation) {
            if (canvas.backgroundChangeAnimationCount < -canvas.gameArea.width) { // Slide background from right side to left
                canvas.backgroundChangeAnimationCount = 0;
                player.stateDirection = true;

                canvas.backgroundLocationTrigger = false;
            }
            else {
                if (canvas.backgroundLocation == "townAndTree") {
                    canvas.SetBackground(backgrounds[1]);
                    tempImage.src = backgrounds[1];
                    canvas.context.drawImage(tempImage, canvas.backgroundChangeAnimationCount + canvas.gameArea.width, 0);
                    canvas.backgroundChangeAnimationCount -= 5;
                }
            }
        }
        else {
            if (canvas.backgroundChangeAnimationCount > canvas.gameArea.width) { // Slide background from left side to right
                canvas.backgroundChangeAnimationCount = 0;
                enemy.stateDirection = false;

                canvas.backgroundLocationTrigger = false;
            }
            else {
                if (canvas.backgroundLocation == "default") {
                    canvas.SetBackground(backgrounds[0]);
                    tempImage.src = backgrounds[0];
                    canvas.context.drawImage(tempImage, canvas.backgroundChangeAnimationCount + (-canvas.gameArea.width), 0);
                    canvas.backgroundChangeAnimationCount += 5;
                }
            }
        }
    }
};

function CheckPlayersAttacks(character, enemy) {
    // INSTRUCTION !!!
    // P1 - Player 1
    // P2 - Player 2
    // <- | -> - Directions
    // (attack) - Player state attack

    // When players looking at each other
    if (character.stateDirection && !enemy.stateDirection) {
        // P1->(attack) | <-P2
        if (enemy.GetHP()) {
            if (character.state == "attackR" && character.positionX + enemy.width / 3 >= enemy.positionX && character.positionX <= enemy.positionX + enemy.width / 3) {
                enemy.SetHP(character.attackDamage, 2);
                enemy.positionX = enemy.positionX + 5;
                enemy.state = "hurt";
            }
        }
        // P1-> | (attack)<-P2
        if (character.GetHP()) {
            if (enemy.state == "attackR" && enemy.positionX >= character.positionX - character.width / 3 && enemy.positionX <= character.positionX + character.width / 3) {
                character.SetHP(enemy.attackDamage);
                character.positionX = character.positionX - 5;
                character.state = "hurt";
            }
        }
    }
    // When players behind enemy and looking on center screen
    else
        if (!character.stateDirection && enemy.stateDirection) {
            // P1<-(attack) | ->P2
            if (enemy.GetHP()) {
                if (character.state == "attackR" && character.positionX + enemy.width / 3 >= enemy.positionX && character.positionX <= enemy.positionX + enemy.width / 3) {
                    enemy.SetHP(character.attackDamage, 2);
                    enemy.positionX = enemy.positionX - 5;
                    enemy.state = "hurt";
                }
            }
            // P1<- | (attack)->P2
            if (character.GetHP()) {
                if (enemy.state == "attackR" && enemy.positionX >= character.positionX - character.width / 3 && enemy.positionX <= character.positionX + character.width / 3) {
                    character.SetHP(enemy.attackDamage);
                    character.positionX = character.positionX + 5;
                    character.state = "hurt";
                }
            }
        }

    //#region Character attacks
    // When character looking on right, and enemy on right
    if (enemy.GetHP()) {
        if (character.stateDirection && enemy.stateDirection) {
            // P1->(attack) | ->P2
            if (character.state == "attackR" && character.positionX + character.width / 2 >= enemy.positionX - enemy.width / 4 && character.positionX <= enemy.positionX - enemy.width / 5) {
                enemy.SetHP(character.attackDamage, 2);
                enemy.positionX = enemy.positionX + 5;
                enemy.state = "hurt";
            }
        }
        // When character behind enemy
        if (!character.stateDirection && !enemy.stateDirection) {
            // P1<-(attack) | <-P2
            if (character.state == "attackR" && character.positionX >= enemy.positionX + enemy.width / 8 && character.positionX <= enemy.positionX + enemy.width / 1.5) {
                enemy.SetHP(character.attackDamage, 2);
                enemy.positionX = enemy.positionX - 5;
                enemy.state = "hurt";
            }
        }
    }
    //#endregion

    //#region Enemy attacks
    // When enemy looking on left, and character on left
    if (character.GetHP()) {
        if (!character.stateDirection && !enemy.stateDirection) {
            // P1-> | (attack)->P2
            if (enemy.state == "attackR" && enemy.positionX >= character.positionX && enemy.positionX <= character.positionX + character.width / 1.3) {
                character.SetHP(enemy.attackDamage);
                character.positionX = character.positionX - 5;
                character.state = "hurt";
            }
        }
        // When enemy behind character
        if (character.stateDirection && enemy.stateDirection) {
            // P1-> | (attack)->P2
            if (enemy.state == "attackR" && enemy.positionX >= character.positionX - character.width / 1.3 && enemy.positionX <= character.positionX) {
                character.SetHP(enemy.attackDamage);
                character.positionX = character.positionX + 5;
                character.state = "hurt";
            }
        }
    }
    //#endregion
};

// Draw content on canvas
function MapGenerator() {
    if (drawGame) {
        // Play music
        if (gameMusic.paused)
            gameMusic.play();

        canvas.context.clearRect(0, 0, canvas.gameArea.width, canvas.gameArea.height);

        // Stop inputs while location is changing
        if (!canvas.backgroundLocationTrigger) {
            canvas.context.drawImage(canvas.background, 0, 0, canvas.width, canvas.height);

            player.frames = DrawElement(player, player.staggerFrames, player.frames, player.framesCount, player.positionX, player.stateDirection);
            enemy.frames = DrawElement(enemy, enemy.staggerFrames, enemy.frames, enemy.framesCount, enemy.positionX, enemy.stateDirection);
        }

        // Inputs
        PlayerStateImplementation(player, playersImageDirectory[0]);
        PlayerStateImplementation(enemy, playersImageDirectory[1]);

        if (gameFrame % globalStaggerFrames == 0) // For slowing triggering an attack
            CheckPlayersAttacks(player, enemy);

        // Location
        CheckPlayerLocation(player);
        CheckPlayerLocation(enemy);
        SetBackgroundLocation(player, enemy);

        CheckWinner();

        gameFrame++;
    }
    requestAnimationFrame(MapGenerator);
};
MapGenerator();

function DrawElement(player, staggerFrames, frameX, framesCount, positionX, stateDirection) {
    if (gameFrame % staggerFrames == 0) {
        if (stateDirection) {
            // Validate animations in normal direction
            // player.state != "death" - is Stop animation after player is fall
            frameX < framesCount ? frameX++ : player.state != "death" ? frameX = 0 : frameX = framesCount; // Ternary operator

            if (player.state == "hurt" && frameX == framesCount)
                player.state = player.statePrevious;
        }
        else {
            // Validate animations in reverse direction
            // player.state != "death" - is Stop animation after player is fall
            frameX > 0 ? frameX-- : player.state != "death" ? frameX = framesCount : frameX = 0; // Ternary operator

            if (player.state == "hurt" && frameX == 0)
                player.state = player.statePrevious;
        }
    }

    // Draw player on screen
    canvas.context.drawImage(player.imageUrl, frameX * player.width, 0 * player.height, player.width, player.height,
        positionX, canvas.gameArea.height - player.height - player.positionY, player.width, player.height);

    return frameX;
};

// Get player for validation on keyup
function WhoKeyUp(e) {
    if (e.key == "w" || e.key == "a" || e.key == "s" || e.key == "d") {
        player.SetSpeed(0);
        return true;
    }
    else if (e.key == "ArrowUp" || e.key == "ArrowLeft" || e.key == "ArrowDown" || e.key == "ArrowRight") {
        enemy.SetSpeed(0);
        return false;
    }
};

function KeyUpJumpValidation(player) {
    // Continue walking when jump is over and buttons walk is down
    if (player.state == "jump" && player.statePrevious == "walkD") {
        player.state = "walkD";
    }
    else if (player.state == "jump" && player.statePrevious == "walkA") {
        player.state = "walkA";
    }
    else if (player.isAlive) { // If the player is alive, then we can standing
        player.state = "idle";
        player.statePrevious = "idle";
    }
};

function ResetGame(e) {
    if (e.code == "KeyR") // Reset game
        if (!player.isAlive || !enemy.isAlive)
            LoadMainContent();
};

document.addEventListener("keyup", function (e) {
    if (WhoKeyUp(e))
        KeyUpJumpValidation(player);
    else
        KeyUpJumpValidation(enemy);
});

document.addEventListener("keydown", function (e) {
    GetPressedKey(e);
    ResetGame(e);
});

// Get key and set player state
function GetPressedKey(e) {
    // Enemy State
    if (enemy.isAlive) {
        if (e.code == 'ArrowUp')
            enemy.state = "jump";
        if (e.code == 'ArrowRight') {
            enemy.state = "walkD";
            enemy.stateDirection = true;
            enemy.statePrevious = "walkD";
        }
        if (e.code == 'ArrowLeft') {
            enemy.state = "walkA";
            enemy.stateDirection = false;
            enemy.statePrevious = "walkA";
        }
        if (e.code == "ArrowDown")
            enemy.state = "attackR";
    }

    // Player State
    if (player.isAlive) {
        if (e.code == "KeyW")
            player.state = "jump";
        if (e.code == "KeyD") {
            player.state = "walkD";
            player.stateDirection = true;
            player.statePrevious = "walkD";
        }
        if (e.code == "KeyA") {
            player.state = "walkA";
            player.stateDirection = false;
            player.statePrevious = "walkA";
        }
        if (e.code == "KeyS")
            player.state = "attackR";
    }
};

// Check in what direction player is looking
function SetPlayerDirectionImage(extendText, player, imageDirectory) {
    extendText = extendText || "";

    if (player.stateDirection)
        player.SetImage(`${imageDirectory}/${extendText}${player.state}.png`);
    else
        player.SetImage(`${imageDirectory}/${extendText}${player.state}Reverse.png`);
};

// Apply player input animation
function PlayerStateImplementation(player, imageDirectory) {
    // Key clicks animations
    switch (player.state) {
        case "jump":
            if (player.state == "jump" && player.statePrevious != "idle") {
                player.SetSpeed(1);
                player.SetFramesCountAndStaggerFrames(5, 10);
                SetPlayerDirectionImage("double", player, imageDirectory);

                if (player.statePrevious == "walkD") {
                    player.positionX += player.speedX;
                    // player.positionY += player.speedY;
                }
                else if (player.statePrevious == "walkA") {
                    player.positionX -= player.speedX;
                    // player.positionY += player.speedY;
                }
            }
            break;

        case "idle": // Player standing
            player.SetSpeed(0);
            player.SetFramesCountAndStaggerFrames(3, 25);
            SetPlayerDirectionImage("", player, imageDirectory);
            break;

        case "walkD": // Walk in right side
            player.SetSpeed(1.5);
            player.SetFramesCountAndStaggerFrames(5, 10);
            player.positionX += player.speedX;
            player.SetImage(`${imageDirectory}/${player.state.substring(0, player.state.length - 1)}.png`);
            break;

        case "walkA": // Walk in left side
            player.SetSpeed(1.5);
            player.SetFramesCountAndStaggerFrames(5, 10);
            player.positionX -= player.speedX;
            player.SetImage(`${imageDirectory}/${player.state.substring(0, player.state.length - 1)}Reverse.png`);
            break;

        case "attackR": // Attack
            player.SetSpeed(0);
            player.SetFramesCountAndStaggerFrames(7, 6);
            SetPlayerDirectionImage("", player, imageDirectory);
            break;

        case "death": // Player HP is lower or equal 0
            player.SetSpeed(0);
            player.SetFramesCountAndStaggerFrames(5, 20);
            SetPlayerDirectionImage("", player, imageDirectory);
            break;

        case "hurt":
            player.SetSpeed(0);
            player.SetFramesCountAndStaggerFrames(1, 25);
            SetPlayerDirectionImage("", player, imageDirectory);
            break;
    }
};

function SaveRounds(winnerName) {
    let length = localStorage.length;

    if (localStorage.length > 0)
        saveGameCount = ++length;
    else
        saveGameCount++;

    if (gameRounds < 3) // Reset game rounds from 3 to 1
        gameRounds++;
    else
        gameRounds = 1;

    let date = new Date().toLocaleString();
    let gameDate = date.split(",")[0];
    let gameTime = `${date.split(" ")[1]} ${date.split(" ")[2]}`; // PM or AM

    localStorage.setItem(saveGameCount, `${gameRounds}|${gameDate}|${gameTime}|${winnerName}|${timer}`);
};

// Check winners of this ultra mega battle
function CheckWinner() {
    if (player.health <= 0) {
        player.state = "death";
        clearTimeout(timerId);

        if (player.isAlive) { // So that there is no endless cycle
            // After the alert, player will stand
            enemy.state = "idle";
            enemy.statePrevious = "idle";

            alert("Result: Punk WINNER!!!\n\nPress: R for restart the game");
            SaveRounds("Punk");
        }

        player.isAlive = false;
    }
    else if (enemy.health <= 0) {
        enemy.state = "death";
        clearTimeout(timerId);

        if (enemy.isAlive) { // So that there is no endless cycle
            // After the alert, player will stand
            player.state = "idle";
            player.statePrevious = "idle";

            alert("Result: Biker WINNER!!!\n\nPress: R for restart the game");
            SaveRounds("Biker");
        }

        enemy.isAlive = false;
    }
};