/*
 *  Interface
 *
 *  connect(serviceUUID, characteristicUUID, callbackOnConnect)
 *  sendData(dataArray) - dataArray is a Uint8Array of max 20 bytes
 *
 */

var device;
var server;
var service;
var characteristic;
var logEnabled = logEnabled | true;

function connect(serviceUUID, characteristicUUID) {
    if(logEnabled)
        console.log("Scanning for devices with service UUID " + serviceUUID );
    return navigator.bluetooth.requestDevice(
        {filters: [{services: [serviceUUID]}]}
    )
    .then( d => {
        device = d;
        if(logEnabled)
            console.log("Found device " + device + ", trying to connect to GATT server");
        return device.gatt.connect();
    })
    .then( s => {
        server = s;
        if(logEnabled)
            console.log("Connected to server " + s + ", getting service");
        return server.getPrimaryService(serviceUUID);
    })
    .then( sc => {
        service = sc;
        if(logEnabled)
            console.log("Found service " + service + ", getting characteristic");
        return service.getCharacteristic(characteristicUUID);
    })
    .then(ch => {
        characteristic = ch;
        if(logEnabled)
            console.log("Characteristic " + characteristic + " found and available globally")
    })
    .catch(error => {
        console.log("Error during connect: " + error)
    })
}

function disconnect() {
    return device.gatt.disconnect()
    .catch( error => {
        console.log("Error on disconnect: " + error);
    })
}

function bleSendData(dataArray) {
    return characteristic.writeValue(dataArray);
}
