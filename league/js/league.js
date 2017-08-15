/*jshint esversion: 6 */

const PRINT_CONTROLLER_DATA = false;
const DEFAULT_THROTTLE_VALUE = 128;
const DEFAULT_TURN_VALUE = 128;
const MAX_THROTTLE = 255;
const MAX_TURN_RATE = 255;
const THROTTLE_BYTE_OFFSET = 0;
const TURN_BYTE_OFFSET = 1;

var connected = false;
var bleBusy = false;

var bleDataArray = new Uint8Array(3);

var elThrottleRange = document.querySelector("#throttle-value");
//var elThrottleOutput = document.querySelector('#throttle-value-output');
var elTurnRange = document.querySelector("#turn-value");
//var elTurnOutput = document.querySelector('#turn-value-output');
var elConnectBtn = document.querySelector('#connectBtn');


function onConnect() {
    elConnectBtn.style.background = "rgba(4, 113, 83, 0.8)";
}


elConnectBtn.addEventListener("click", function() {
    connect(function(){ connected = true; });
});

elThrottleRange.addEventListener("input", function() {
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    displayThrottleAngle();
    if(connected && !bleBusy) {
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
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    displayThrottleAngle();
    if(connected && !bleBusy) {
        bleBusy = true;
        sendData(bleDataArray)
        .then(() => {
            bleBusy = false;
            if(PRINT_CONTROLLER_DATA)
                console.log("Sent data ", bleDataArray);
        });
    }

});

elTurnRange.addEventListener("input", function() {
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    displayTurnRate();
    if(connected && !bleBusy) {
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
    elThrottleRange.value = DEFAULT_TURN_VALUE;
    bleDataArray[THROTTLE_BYTE_OFFSET] = elThrottleRange.value;
    bleDataArray[TURN_BYTE_OFFSET] = elTurnRange.value;
    displayTurnRate();
    if(connected && !bleBusy) {
        bleBusy = true;
        sendData(bleDataArray)
        .then(() => {
            bleBusy = false;
            if(PRINT_CONTROLLER_DATA)
                console.log("Sent data ", bleDataArray);
        });
    }

});

function displayThrottleAngle() {
    //elThrottleOutput.innerHTML = elThrottleRange.value; // (MAX_THROTTLE*(elThrottleRange.value - 128)/127).toFixed(1);
}


function displayTurnRate() {
    //elTurnOutput.innerHTML = elTurnRange.value; // (MAX_TURN_RATE*(elTurnRange.value - 128)/127).toFixed(1);
}
