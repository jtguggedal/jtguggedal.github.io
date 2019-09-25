/*jshint esversion: 6 */

const PRINT_CONTROLLER_DATA     = false;
const DEFAULT_THROTTLE_VALUE    = 128;
const DEFAULT_TURN_VALUE        = 128;
const MAX_THROTTLE              = 255;
const MAX_TURN_RATE             = 255;
const CMD_BYTE                  = 0;
const CMD_CAR_DATA              = 100;
const THROTTLE_BYTE_OFFSET      = 4;
const TURN_BYTE_OFFSET          = 5;


var bleBusy = false;

var bleDataArray = new Uint8Array(10);

var elThrottleRange = document.querySelector("#throttle-value");
//var elThrottleOutput = document.querySelector('#throttle-value-output');
var elTurnRange = document.querySelector("#turn-value");
//var elTurnOutput = document.querySelector('#turn-value-output');
var elConnectBtn = document.querySelector('#connectBtn');


function onConnect() {
    var h1 = document.querySelector('h1');
    elConnectBtn.style.background = "rgba(4, 113, 83, 0.8)";
    document.querySelector('#controllers-wrapper').style.display = "block";
    h1.style.fontSize = "30px";
    h1.style.marginTop = "20px";
    elConnectBtn.style.margin = "0 auto";
    elConnectBtn.style.padding = "0 1px";
    elConnectBtn.style.width = "100px";
    elConnectBtn.style.fontSize = "16px";
    elConnectBtn.style.position = "absolute";
    elConnectBtn.style.top = "10px";
    elConnectBtn.style.right = "10px";
    elConnectBtn.innerHTML = "Connected";
    qs("#cam-controllers-wrapper").style.display = "block";
    document.documentElement.webkitRequestFullscreen();
    setTimeout(function() {
        startStream();
    }, 3000);
}


elConnectBtn.addEventListener("click", function() {
    connect(function(){
        connected = true;
        onConnect();
    });
});

elThrottleRange.addEventListener("input", function() {
    bleDataArray[CMD_BYTE] = CMD_CAR_DATA;
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    displayThrottleAngle();
    if(!bleBusy && !priorityWaiting) {
        bleBusy = true;
        sendData(bleDataArray)
        .then(() => {
            bleBusy = false;
            if(PRINT_CONTROLLER_DATA)
                console.log("Sent data ", bleDataArray);
        });
    }

});


elThrottleRange.addEventListener("touchend", function() {
    elThrottleRange.value = DEFAULT_THROTTLE_VALUE;
    bleDataArray[CMD_BYTE] = CMD_CAR_DATA;
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    stopCar();
});

elTurnRange.addEventListener("input", function() {
    bleDataArray[CMD_BYTE] = CMD_CAR_DATA;
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    if(PRINT_CONTROLLER_DATA)
        console.log("Sent data ", bleDataArray);
    if(!bleBusy && !priorityWaiting) {
        bleBusy = true;
        sendData(bleDataArray)
        .then(() => {
            bleBusy = false;
            if(PRINT_CONTROLLER_DATA)
                console.log("Sent data ", bleDataArray);
        });
    }

});


elTurnRange.addEventListener("touchend", function() {
    elTurnRange.value = DEFAULT_TURN_VALUE;
    bleDataArray[CMD_BYTE] = CMD_CAR_DATA;
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    stopCar();
});

function stopCar() {
    if(!bleBusy) {
        bleBusy = true;
        priorityWaiting = false;
        sendData(bleDataArray)
        .then(() => {
            bleBusy = false;
            if(PRINT_CONTROLLER_DATA)
                console.log("Sent data ", bleDataArray);
        });
    } else {
        priorityWaiting = true;
        setTimeout(function() {
            stopCar();
        }, 20);
    }
}

function displayThrottleAngle() {
    //elThrottleOutput.innerHTML = elThrottleRange.value; // (MAX_THROTTLE*(elThrottleRange.value - 128)/127).toFixed(1);
}


function displayTurnRate() {
    //elTurnOutput.innerHTML = elTurnRange.value; // (MAX_TURN_RATE*(elTurnRange.value - 128)/127).toFixed(1);
}
