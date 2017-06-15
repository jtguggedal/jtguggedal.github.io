var device;
var server;
var service;
var characteristic;

const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

function connect(callbackOnConnect) {
    log("Scanning for devices with service UUID " + serviceUUID );
    navigator.bluetooth.requestDevice(
        {filters: [{services: [serviceUUID]}]}
    )
    .then( d => {
        device = d;
        log("Found device " + device + ", trying to connect to GATT server");
        return device.gatt.connect();
    })
    .then( s => {
        server = s;
        log("Connected to server " + s + ", getting service");
        return server.getPrimaryService(serviceUUID);
    })
    .then( sc => {
        service = sc;
        log("Found service " + service + ", getting characteristic");
        return service.getCharacteristic(characteristicUUID);
    })
    .then(ch => {
        characteristic = ch;
        log("Characteristic " + characteristic + " found and available globally")
        if(callbackOnConnect != undefined)
            callbackOnConnect();
    })
    .catch(error => {
        log("Error: " + error)
    })
}


function sendData(dataArray) {
    return characteristic.writeValue(dataArray);
}


function log(string){
    console.log(string);
}
