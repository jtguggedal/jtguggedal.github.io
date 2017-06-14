var device;
var server;
var service;
var characteristic;

const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const charUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

function connect(callback) {
    log("Scanning for devices with service UUID " + serviceUUID + "...");
    navigator.bluetooth.requestDevice(
        {filters: [{services: [serviceUUID]}]}
    )
    .then( d => {
        device = d;
        log("Found device " + d + ", trying to connect to GATT server...");
        return d.gatt.connect();
    })
    .then( s => {
        server = s;
        log("Connected to server " + server + ", getting service...");
        return server.getPrimaryService(serviceUUID);
    })
    .then( sc => {
        service = sc;
        log("Found service " + sc + ", getting characteristic...");
        return sc.getCharacteristic(charUUID);
    })
    .then(ch => {
        characteristic = ch;
        log("Characteristic " + ch + " found and available globally")
        callback();
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
