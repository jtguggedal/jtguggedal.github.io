
//**
//      Gloabl settings
//**


//** Array for BLE packets
var charVal = new Uint8Array(20);

//** Gloabl joystick variables
var outputRight;
var outputLeft;
var tapEnd = 1;

//** Global variables needed to control and monitor the data flow over BLE
var writePermission = 1;            // When set to 1, the players can control the cars
var discardedPackets = [];          // Array to hold arrays that are created by touch events but never sent over BLE, kind of equivalent to packet loss
var priorityPacket = 0;             // Events like button press, that happen rarely compared to joystick events, are given priority to ensure that the DK gets the information
var prevNotificationArray = [];     // The notification characteristic handler uses this array to ensure that it only triggers actions when new values are sent

//** Game settings
var score = 5;                      // Number of lives each player starts with
var timeToJoin = 2;                // Interval from games is created until it starts [s]
var timeBetweenHits = 2000;         // Time from one hit to next possible [ms]
var coolDownPeriod = 1500;          // Shortest allowed interval between shots fired [ms]
var coolDownStatus = 0;             // Players starts with no need of 'cool down'
var gameOn = 0;                     // Game is by default not started automatically
var allowCreate = 1;                // Players are allowed to create their own games
var preventShot = 0;                // Variable to prevent being hit before timeBetweenHits is out
var updateInterval = 500;           // Interval for game updates to and from the server [ms]

var speedCoeff = 0.78;
var message;
var name;
var gameId;
var playerId;
var singlePlayer = false;
var gameMenuDown = true;

//** For local testing, set local to 1 to avoid Web Bluetooth errors
var local = 0;


//**
//     Joystick, based on the amazing nippleJS: http://yoannmoinet.github.io/nipplejs/
//**


var joystick = nipplejs.create({
    zone: document.getElementById('joystick-container'),
    mode: 'static',
    position: {left: '100px', top: '150px'},
    color: 'white',
    size: 150,
    restOpacity: 0.9
});

var pos = joystick.position;

joystick.on('start end', function(evt, data) {
        // Needs to stop car here
    }).on('move', function(evt, data) {


    var x = data.position.x-110; 
    var y = -1*(data.position.y-155);
    var hypotenus = Math.sqrt((Math.pow(x, 2)) + (Math.pow(y, 2)));
    var speed = Math.round((255/75)*hypotenus);
    var angle = (180/Math.PI)*Math.acos(x/hypotenus);
    var directionRight, directionLeft;
    if(y < 0) {
        angle = 360 - angle;
        directionRight = directionLeft = 0;
    } else {
        directionRight = directionLeft = 1;
    }

    angle = Math.round(angle);

    if(speed > 255)
        speed = 255;

    if(tapEnd == 1) {
        outputRight = outputLeft = 0;
        tapEnd = 0; 
    } else {
        if(angle >= 10 && angle <= 85) {
            outputRight = (angle/85)*speed;
            outputLeft = speed;
        } else if(angle > 85 && angle < 95) {
            outputLeft = outputRight = speed;
        } else if(angle >= 95 && angle <= 160) {
            outputRight = speed;
            outputLeft = ((180-angle)/80)*speed;
        } else if(angle > 160 && angle < 200) {
            outputRight = speed;
            directionRight = 1;
            outputLeft = speed;
            directionLeft = 0;
        } else if(angle >= 200 && angle <= 265) {
            outputRight = speed;
            outputLeft = ((angle-180)/80)*speed;
        } else if(angle > 265 && angle < 275) {
            outputRight = outputLeft = speed;
        } else if(angle >= 275 && angle <= 340) {
            outputRight = ((360-angle)/80)*speed;
            outputLeft = speed;
        } else if(angle > 340 || angle < 20) {
            outputRight = speed;
            directionRight = 0;
            outputLeft = speed;
            directionLeft = 1;
        } 

    }

    $('#pos-x').html('x: ' + x + 'px');
    $('#pos-y').html('y: ' + y + 'px');
    $('#speed').html('Hastighet: ' + speed);
    $('#angle').html('Vinkel: ' + angle);
    $('#output-left').html('Pådrag V: ' + Math.round(outputLeft));
    $('#output-right').html('Pådrag H: ' + Math.round(outputRight));

    $("#sliderLeft").val(outputLeft);
    $("#sliderRight").val(outputRight);


    outputRight *= speedCoeff;
    outputLeft *= speedCoeff;

    charVal[10] = outputRight;          // Motor 1
    charVal[14] = directionRight;

    charVal[11] = outputLeft;           // Motor 2
    charVal[15] = directionLeft;

    charVal[12] = outputLeft;           // Motor 3
    charVal[16] = directionLeft;

    charVal[13] = outputRight;          // Motor 4
    charVal[17] = directionRight;

    console.log('params set');



    if( readWriteCharacteristic &&  (writePermission == 1) && (priorityPacket != 1) && !local) {
        writePermission = 0;

        return readWriteCharacteristic.writeValue(charVal)
                .then( writeReturn => {
                    writePermission = 1;
                    console.log('Sendt: ' + charVal);
            });
    } else {
        // Pushes arrays that were never sent to a discarder packets array to use in debugging
        discardedPackets.push(charVal);
    }
});

