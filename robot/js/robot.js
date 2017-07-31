// This script is dependent on ble.js and visual.js

/*jshint esversion: 6 */

var logEnabled = logEnabled | true;

const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const ROBOT_ACTION_BYTE_INDEX   = 0;

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

var bleBusy = false;
var bleData = new Uint8Array(20);

function onConnect() {
    qs("#connect-wrapper").style.display = "none";
    qs("#disconnect-wrapper").style.display = "block";
    qs("h1").style.fontSize = "35px";
    qs("#header-wrapper").style.marginTop = "15px";
    fade.in("#content-inner-wrapper");
}

var shakeEvent = new Shake({
    threshold: 15,
    timeout: 1000
});

shakeEvent.start();

function onShakeEvent() {
    sendRobotAction(ROBOT_DANCE);
}

// Event listeners

window.addEventListener('shake', onShakeEvent, false);

clickListener("#connect-btn", function() {
    ble.connect(serviceUUID, characteristicUUID)
    .then( () => {
        if(ble.isConnected())
            onConnect();
    })
    .catch( error => {
        console.log("Error: " + error);
    });
});

clickListener("#disconnect-btn", function() {
    ble.disconnect()
    .then( () => {
        console.log("Device disconnected gracefully");
        window.location.reload();
    } );
});

clickListener("#robot-move-head-forward", () => { sendRobotAction(MOVE_HEAD_FORWARD); });
clickListener("#robot-move-head-left", () => { sendRobotAction(MOVE_HEAD_LEFT); });
clickListener("#robot-move-head-right", () => { sendRobotAction(MOVE_HEAD_RIGHT); });
clickListener("#robot-move-head-side-to-side", () => { sendRobotAction(MOVE_HEAD_SIDE_TO_SIDE); });
clickListener("#robot-move-right-hand-up", () => { sendRobotAction(MOVE_RIGHT_HAND_UP); });
clickListener("#robot-move-right-hand-down", () => { sendRobotAction(MOVE_RIGHT_HAND_DOWN);});
clickListener("#robot-move-left-hand-up", () => { sendRobotAction(MOVE_LEFT_HAND_UP); });
clickListener("#robot-move-left-hand-down", () => { sendRobotAction(MOVE_LEFT_HAND_DOWN); });
clickListener("#robot-wave-hand", () => { sendRobotAction(WAVE_HAND); });
clickListener("#robot-dance", () => { sendRobotAction(ROBOT_DANCE); });
// clickListener("#robot-cheer", () => { sendRobotAction(CHEER); });

// Helper functions

function sendRobotAction(action) {
    bleData[ROBOT_ACTION_BYTE_INDEX] = action;
    return ble.sendData(bleData);
}

function qs(selector) {
    return document.querySelector(selector);
}

function clickListener(el, cb) {
    qs(el).addEventListener("click", cb);
}
