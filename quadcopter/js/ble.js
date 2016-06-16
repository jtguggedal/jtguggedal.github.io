//**
//      BLE connection to quadcopter
//

var serviceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
var txCharUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
var rxCharUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
var exCharUUID = '6e400004-b5a3-f393-e0a9-e50e24dcca9e';
var bluetoothDevice;
var mainServer;
var mainService;
var rxChar;
var txChar;
var exChar;
var txContent;
var rxCharVal = new Uint8Array(20);
var exCharVal = new Uint8Array(20);
var prevTx;
var originalPidData;
var writePermission = true;

// Function for connecting to quadcopter
 function connect() {
    'use strict'

    // Options for Bluetooth devices to show in Chooser UI
    var options = { filters:[{ services: [ serviceUUID ]}] };

    // Searching for Bluetooth devices that match the filter criteria
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice(options)
    .then(device => {
        bluetoothDevice = device;

        // Adding event listener to detect loss of connection
        bluetoothDevice.addEventListener('gattserverdisconnected', disconnectHandler);
        console.log('> Found ' + bluetoothDevice.name);
        console.log('Connecting to GATT Server...');

        // Connect to GATT server
        return bluetoothDevice.gatt.connect()
        .then(gattServer => {
            mainServer = gattServer;
            console.log('> Bluetooth Device connected: ');
        });
    })

    // When matching device is found and selected, get the main service
    .then(server => {
        console.log('Getting main Service...');
        return mainServer.getPrimaryService(serviceUUID);
    })
    .then(service => {

        // Storing the main service object globally for easy access from other functions
        mainService = service;
        console.log('> serviceReturn: ' + service);

        // Get characteristics and call handler functions for both
        return Promise.all([
            service.getCharacteristic(txCharUUID)
            .then(characteristic => {
                txChar = characteristic;
                console.log('TX characteristic ok');
            }),
            service.getCharacteristic(rxCharUUID)
            .then(characteristic => {
                rxChar = characteristic
                console.log('RX characteristic ok');
            }),
            service.getCharacteristic(exCharUUID)
            .then(characteristic => {
                exChar = characteristic
                console.log('EX characteristic ok');
            })
        ])
        .then( () => {
            connectionStatus(1);
            var inputs = document.getElementsByTagName('input');
            for( var i = 0; i < inputs.length; i++){
                inputs[i].disabled = false;
            }
        })

        // Print errors  to console
        .catch(error => {
            console.log('>' + error);
        });
    })

    // Print errors  to console
    .catch(error => {
        console.log('Argh! ' + error);
    });
}

// Function to notify when connection to BLE device is established
function connectionStatus(status) {
    if(status == 1)
        document.getElementById("connectionStatus").style.backgroundColor = 'rgb(6, 116, 54)';
    else if(status == 0)
        document.getElementById("connectionStatus").style.backgroundColor = 'rgb(175, 7, 7)';
}

// Function to change the connection status indicator to red when connection is lost
function disconnectHandler() {
    document.getElementById("connectionStatus").style.backgroundColor = 'rgb(175, 7, 7)';
}


/** Function for writing array to the read and write characteristic **/
//  Parameters      charVal             Uint8Array, maximum 20 bytes long
//                  characteristic      BLE characteristic object
function writeArrayToChar(char, data) {
    'use strict';
    return new Promise(function(resolve, reject) {
        if(writePermission) {
            char.writeValue(data)
            .then( () => {
                resolve('Sending successful');
            })
            .catch( (error) => {
                reject('Sending failed', error);
            })
        } else {
            reject('No permission to write');
        }
    })
}
// Give input elements index corresponding to relevant bytes in characteristics
var inputMap = [    'placeholder',
                    '#roll-slave-p', '#roll-slave-i', '#roll-slave-d',
                    '#pitch-slave-p', '#pitch-slave-i', '#pitch-slave-d',
                    '#yaw-slave-p', '#yaw-slave-i', '#yaw-slave-d',
                    '#roll-master-p', '#roll-master-i', '#roll-master-d',
                    '#pitch-master-p', '#pitch-master-i', '#pitch-master-d',
                    '#yaw-master-p', '#yaw-master-i', '#yaw-master-d']


// Get PID values from quadcopter on connect
function readPidData() {
    txChar.readValue()
    .then(originalPid => {

        // Convert from dataView to Uint8Array and save original PID data for possible reset
        originalPidData = new Uint8Array(originalPid.buffer, 0, 20);
        console.log("Original PID data received:", originalPid);

        // Write original PID data to input boxes
        for(var i = 1; i <= 18; i++) {
            select(inputMap[i]).value = rxCharVal[i];
        }
        return originalPidData;
    });
}

// Reset PID values to original
function resetPid() {
    for(var i = 1; i <= 18; i++) {
        select(inputMap[i]).value = originalPidData[i];
    }
}

// Use connect() to connect to quadcopter
addListener('#button-connect', 'click', connect);

// Send throttle and PID data to quadcopter
addListener('#button-send', 'click', sendData);

function sendData() {

    // Get all PID input data and store to right index of charVal
    for(var i = 1; i <= 18; i++) {
        rxCharVal[i] = select(inputMap[i]).value;
    }

    // Get all control input data and store to right index of exCharVal
    exCharVal[0] = select('#throttle').value;

    // Sending PID data with rxChar over BLE
    writeArrayToChar(rxChar, rxCharVal)
    .then( (status) => {
        console.log("Data sent:", rxCharVal);
    })
    .then( () => {
        // Sending throttle data with exChar over BLE
        writeArrayToChar(exChar, exCharVal)
        .then( (status) => {
            console.log("Data sent:", exCharVal);
        })
        .catch( (error) => {
            console.log('Control data sending failed:', error)
        });
    })
    .catch( (error) => {
        console.log('PID data sending failed:', error)
    });
}

// Roll and pitch parameters should always the same
select('#roll-slave-p').addEventListener('input', function() {
    select('#pitch-slave-p').value = this.value;
});

select('#roll-slave-i').addEventListener('input', function() {
    select('#pitch-slave-i').value = this.value;
});

select('#roll-slave-d').addEventListener('input', function() {
    select('#pitch-slave-d').value = this.value;
});

select('#pitch-slave-p').addEventListener('input', function() {
    select('#roll-slave-p').value = this.value;
});

select('#pitch-slave-i').addEventListener('input', function() {
    select('#roll-slave-i').value = this.value;
});

select('#pitch-slave-d').addEventListener('input', function() {
    select('#roll-slave-d').value = this.value;
});

select('#roll-master-p').addEventListener('input', function() {
    select('#pitch-master-p').value = this.value;
});

select('#roll-master-i').addEventListener('input', function() {
    select('#pitch-master-i').value = this.value;
});

select('#roll-master-d').addEventListener('input', function() {
    select('#pitch-master-d').value = this.value;
});

select('#pitch-master-p').addEventListener('input', function() {
    select('#roll-master-p').value = this.value;
});

select('#pitch-master-i').addEventListener('input', function() {
    select('#roll-master-i').value = this.value;
});

select('#pitch-master-d').addEventListener('input', function() {
    select('#roll-master-d').value = this.value;
});

// Function for short-hand access to querySelector
function select(query) {
    return document.querySelector(query);
}

// Function for short-hand access to adding eventListener to element
function addListener(selector, eventType, func) {
    return document.querySelector(selector).addEventListener(eventType, func);
}
