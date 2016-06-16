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
var txCharVal = new Uint8Array(20);
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
