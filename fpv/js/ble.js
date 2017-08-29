

var device;
var server;
var itsService;
var itsRxChar;
var itsTxChar;
var itsInfoChar;


// its = Image Transfer Service
const itsServiceAdvUUID         = "6e400001-b5a3-f393-e0a9-e50e24dcca3e";
const itsRxCharUUID             = "6e400002-b5a3-f393-e0a9-e50e24dcca3e";
const itsTxCharUUID             = "6e400003-b5a3-f393-e0a9-e50e24dcca3e";
const itsInfoCharUUID           = "6e400004-b5a3-f393-e0a9-e50e24dcca3e";


function connect () {
    if (logEnabled)
        console.log("Scanning for devices with service UUID " + itsServiceAdvUUID);

    return navigator.bluetooth.requestDevice({
        filters: [{
            services: [itsServiceAdvUUID]
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
        return server.getPrimaryService(itsServiceAdvUUID);
    })
    .then(sc => {
        itsService = sc;
        if (logEnabled)
            console.log("Found service " + itsService + ", getting characteristic");

        return Promise.all([
            itsService.getCharacteristic(itsRxCharUUID)
            .then( c => { itsRxChar = c; }),
            itsService.getCharacteristic(itsTxCharUUID)
            .then(txNotificationsInit),
            itsService.getCharacteristic(itsInfoCharUUID)
            .then( (c) => {
                setTimeout(function() {
                    // Fix to avoid weird, unspecified error on Android when starting notifications for two characteristics
                    infoNotificationsInit(c)
                    .then( setDefaultParameters );
                }, 1000);
            })
        ]);
    })
    .then( () => {
        if (logEnabled)
            console.log("Characteristics found and available globally");
        isConnected = true;
        onConnect();
    })
    .catch(error => {
        console.log("Error during connect: " + error);
    });
}


function sendData(dataArray) {
    return itsRxChar.writeValue(dataArray);
}
