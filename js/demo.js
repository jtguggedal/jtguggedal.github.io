            
            
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

            //** Game settings
            var score = 10;                     // Number of lives each player starts with
            var timeToJoin = 3;                 // Interval from games is created until it starts [s]
            var coolDownPeriod = 500;           // Shortest allowed interval between shots fired [ms]
            var coolDownStatus = 0;             // Players starts with no need of 'cool down'
            var gameOn = 0;                     // Game is by default not started automatically
            var allowCreate = 1;                // Players are allowed to create their own games

            //** For local testing, set to 1
            var local = 0;



            //**
            //     Joystick, based on nipplejs 
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
                        outputLeft = ((180-angle)/80)*speed;;
                    }  else if(angle > 160 && angle < 200) {
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

    


            $('#joystick-container').on("touchend", function() {
      

                tapEnd = 1;

                charVal[10] = 0;
                charVal[11] = 0;
                charVal[12] = 0;
                charVal[13] = 0;

                        console.log('touchend joystick');
                priorityWrite(charVal);

            });



            //**
            //      Game administration
            //**

            function createGame() {

                if(allowCreate) {
                    // Prevent multiple games being created
                    allowCreate = 0;

                    // Variables needed
                    var countDown = timeToJoin;             // Time to join (in seconds) from game is created before it starts

                    // Sets text to be shown while game is being created externally
                    $('#message-container').fadeIn(300);
                    $('#message').text('Creating...');

                    // Creates XMLHttpRequest object and sends request to PHP page that creates game ID and entry in database
                    /*var xhttp = new XMLHttpRequest();
                    xhttp.onreadystatechange = function() {
                        if (xhttp.readyState == 4 && xhttp.status == 200) {
                            document.getElementById("message").innerHTML = xhttp.responseText;
                        }
                    };
                    xhttp.open("GET", "php/game.php?t=create&ttj=" + timeToJoin, true);
                    xhttp.send();*/

                    // Starts timer before startgame() is called

                    $('#game-info').show();
                    setTimeout(function() {
                        startGame();
                    }, 1000*countDown+1);


                    // Countdown clock
                    
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


            function startGame() {

                // Visual stuff in the startup
                var startMsg = ['Ready...', 'Set...', 'Go!'];
                var i = 0;
                var repeat;

                $('#message').css({'color': 'rgba(0,0,0,0)', 'transition': 'color 0.2s'});
                setTimeout( function() {
                    repeat =    setInterval(function() {
                                    startMessages();
                                }, 1000);
                }, 0);

                function startMessages() {
                    if(i < 3) {
                        $('#message').css({'color': 'rgba(255, 255, 255, 1)', 'transition': 'color 0.2s'});
                        $('#message').text(startMsg[i]);
                        setTimeout(function() {
                            $('#message').css({'color': 'rgba(0,0,0,0)', 'transition': 'color 0.2s'});
                        }, 800);
                        i++;
                    } else {
                        clearInterval(repeat);
                        $('#message-container').fadeOut('slow');
                        $('.wait-till-game').show('fast');

                        // Allow the players to control the car and shoot
                        writePermission = 1;
                        gameOn = 1;
                    }
                }
            }

            function restartGame() {
                allowCreate = 1;
                gameOn = 0;
                var time = new Date();
                var e = time.getTime();

                $('.column').load('include/controllers.html?t=' + e);    
            }




            //**
            //      Game functions 
            //**

            var prevNotificationArray;

            function notificationCallback(dataArray) {  

                if(gameOn && (dataArray != prevNotificationArray)) {

                    if((dataArray[0] == 1 || dataArray[1] == 1 || dataArray[2] == 1 ) && (gameOn == 1)) {
                        score--;
                        $('#points').text('♥ ' + score + ' pin 13: ' + dataArray[0] + ' pin 14: ' + dataArray[1] + ' pin 15: ' + dataArray[2]);
                        console.log(score);
                    }

                    if(score <= 0) {
                        gameOn = 0;
                        gameLost();
                    }

                    console.log('Notification mottatt: ' + dataArray);


                }

                prevNotificationArray = dataArray;
                    console.log('Notification mottatt: ' + dataArray);
            }


            function gameLost() {   
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
                $('#message-container').text('You lost :(');
                $('#message-container').fadeIn('slow');



            }

            // Function to add 'shooting' functionality. Is called when the fire button is pushed.
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

            // Function to ensure that a player can't shoot again before a certain time has passed. The 'cool-down time' is set in the timeOute variable [ms]
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



            //
            //** Buttons and actions
            //

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
            })

            $('#btn-restart-game').on('touchstart mousedown', function(event) {
                restartGame();
                event.preventDefault();
            });


            // This 'sim-hit' button triggers the same events with the same parameters as would be the case if the player's car was 'hit' by IR
            $('#btn-sim-hit').on('touchstart mousedown', function(event) {
                var hitArray = new Uint8Array(20);
                hitArray[1] = 1;
                notificationCallback(hitArray);
                event.preventDefault();
            });

            // Set transition time for cool-down-bar
            $('#cool-down-bar').css('transition', 'background-color ' + coolDownPeriod*3/5000 + 's');

            $('.wait-till-game').css('visibility', 'visible');
            $('.wait-till-game').hide();




