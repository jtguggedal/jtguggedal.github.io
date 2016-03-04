
            var charVal = new Uint8Array(20);
 
            var outputRight;
            var outputLeft;
            var tapEnd = 1;

            var writePermission = 1;
            var discardedPackets = [];

            var priorityPacket = 0;

            var gameOn = 1;
            var score = 10;
               
                          
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
             
                               
            
                       
            ////////////////////////////////////  

           
            // Sjekker i hvilket intervall joysticken er, og sender korresponderende verdi
                

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



                if( readWriteCharacteristic &&  (writePermission == 1) && (priorityPacket != 1)) {
                    writePermission = 0;

                    return readWriteCharacteristic.writeValue(charVal)
                        .then( writeReturn => {
                            writePermission = 1;
                            console.log('Sendt: ' + charVal);
                    });
                } else {
                    discardedPackets.push(charVal);
                }
            });

    


            $('#joystick-container').on("touchend", function() {
      
                /*$('#pos-x').html('x: 0px reset');
                $('#pos-y').html('y: 0px reset ');

                $('#speed').html('Hastighet: 0');
                $('#angle').html('Vinkel: 0');

                $('#output-left').html('Pådrag V: 0');
                $('#output-right').html('Pådrag H: 0');

                $("#sliderLeft").val(0);
                $("#sliderRight").val(0);*/

                tapEnd = 1;

                charVal[10] = 0;
                charVal[11] = 0;
                charVal[12] = 0;
                charVal[13] = 0;


                priorityWrite(charVal);
                    /*setTimeout(function(){
                        if(writePermission)
                            readWriteCharacteristic.writeValue(charVal);
                        else {
                            setTimeout(function(){
                                readWriteCharacteristic.writeValue(charVal);
                            }, 300);
                        }

                    }, 100);*/ 

            });

            $('#control-button').on('touchstart', function(event) {
                $(this).css({'box-shadow': '0px 0px 10px 3px rgba(0,0,0, 0.2)', 'height': '115px', 'width': '115px', 'transition-timing-function' : 'ease'});
                setBit(1, 0, 1);
                priorityWrite(charVal);
                event.preventDefault();

            });

            $('#control-button').on('touchend', function() {
                $(this).css({'box-shadow': '0px 0px 30px 10px rgba(0,0,0, 0.15)', 'height': '120px', 'width': '120px', 'transition-timing-function' : 'ease'});
                setBit(1,0,0);
                priorityWrite(charVal);
            });

            function notificationCallback(dataArray) {

                if((dataArray[0] == 1 || dataArray[1] == 1 || dataArray[2] == 1 || dataArray[3] == 1) && (gameOn == 1)) {
                    score -= 1;
                    $('#points').text(score);
                    console.log(score);
                }

                if(score <= 0) {
                    gameOn = 0;
                    gameLost();
                }
            }

            function gameLost() {   
                gameOn == 0;

                charVal[10] = 0;
                charVal[11] = 0;
                charVal[12] = 0;
                charVal[13] = 0;


                priorityWrite(charVal);

                writePermission = 0;

                $('#points').text('You lost :(');
                $('#points').css('color', 'red');



            }

