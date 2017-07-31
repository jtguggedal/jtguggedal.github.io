/*
 *  Interface for BLE object
 *
 *  connect(serviceUUID, characteristicUUID) - returns promise
 *  disconnect() - returns promise
 *  sendData(dataArray) - dataArray: Uint8Array of maximum 20 bytes
 *  getDevice() - returns BLE device object
 *  isConnected() - returns bool if a peripheral is connected
 *
 */

/*jshint esversion: 6 */

var ble = (function(logEnabled) {

    var device;
    var server;
    var service;
    var characteristic;
    var isConnected = false;
    var isBusy = false;
    var logEnabled = false;

    var connect = function(serviceUUID, characteristicUUID, _logEnabled) {
        logEnabled = _logEnabled | logEnabled;
        if (logEnabled)
            console.log("Scanning for devices with service UUID " + serviceUUID);
        return navigator.bluetooth.requestDevice({
                filters: [{
                    services: [serviceUUID]
                }]
            })
            .then(d => {
                device = d;
                if (logEnabled)
                    console.log("Found device " + device + ", trying to connect to GATT server");
                return device.gatt.connect();
            })
            .then(s => {
                server = s;
                if (logEnabled)
                    console.log("Connected to server " + s + ", getting service");
                return server.getPrimaryService(serviceUUID);
            })
            .then(sc => {
                service = sc;
                if (logEnabled)
                    console.log("Found service " + service + ", getting characteristic");
                return service.getCharacteristic(characteristicUUID);
            })
            .then(ch => {
                characteristic = ch;
                if (logEnabled)
                    console.log("Characteristic " + characteristic + " found and available globally");
                isConnected = true;
            })
            .catch(error => {
                console.log("Error during connect: " + error);
            });
    };

    var disconnect = function() {
        return new Promise(function(resolve, reject) {
            device.gatt.disconnect();
            if (device.gatt.connected == false) {
                isConnected = false;
                resolve();
            } else {
                reject(new Error("Error on disconnect"));
            }
        });
    };

    var sendData = function(dataArray) {
        isBusy = true;
        return characteristic.writeValue(dataArray)
            .then(() => {
                isBusy = false;
                if (logEnabled)
                    console.log("Successfully sent ", dataArray);
            });
    };

    return {
        getDevice: function() {
            return device;
        },
        connect: connect,
        disconnect: disconnect,
        sendData: sendData,
        isConnected: function() {
            return isConnected;
        }
    };
})();
