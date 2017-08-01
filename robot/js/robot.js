// This script is dependent on ble.js and visual.js

/*jshint esversion: 6 */

var logEnabled = logEnabled | true;

const serviceUUID               = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID        = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

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

var robotActions = [
    {element: qs("#robot-move-head-forward"), seq: [], action: MOVE_HEAD_FORWARD, time: 1000},
    {element: qs("#robot-move-head-left"), seq: [], action: MOVE_HEAD_LEFT, time: 1000},
    {element: qs("#robot-move-head-right"), seq: [], action: MOVE_HEAD_RIGHT, time: 1000},
    {element: qs("#robot-move-head-side-to-side"), seq: [], action: MOVE_HEAD_SIDE_TO_SIDE, time: 3000},
    {element: qs("#robot-move-right-hand-up"), seq: [], action: MOVE_RIGHT_HAND_UP, time: 2000},
    {element: qs("#robot-move-right-hand-down"), seq: [], action: MOVE_RIGHT_HAND_DOWN, time: 2000},
    {element: qs("#robot-move-left-hand-up"), seq: [], action: MOVE_LEFT_HAND_UP, time: 2000},
    {element: qs("#robot-move-left-hand-down"), seq: [], action: MOVE_LEFT_HAND_DOWN, time: 2000},
    {element: qs("#robot-wave-hand"), seq: [], action: WAVE_HAND, time: 6000},
    {element: qs("#robot-dance"), seq: [], action: ROBOT_DANCE, time: 6000}
];

var actionQueue = [];
var seqNumber = 0;
var bleData = new Uint8Array(20);
var sendSequence = false;


// BLE

function onConnect() {
    qs("#connect-wrapper").style.display = "none";
    qs("#disconnect-wrapper").style.display = "block";
    qs("h1").style.fontSize = "35px";
    qs("#header-wrapper").style.marginTop = "15px";
    fade.in("#content-inner-wrapper");}

// Robot action sequences

function addToSequence(e) {
    if(seqNumber < 9) {
        robotActions.forEach( item => {
            if(item.element == e.target) {
                seqNumber++;
                item.seq.push(seqNumber);
                actionQueue.push({action: item.action, time: item.time});
            }
        });
        updateSeqNumbers();
    }
}

function updateSeqNumbers() {
    robotActions.forEach( function(item) {
        //if(item.seq.length > 0)
        item.element.querySelector(".sequence-number").innerHTML = item.seq.join(", ");
    });
}

function sequenceExecute() {
    let sumTime = 0;
    actionQueue.forEach((item, index) => {
        setTimeout(function() {
            doSequenceAction(item.action);
        }, sumTime + item.time);
        sumTime += item.time;
    });
    setTimeout(function() {
        actionQueue = [];
        sequenceReset();
        console.log("All actions in queue performed, queue is empty: ", actionQueue);
    }, sumTime);
}

function doSequenceAction(action) {
    sendRobotAction(action);
    console.log("Performing command: ", action);
}

function sequenceReset() {
    seqNumber = 0;
    robotActions.forEach(i => {i.seq = []});
    queue = [];
    updateSeqNumbers();
}

function showSequenceControls() {
    qs("#sequence-controls").style.display = "block";
}

function hideSequenceControls () {
    qs("#sequence-controls").style.display = "none";

}

// Shake
var shakeEvent = new Shake({
    threshold: 15,
    timeout: 1000
});

shakeEvent.start();

function onShakeEvent() {
    sendRobotAction(ROBOT_DANCE);
}


// Helper functions

function sendRobotAction(action) {
    bleData[ROBOT_ACTION_BYTE_INDEX] = action;
    return ble.sendData(bleData);
}


// Event listeners

window.addEventListener('shake', onShakeEvent, false);

clickListener("#connect-btn", function() {
    ble.connect(serviceUUID, characteristicUUID, true)
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

clickListener("#robot-move-head-forward", (e) => {
    if(sendSequence) sendRobotAction(MOVE_HEAD_FORWARD);
    else addToSequence(e);
});
clickListener("#robot-move-head-left", (e) => {
    if(sendSequence) sendRobotAction(MOVE_HEAD_LEFT);
    else addToSequence(e);
});
clickListener("#robot-move-head-right", (e) => {
    if(sendSequence) sendRobotAction(MOVE_HEAD_RIGHT);
    else addToSequence(e);
});
clickListener("#robot-move-head-side-to-side", (e) => {
    if(sendSequence) sendRobotAction(MOVE_HEAD_SIDE_TO_SIDE);
    else addToSequence(e);
});
clickListener("#robot-move-right-hand-up", (e) => {
    if(sendSequence) sendRobotAction(MOVE_RIGHT_HAND_UP);
    else addToSequence(e);
});
clickListener("#robot-move-right-hand-down", (e) => {
    if(sendSequence) sendRobotAction(MOVE_RIGHT_HAND_DOWN);
    else addToSequence(e);
});
clickListener("#robot-move-left-hand-up", (e) => {
    if(sendSequence) sendRobotAction(MOVE_LEFT_HAND_UP);
    else addToSequence(e);
});
clickListener("#robot-move-left-hand-down", (e) => {
    if(sendSequence) sendRobotAction(MOVE_LEFT_HAND_DOWN);
    else addToSequence(e);
});
clickListener("#robot-wave-hand", (e) => {
    if(sendSequence) sendRobotAction(WAVE_HAND);
    else addToSequence(e);
});
clickListener("#robot-dance", (e) => {
    if(sendSequence) sendRobotAction(ROBOT_DANCE);
    else addToSequence(e);
});
// clickListener("#robot-cheer", (e) => { sendRobotAction(CHEER); });

clickListener("#sequence-switch", function() {
	sendSequence = qs("#switch").checked;
    if(sendSequence) {
        showSequenceControls();
    } else {
        hideSequenceControls();
    }

});

clickListener("#sequence-btn-send", sequenceExecute);
clickListener("#sequence-btn-reset", sequenceReset);


// Helper functions

function qs(selector) {
    return document.querySelector(selector);
}

function clickListener(el, cb) {
    qs(el).addEventListener("click", cb);
}