// Make sure the car stops when the joystick is released
$('#joystick-container').on("touchend", function() {
    tapEnd = 1;
    charVal[10] = 0;
    charVal[11] = 0;
    charVal[12] = 0;
    charVal[13] = 0;
    priorityWrite(charVal);
});



//////////////////////////////////////////////*
//                                          //*
//            Game administration           //*
//                                          //*
//////////////////////////////////////////////*

//**
//      Function that creates a new game sessions with it's own 'unique' ID (not really unique, but unique enough for this purpose..)
//**

function createGame() {

    // Check that it's actually allowed to create a new game session before initiating. Two sessions may not be initiated by the same player at once.
    if(allowCreate) {
        // Prevents multiple games being created 
        allowCreate = 0;

        // Variables needed to time the start of the game for all players
        var countDown = timeToJoin;

        // Sets text to be shown while game is being created and
        $('#message-container').fadeIn(300);
        $('#message').text('Creating...');

        // Send AJAX request to PHP page that creates game ID and entry in database. Object with player and game information is returned as JSONP
        // to avoid cross-domain issues. Should consider to use JSON if the php page may run on local server.

        //$.getJSON('php/game.php?t=create&ttj=' + timeToJoin + '&pname=' + name + '&l=' + score + '&callback=?', function(r) { 

        $.getJSON('https://cpanel2.proisp.no/~stangtqr/pwt/game.php?t=create&ttj=' + timeToJoin + '&pname=' + name + '&l=' + score + '&callback=?', function(r) { 

            // Returned object is stored to global variables for easy access for all functions
            console.log(r);
            console.log(r.name);
            score = r.score;
            name = r.name;
            gameId = r.gameId;
            playerId = r.id;

            // Push new gameId to #message so other players may see it and join in
            $('#message').fadeOut(500).promise().done( function() {
                $(this).text(gameId).fadeIn(500);
            });

        });

        // Starts timer before startgame() is called. Really bad solution, and should be replaced by a promise chained to the countdown clock itself.
        $('#game-info').show();
        setTimeout(function() {
            startGame();
        }, 1000*countDown+1);

        // Countdown clock 
        // The timing works well in testing, but should be replaced by a more sophisticated solution to compensate for possible delayed requests for other player
        $('#game-info').text('Game starts in ' + countDown);
        var countDownInterval = setInterval(function() {
            if(countDown > 1) {
                countDown--;
                $('#game-info').text('Game starts in ' + countDown);
            } else {
                $('#game-info').slideToggle('slow');
                clearInterval(countDownInterval);
            }
        }, 1000);
    }
}

//**
//      Functions that displays a text input where a player can enter game ID to join a game created by another player
//**

