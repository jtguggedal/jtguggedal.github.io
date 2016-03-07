
            var charVal = new Uint8Array(20);
 
            var allowCreate = 1;

            var coolDownPeriod = 1000;


            var outputRight;
            var outputLeft;
            var tapEnd = 1;

            var writePermission = 1;
            var discardedPackets = [];

            var priorityPacket = 0;

            var gameOn = 1;
            var score = 10;
            var coolDownStatus = 0;

            var local = 0;

            var timeToJoin = 10;
               
                          
            $('#LEDp').on("click change tapend", function() {
                setBit(1,'b',240);
                if(tapEnd == 1) {
                    writeToCharacteristic(1, 240, charVal);
                }

            })
                               
            $('#LEDa').on("click change tapend", function() {
                setBit(1,'b',0);
                if(tapEnd == 1) {
                    writeToCharacteristic(1, 0, charVal);
                }

            })
                               
          

            //** Print to console array containing packets that's not been sent  **/

            function printDiscardedPackets() {
                console.log(discardedPackets);
            }

            //*** Joystick  ***/
            var joystickContainer = document.getElementById('joystick-container');
            var joystick = new VirtualJoystick({
                                    container: joystickContainer,
                                    mouseSupport: true,
                                    stationaryBase: true,
                                    baseX: 110,
                                    baseY: 170,
                                    limitStickTravel: true,
                                    stickRadius: 100
                               });
                
            $('#joystick-container').on('change touchmove mousemove', function() {
                var x = joystick.deltaX(); 
                var y = -1*joystick.deltaY();
                var hypotenus = Math.sqrt((Math.pow(x, 2)) + (Math.pow(y, 2)));
                var speed = Math.round((255/100)*hypotenus);
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
                    setInterval(function() {
                        if(countDown > 1) {
                            countDown--;
                            $('#game-info').text('Game starts in ' + countDown);
                        } else {
                            $('#game-info').fadeOut('slow');
                        }
                    }, 1000);
                }
            }


            function startGame() {
                // Visual stuff
                var startMsg = ['Ready!', 'Set!', 'Go!'];
                var i = 0;

                var repeat =    setInterval(function() {
                                    startMessages();
                                }, 1000);

                function startMessages() {
                    if(i < 3) {
                        console.log(i);
                        $('#message').text(startMsg[i]);
                        i++;
                    } else {
                        clearInterval(repeat);
                        $('#message-container').fadeOut('slow');
                        $('.wait-till-game').show('fast');
                        $('#joystick-container').show('fast');
                    }
                }
            }

            function restartGame() {
                allowCreate = 1;
                var time = new Date();
                var e = time.getTime();

                //connect();
                $('.column').load('include/controllers.html?t=' + e);    
            }




            //**
            //      Game functions 
            //**

            function notificationCallback(dataArray) {  

                if(coolDownStatus != 1) {

                    if((dataArray[0] == 1 || dataArray[1] == 1 || dataArray[2] == 1 || dataArray[3] == 1) && (gameOn == 1)) {
                        score--;
                        $('#points').text('♥ ' + score);
                        console.log(score);
                    }

                    if(score <= 0) {
                        gameOn = 0;
                        gameLost();
                    }
                }
            }


            function gameLost() {   
                gameOn == 0;

                charVal[10] = 0;
                charVal[11] = 0;
                charVal[12] = 0;
                charVal[13] = 0;

                if(!local) {
                    priorityWrite(charVal);
                    writePermission = 0;
                }
                $('#message-container').text('You lost :(');
                $('#message-container').fadeIn('slow');



            }

            // Function to add 'shooting' functionality. Is called when the fire button is pushed.
            function shoot() {
                if(!coolDownStatus) {
                    if(!local) {
                        setBit(1, 0, 1);
                        priorityWrite(charVal);
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


            //
            //** Buttons and actions
            //

            $('#control-button').on('touchstart mousedown', function(event) {
                $(this).css({'box-shadow': '0px 0px 10px 3px rgba(0,0,0, 0.2)', 'height': '115px', 'width': '115px', 'transition-timing-function' : 'ease'});
                event.preventDefault();
                if(!coolDownStatus)
                    shoot();

            });

            $('#control-button').on('touchend mouseup', function() {
                $(this).css({'box-shadow': '0px 0px 30px 10px rgba(0,0,0, 0.15)', 'height': '120px', 'width': '120px', 'transition-timing-function' : 'ease'});
                if(!local && !coolDownStatus) {
                    setBit(1,0,0);
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



