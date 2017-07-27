// This script is dependent on ble.js and visual.js



const logEnabled = true;

const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const ROBOT_ACTION_BYTE_INDEX   = 0x01;

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
    qs("#connect-btn").style.backgroundColor = "rgb(64, 143, 70)";
    qs("#content-inner-wrapper").style.display = "block";
    fadeIn("content-inner-wrapper");
}

// Event listeners


clickListener("#connect-btn", function() {
    connect(serviceUUID, characteristicUUID, callbackOnConnect);
});

clickListener("#robot-move-head-forward", () => { sendRobotAction(MOVE_HEAD_FORWARD); });
clickListener("#robot-move-head-left", () => { sendRobotAction(MOVE_HEAD_LEFT); });
clickListener("#robot-move-head-right", () => { sendRobotAction(MOVE_HEAD_RIGHT); });
clickListener("#robot-move-head-side-to-side", () => { sendRobotAction(MOVE_HEAD_SIDE_TO_SIDE); });
clickListener("#robot-move-right-hand-up", () => { sendRobotAction(MOVE_RIGHT_HAND_UP); });
clickListener("#robot-move-right-hand-down", () => { sendRobotAction(MOVE_RIGHT_HAND_DOWN);});
clickListener("#robot-move-left-hand-up", () => { sendRobotAction(MOVE_LEFT_HAND_UP); });
clickListener("#robot-move-left-hand-down", () => { sendRobotAction(MOVE_LEFT_HAND_DOWN); });
clickListener("#robot-wave-hand", () => { bleData[0] = WAVE_HAND; });
clickListener("#robot-dance", () => { sendRobotAction(ROBOT_DANCE); });
clickListener("#robot-cheer", () => { sendRobotAction(CHEER); });

// Helper functions

function sendRobotAction(action) {
    bleData[ROBOT_ACTION_BYTE_INDEX] = action;
    return sendData(bleData);
}

function sendData(data) {
    bleBusy = true;
    bleSendData(data)
    .then( () => {
        bleBusy = false;
        if(logEnabled)
            console.log("Succesfully sent ", data);
    });
}

function qs(selector) {
    return document.querySelector(selector);
}

function clickListener(el, cb) {
    qs(el).addEventListener("click", cb);
}
