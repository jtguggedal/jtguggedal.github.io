
const logEnabled = true;

const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const MOVE_HEAD_FORWARD         = 0x01;
const MOVE_HEAD_LEFT            = 0x02;
const MOVE_HEAD_RIGHT           = 0x03;
const MOVE_HEAD_SIDE_TO_SIDE    = 0x04;
const MOVE_RIGHT_HAND_UP        = 0x05;
const MOVE_RIGHT_HAND_DOWN      = 0x06;
const MOVE_LEFT_HAND_UP         = 0x07;
const MOVE_LEFT_HAND_DOWN       = 0x08;

const WAVE_HAND                 = 0x09;
const ROBOT_DANCE               = 0x10;
const CHEER                     = 0x11;


var connected = false;
var bleBusy = false;

var bleData = new Uint8Array(20);



function callbackOnConnect() {
    connected = true;
}

// Event listeners

clickListener("#connect-btn", function() {
    connect(serviceUUID, characteristicUUID, callbackOnConnect);
});

clickListener("#robot-move-head-forward", () => {
    bleData[0] = MOVE_HEAD_FORWARD;
    sendData(bleData);
});

clickListener("#robot-move-head-left", () => {
    bleData[0] = MOVE_HEAD_LEFT;
    sendData(bleData);
});

clickListener("#robot-move-head-right", () => {
    bleData[0] = MOVE_HEAD_RIGHT;
    sendData(bleData);
});

clickListener("#robot-move-head-side-to-side", () => {
    bleData[0] = MOVE_HEAD_SIDE_TO_SIDE;
    sendData(bleData);
});

clickListener("#robot-move-right-hand-up", () => {
    bleData[0] = MOVE_RIGHT_HAND_UP;
    sendData(bleData);
});

clickListener("#robot-move-right-hand-down", () => {
    bleData[0] = MOVE_RIGHT_HAND_DOWN;
    sendData(bleData);
});

clickListener("#robot-move-left-hand-up", () => {
    bleData[0] = MOVE_LEFT_HAND_UP;
    sendData(bleData);
});

clickListener("#robot-move-left-hand-down", () => {
    bleData[0] = MOVE_LEFT_HAND_DOWN;
    sendData(bleData);
});

clickListener("#robot-wave-hand", () => {
    bleData[0] = WAVE_HAND;
    sendData(bleData);
});

clickListener("#robot-dance", () => {
    bleData[0] = ROBOT_DANCE;
    sendData(bleData);
});

clickListener("#robot-cheer", () => {
    bleData[0] = CHEER;
    sendData(bleData);
});

// Helper functions

function sendData(data) {
    bleBusy = true;
    bleSendData(data)
    .then( () => {
        bleBusy = false;
        if(logEnabled)
            console.log("Succesfully sent ", data);
    });
}

function clickListener(el, cb) {
    document.querySelector(el).addEventListener("click", cb);
}
