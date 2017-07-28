/*
 *  Interface
 *
 *  connect(serviceUUID, characteristicUUID, callbackOnConnect)
 *  sendData(dataArray) - dataArray is a Uint8Array of max 20 bytes
 *
 */

var ble = (function() {

    var device;
    var server;
    var service;
    var characteristic;
    var isConnected = false;
    var isBusy = false;
    var logEnabled = logEnabled | true;

    var connect = function(serviceUUID, characteristicUUID) {
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
            isConnected = true;
        })
        .catch(error => {
            console.log("Error during connect: " + error)
        })
    }

    var disconnect = function() {
        return new Promise(function(resolve, reject) {
            device.gatt.disconnect();
            if(device.gatt.connected == false) {
                isConnected = false;
                resolve();
            } else {
                reject(new Error("Error on disconnect"));
            }
        })
    }

    var sendData = function(dataArray) {
        isBusy = true;
        return characteristic.writeValue(dataArray)
        .then( () => {
            isBusy = false;
            if(logEnabled)
                console.log("Successfully sent " + dataArray);
        });
    }

    return {
        getDevice : function() { return device },
        connect : connect,
        disconnect : disconnect,
        sendData : sendData,
        isConnected : function() { return isConnected; }
    }
})();