function joinGamePopup(fail = 0) {
    var input = `   
                    <div id="join-fail"></div>
                    <input type='text' id='game-id' placeholder='GAME ID' maxlength='5' size='5' autofocus>
                    <div id="btn-join-container">
                        <div id='btn-join-popup' class='msg-button'>
                            Join
                        </div>
                        <div id="btn-return" class="msg-button" onclick="restartGame()">
                            Return
                        </div>
                    </div>`;

    $('#message-container').css('box-shadow', '0px 0px 20px 0px rgba(0, 0, 0, 0.3)');
    $('#message').html(input).fadeIn(500);
    if(!fail) {
        $('#message-container').fadeIn(500);
    } else {
        $('#message-container').css('box-shadow', '0px 0px 40px 0px rgba(204,41,0, 0.9)');
        $('#join-fail').text('').fadeOut(100).promise().done( function() {   
            $(this).text("Could not join the game. Please try again.").fadeIn(500);
        });
    }


    $('#btn-join-container').fadeIn(500);
    $('#btn-join-popup').on('touchstart mousedown', function() {
        var pin = $('#game-id').val();
        $('#game-info').fadeOut(300).promise().done(function() {
            joinGame(pin);
        });
    });
}

//**
//      Function that allows the player to join a game created by another player. Called by joinGamePopup() where the game ID is submitted.
//**
//**    @parameter       gId        the ID2 of the game the player wants to join

function joinGame(gId) {

    // #message fades out
    $('#message').fadeOut(100).promise().done( function() {

        // All html content of #message (most likely a text input and a button) is replaced
        $('#message').html("Joining...");
        $('#message').fadeIn(500).promise().done( function() {

            // AJAX request to php file that taes care of the database connection and makes sure that the new player gets a playerId in return
            // and is connected to the right game session
            // JSONP is used to avoid cross-domain issues when php page is placed on a diffrent domain than this script. Consider to replace by JSON if not needed.
            $.getJSON('https://cpanel2.proisp.no/~stangtqr/pwt/game.php?t=join&gid=' + gId + '&pname=' + name + '&callback=?', function(r) { 
            //$.getJSON('php/game.php?t=join&gid=' + gId + '&pname=' + name + '&callback=?', function(r) { 

                // Check if the game had started or did'nt exist and therefore could not be joined
                if(r.gameStatus == 'not_exist' || r.gameStatus == 'started') {
                    $('#message').fadeOut(500).promise().done( function() {
                        joinGamePopup(1);
                    });
                    
                } else {

                    // If the php file was able to connect the player to the game, information from the returnerd object is stored i global variables
                    console.log(r);
                    score = r.score;
                    name = r.name;
                    gameId = r.gameId;
                    playerId = r.id;

                    // This is an attempt to time the start of the game and sync all players. Works fine in tests, but by no means good enough
                    // and should be replaced. In short, it uses the php server's timestamp to sync the new players joining the game, and is therefore 
                    // exposed to delays over the network. The player who created the game has a countdown based on the browser's timestamp. 
                    // And because of this, syncing is more luck than skill everytime it works, and is doomed to fail, and sometimes badly so, from time to time.
                    var countDown = r.countdown;

                    // Push to #message as confirmation that the game is successfully joined
                    $('#message').fadeOut(1000, function() { 
                        $(this).text("You're in!").fadeIn(1000)
                    });

                    // Countdown clock, with the drawbacks previusly mentioned
                    $('#game-info').text('Game starts in ' + countDown);
                    var countDownInterval = setInterval(function() {
                        if(countDown > 1) {
                            countDown--;
                            $('#game-info').text('Game starts in ' + countDown);
                        } else {

                            // When the countdown is done, hide the counter and attached message and prevent further updates by clearing interval
                            $('#game-info').slideToggle('slow');
                            clearInterval(countDownInterval);

                            // Start the game
                            startGame();
                        }
                    }, 1000);
                }
            });
        });
    });
}

//**
//      Function called when the countdown to game start runs out and triggers it
//**
//**    The player will now be able to control the car, and the browser starts polling the server via updateGame()

