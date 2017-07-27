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
var enableLogging = true;

function connect(serviceUUID, characteristicUUID, callbackOnConnect) {
    if(enableLogging)
        console.log("Scanning for devices with service UUID " + serviceUUID );
    navigator.bluetooth.requestDevice(
        {filters: [{services: [serviceUUID]}]}
    )
    .then( d => {
        device = d;
        if(enableLogging)
            console.log("Found device " + device + ", trying to connect to GATT server");
        return device.gatt.connect();
    })
    .then( s => {
        server = s;
        if(enableLogging)
            console.log("Connected to server " + s + ", getting service");
        return server.getPrimaryService(serviceUUID);
    })
    .then( sc => {
        service = sc;
        if(enableLogging)
            console.log("Found service " + service + ", getting characteristic");
        return service.getCharacteristic(characteristicUUID);
    })
    .then(ch => {
        characteristic = ch;
        if(enableLogging)
            console.log("Characteristic " + characteristic + " found and available globally")
        if(typeof(callbackOnConnect) === "function")
            callbackOnConnect();
    })
    .catch(error => {
        console.log("Error: " + error)
    })
}

function bleSendData(dataArray) {
    return characteristic.writeValue(dataArray);
}