function startGame() {

    // Array that contains start messages
    var startMsg = ['Ready...', 'Set...', 'Go!'];

    // The repeat variable has to be set outside the function where it's first assigned to make it accessible for the startMesssages() function
    var repeat;
    var n = 0;

    // Hide the content in #message by setting the text opacity to 0
    $('#message').css({'color': 'rgba(0, 0, 0, 0)', 'transition': 'color 1s'});

    // Runs updateGame() one single time to check if other players have joined the game.
    // updateGame() returns a promise with the following alternative values when resolved: 'updated', 'finished', 'single_player'
    // If the creator is the only player, a popup will appear with an option to enter single player mode
    if(!singlePlayer) {
        updateGame()
        .then( status => {
            console.log('status: ', status);
            if(status != 'single_player') {
                repeat = setInterval(function() { 
                    startMessages();
                }, 1000);
            }
        })
        .catch( e => {
            console.log(e);
        });
    } else {
        repeat = setInterval(function() { 
            startMessages();
        }, 1000);    
    }

    function startMessages() {

        // Loops through the startMsg array and displays them in #message with som fancy transition effects.
        // Use the opacity to fade the text in and out instead hide/show beacause it then keeps its size. 
        $('#message').text(startMsg[n]);
        $('#message').css({'color': 'rgba(255, 255, 255, 1)', 'transition': 'color 0.4s'});
        // Fade out the text after 800 millisecs
            setTimeout(function() {
                $('#message').css({'color': 'rgba(0,0,0,0)', 'transition': 'color 0.4s'});
            }, 600);
        
        console.log(n);
        n++;

        if(n >= startMsg.length) {
            clearInterval(repeat);
            // When the excitement reaches its peak during the start messages, the following hides the #message-container and brings in the game controllers
            // and other elements within the .wait-till-game class
            setTimeout(function() {
                $('#message-container').fadeOut('fast');
                $('.wait-till-game').show('fast');
            }, 800);

            // Allow the players to control the car and shoot, and let the game begin!
            writePermission = 1;
            gameOn = 1;

            // Start updating the game status if the game is not single player
            if(!singlePlayer)
                updateGame();
        } 
    }
}

//**
//      Function that updates the game info at a given interval set in the updatePeriod variable. By default every 2 seconds. 
//**

var firstUpdate = 1;
function updateGame() {
    return new Promise(function(resolve, reject) {
        sendRequest();
        function sendRequest() {
            //  AJAX request to php-file that communicates with database and handles information about all the players 
            //  in each game session and returned updated player object and game status
            //  Is set up to use JSONP to handle cross-domain issues if necessary. Should consider to be removed and replaced by JSON if not needed.
            //  Other options are to use WebSocket or long polling instead of frequent AJAX requests in cases when possible
            $.getJSON('https://cpanel2.proisp.no/~stangtqr/pwt/game.php?t=u&gid=' + gameId + '&pid=' + playerId + '&pname=' + name + '&l=' + score + '&callback=?', function(r) {
            //$.getJSON('php/game.php?t=u&gid=' + gameId + '&pid=' + playerId + '&pname=' + name + '&l=' + score + '&callback=?', function(r) {

                //  Checking the gameStatus property of the received object to see if game is still active
                //  The game is active as long as the status is 10. As soon as only one player still has points left, the returnes gameStatus
                //  changes to this player's ID
                if(firstUpdate != 0 && r.gameStatus == 1) {
                    // If the first update returns that the player who created the game has won, it means that no other players joined the game in time
                    // The player will then be presented a message with question to drive about a bit in single player mode 
                    gameOn = 0;
                    setTimeout(function() {
                        singlePlayerPopup();
                    }, 1000);
                    console.log('single');
                    resolve('single_player');
                } else if(r.gameStatus == 10) {
                    if(score <= 0)
                        // The game is active, but the players is out of points
                        gameLost('active');
                    else {
                        // The game is still active, and the player has more lives left
                    }
                    resolve('updated');
                } else if(r.gameStatus != 10) {
                    //  Since the status is no longer 10, ie the game is over, perform check to see if the player has won or lost the game, 
                    //  and call functions accordingly
                    if(r.gameStatus == playerId) {
                        // The game is over and player won the game
                        gameWon();
                    } else {
                        // The game is over and another player won
                        gameLost();
                    }
                    resolve('finished');
                }
                firstUpdate = 0;
                // Debug
                console.log(r);
            });
            // Update every given interval as long as the game is ongoing, which is as long as gameStatus is 10 in the returned JSONP in this function
            if(gameOn) {
                setTimeout(function() {
                    if(gameOn)
                        sendRequest();
                }, updateInterval);
            }
        }
    });
}



//**
//      When a game is over, this function the opportunity to create a new game without reloading the page and thus maintaining the Bluetooth connection 
//**
//**    If a new game is created, a new gameId is now set and the players will have to rejoin the new session even if they were part of the previous one

function restartGame() {
    // Allow the player to create a new game
    allowCreate = 1;

    // Stop the ongoing game and gameUpdate() 
    gameOn = 0;

    // Avoid cached version of the controllers-file
    var time = new Date();
    var e = time.getTime();

    // AJAX request to restart the game session without interefering with the Bluetooth connection
    $('.column').load('include/controllers.html?t=' + e);    
}

//**
//      Popup-menu opened when a player creates a game and no other players join in time
//**

function singlePlayerPopup() {

    var input = `   <div class='msg'>
                        <h1>Oh no!</h1>
                        It seems noone joined the game in time. Do you want to enter singleplayer mode?
                    </div>
                    <div id='btn-singleplayer' class='msg-button' onclick='startSingleplayer();'>Singleplayer Mode</div>
                    <div id='btn-main-menu' class='msg-button' onclick='restartGame();'>Main Menu</div>`;

    
    $('#message-container').fadeOut(500).promise().done(function() {
        $('#message').html(input);
        $('#message-container').fadeIn(500).promise().done(function() {
            $('#message').fadeIn(1000);
        });
    });    

}

//**
//      If a player wants to just drive the car without creating a new game, this function is called
//**
  
function startSingleplayer () {     
    singlePlayer = true;        
    $('#message').html('s').fadeIn(500).promise().done(function() { 
        startGame();   
        $('#message-container').fadeIn(500);
    });
         
};


//////////////////////////////////////////////*
//                                          //*
//         The-game-itself-functions        //*
//                                          //*
//////////////////////////////////////////////*


function notificationCallback(dataArray) {  
    // var test = dataArray.length == prevNotificationArray.length && dataArray.every(function(v,i) { return v === prevNotificationArray[i]});
    // console.log(test);
    if(gameOn && (!preventShot)) {
        preventShot = 1;
        setTimeout(function() {
            preventShot = 0;
        }, timeBetweenHits);
        if(gameOn == 1) {
            score--;
            $('#points').text('♥ ' + score);
            console.log(score);
        }
        if(score < 0) {
            score = 0;
        }
        console.log('Notification mottatt: ' + dataArray + ' tidligere: ' + prevNotificationArray);
    } else {
        console.log('Uendret notification mottatt: ' + dataArray);
    }
    prevNotificationArray = dataArray;
}

//**
//      Function called when the player wins a game
//**

function gameWon() {   
    gameOn = 0;

    charVal[10] = 0;
    charVal[11] = 0;
    charVal[12] = 0;
    charVal[13] = 0;

    if(!local) {
        console.log('lost');
        priorityWrite(charVal);
        writePermission = 0;
    }
    $('#message-container').html('You won :)');
    $('#message-container').fadeIn('slow');
}


//**
//      Function called when the player loses a game
//**

function gameLost(status = "") {   
    gameOn = 0;

    charVal[10] = 0;
    charVal[11] = 0;
    charVal[12] = 0;
    charVal[13] = 0;

    if(!local) {
        console.log('lost');
        priorityWrite(charVal);
        writePermission = 0;
    }
    $('#message-container').html('You lost :(');
    $('#message-container').fadeIn('slow');

        
}


//**
//      Function to add 'shooting' functionality. Is called when the fire button is pushed
//**

function shoot() {
    if(!coolDownStatus) {
        coolDownStatus = 1;
        if(!local) {
            setBit(1, 0, 1);
            console.log('shoot');
            priorityWrite(charVal);
            setTimeout(function() {
                setBit(1,0,0);
                console.log('shoot off');
                priorityWrite(charVal);
            }, 50);
        }
        coolDown();
    }
}



//**
//      Function to ensure that a player can't shoot again before a certain time has passed. The 'cool-down time' is set in the timeOute variable [ms]
//**

function coolDown() {

    var timeOut = coolDownPeriod;
    var e = document.getElementById("cool-down-bar");   
    var width = 1;
    var interval = setInterval(coolDownCounter, timeOut/100);
    coolDownStatus = 1;
    function coolDownCounter() {
        if (width >= 100) {
            clearInterval(interval);
            coolDownStatus = 0;
            e.style.backgroundColor = '#367d59';
        } else {
            width++; 
            e.style.width = width + '%'; 

            if(width <= 35)
                e.style.backgroundColor = 'red';
            else if(width <= 90)
                e.style.backgroundColor = 'orange';
            else
                e.style.backgroundColor = '#367d59';
        }
    }
}


//** Print to console array containing packets that's not been sent  **/

function printDiscardedPackets() {
    console.log(discardedPackets);
}


//**
//      Buttons and actions
//**

$('#control-button').on('touchstart mousedown', function(event) {
    $(this).css({'box-shadow': '0px 0px 10px 3px rgba(0,0,0, 0.2)', 'height': '115px', 'width': '115px', 'transition-timing-function' : 'ease'});
    event.preventDefault();
    if(coolDownStatus != 1)
        shoot();
});

$('#control-button').on('touchend mouseup', function() {
    $(this).css({'box-shadow': '0px 0px 30px 10px rgba(0,0,0, 0.15)', 'height': '120px', 'width': '120px', 'transition-timing-function' : 'ease'});
    if(!local) {
        priorityWrite(charVal);
    }
});

$('#btn-create-game').on('touchstart mousedown', function(event) {
    createGame();
    event.preventDefault();
});

$('#btn-join-game').on('touchstart mousedown', function(event) {
    joinGamePopup();
    event.preventDefault();
});

$('#btn-restart-game').on('touchstart mousedown', function(event) {
    restartGame();
    event.preventDefault();
});

$('#btn-slotmachine').on('touchstart mousedown', function(event) {
    console.log('h');
    startSlot();
    toggleGameMenu();
    event.preventDefault();
});

// This 'sim-hit' button triggers the same events with the same parameters as would be the case if the player's car was 'hit' by IR
$('#btn-sim-hit').on('touchstart mousedown', function(event) {
    var hitArray = new Uint8Array(20);
    hitArray[1] = 1;
    notificationCallback(hitArray);
    event.preventDefault();
});

$('#btn-gamemenu-container').on('touchstart mousedown', function(event) {       
    $('#btn-gamemenu-container').fadeOut("slow");       
});     
$('#btn-return').on('touchstart mousedown', function(event) {  
    $('#message-container').fadeOut("slow").promise().done(function() {
        $('.column').load('include/controllers.html');
    });  
});     
$('#btn-singleplayer').on('touchstart mousedown', function(event) {     
    startSingleplayer();        
});   

// Set transition time for cool-down-bar. Placed here instead of static CSS to give a more sensible transition time based on the chosen coolDownPeriod
$('#cool-down-bar').css('transition', 'background-color ' + coolDownPeriod*3/5000 + 's');

$('.wait-till-game').css('visibility', 'visible');
$('.wait-till-game').hide();

// Populate the #points with the score (needs 'manual' update incase it is changed by joining a game with different settings than set here)
$('#points').text('♥ ' + score);


$('#btn-menu').on('touchstart mousedown', function (event) {
    toggleGameMenu();
    event.preventDefault();
});

function toggleGameMenu() {
    if (gameMenuDown == true){
        $('#slide-menu').animate({height: "60px"},'slow');
        $('#btn-menu').animate({bottom: "37px"},'slow');
        
        gameMenuDown = false;
    }
    else if (gameMenuDown == false){
        $('#slide-menu').animate({height: "0px"},'slow');
        $('#btn-menu').animate({bottom: "10px"},'slow');
        
        gameMenuDown = true;
    }
};

$('#btn-exit').on('touchstart mousedown', function (event) {
    $('.column').load('include/controllers.html?t=' + e);
});



