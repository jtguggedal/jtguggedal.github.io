
/** Declaring the necessary global variables **/
var mainServiceUUID = '00001523-1212-efde-1523-785feabcd123';
var readWriteCharacteristicUUID = '00001525-1212-efde-1523-785feabcd123';
var notificationCharacteristicUUID = '00001524-1212-efde-1523-785feabcd123';

var mainService;
var readWriteCharacteristic;
var notificationCharacteristic;

var notificationContent;

/** Function for establishing BLE connection to device advertising the main service **/
function connect() {
    'use strict';

    log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice(
        {filters: [{services: [mainServiceUUID]}]})
        .then(device => {
            log('> Found ' + device.name);
            log('Connecting to GATT Server...');
            return device.connectGATT();
        })
        .then(server => {
            log('Getting main Service...');
            return server.getPrimaryService(mainServiceUUID);
        })
        .then(service => {
            mainService = service;
            return Promise.all([
                service.getCharacteristic(readWriteCharacteristicUUID)
                .then(readWriteCharacteristicHandler),
                service.getCharacteristic(notificationCharacteristicUUID)
                .then(notificationCharacteristicHandler)
            ])
            .catch(error => {
                log('>' + error);
            });
        })
    .catch(error => {
        log('Argh! ' + error);
    });
}

/** Function for setting up the notification characteristic **/
function notificationCharacteristicHandler(characteristic) {
    'use strict';
    notificationCharacteristic = characteristic;
    log('Notifications started.');
    notificationCharacteristic.addEventListener('characteristicvaluechanged',handleNotification);
    return characteristic.startNotifications();
}

 /** Function for handling the read and write characteristic **/
function readWriteCharacteristicHandler(characteristic) {
    'use strict';
    readWriteCharacteristic = characteristic;
    return 1;
}


/** Function for handling notifications **/
function handleNotification(event) {
    'use strict';
    let value = event.target.value;
    value = value.buffer ? value : new DataView(value);

    // Testing, testing...
            var bg_1, 
                bg_2, 
                bg_3, 
                bg_4;

            if(value.getUint8(0) == 1)
                bg_1 = 'red';
            else
                bg_1 = 'blue';
            if(value.getUint8(1) == 1)
                bg_2 = 'red';
            else
                bg_2 = 'blue';
            if(value.getUint8(2) == 1)
                bg_3 = 'red';
            else
                bg_3 = 'blue';
            if(value.getUint8(3) == 1)
                bg_4 = 'red';
            else
                bg_4 = 'blue';

            document.getElementById("notification_1").style.backgroundColor = bg_1;
            document.getElementById("notification_2").style.backgroundColor = bg_2;
            document.getElementById("notification_3").style.backgroundColor = bg_3;
            document.getElementById("notification_4").style.backgroundColor = bg_4;

            console.log(value);
     //**** Testing end

    return value;

}


/** Function for reading from the read and write characteristic **/
function readFromCharacteristic(byteOffset) {
    'use strict';
    var data = new Uint8Array(20);
    readWriteCharacteristic.readValue()
      .then(value => {
        value = value.buffer ? value : new DataView(value);

        if(byteOffset == 'all') {
            for(var i = 0; i < 20 ; i++) {
                data[i] = value.getUint8(i);
            }
        } else {
            data[byteOffset] = value.getUint8(byteOffset);
        }
        log(data);

    });
    if(byteOffset != 'all')
        return data[byteOffset];
    else
        return data;

}

/** Function for writing to the read and write characteristic **/
function writeToCharacteristic(byteOffset, value) {
    'use strict';
    var charVal = new Uint8Array(20);
    charVal[byteOffset] = value;
    log(charVal);
    readWriteCharacteristic.writeValue(charVal);
    /*if(readFromCharacteristic(byteOffset) == value)
        return 1;
    else
        return 0;*/
}



            var charVal = new Uint8Array(20);

            $('.ball').on("mousemove touchmove", function() {
                    console.log(charVal);


                // Lagrer nå-verdien fra slideren i variabelen 'sliderVal' (med jQuery-selector)

                var offset = $ball.position();
                var offsetY = initialOffset.top - offset.top;
                var offsetX = -1*(initialOffset.left - offset.left);

                // Sjekker at tilkobling ble opprettet tidligere
                if(readWriteCharacteristic) {

                    // Sjekker i hvilket intervall slider-verdien er, og sender korresponderende verdi
                    // via BLE til firmware. 
                    // Setter 1. bit lik 1 for å tenne 1. LED osv.


                    if(offsetX < 0 && offsetY < 0)
                        setBit(1, 0, 1);        // 0001
                    else 
                        setBit(1, 0, 0);
                    if(offsetX < 0 && offsetY > 0)      
                        setBit(1, 1, 1);        // 0010
                    else
                        setBit(1, 1, 0);
                    if(offsetX > 0 && offsetY > 0)
                        setBit(1, 2, 1);        // 0100
                    else
                        setBit(1, 2, 0);
                    if(offsetX > 0 && offsetY < 0)
                        setBit(1, 3, 1);        // 1000
                    else
                        setBit(1, 3, 0)

                    console.log(charVal);

                    if((offsetX == 0) && (offsetY == 0))
                        setBit(1, 'b', 0);

                    console.log(charVal);


                    return readWriteCharacteristic.writeValue(charVal);
                }
            });




/** Function for controlling LEDs with joystick **/
/*var charVal = new Uint8Array(20);
$('.ball').on("mousemove touchmove", function() {

    // Lagrer nå-verdien fra slideren i variabelen 'sliderVal' (med jQuery-selector)

      var offset = $ball.position();
      var offsetY = initialOffset.top - offset.top;
      var offsetX = -1*(initialOffset.left - offset.left);

    // Sjekker at tilkobling ble opprettet tidligere
    if(readWriteCharacteristic) {

        // Sjekker i hvilket intervall slider-verdien er, og sender korresponderende verdi
        // via BLE til firmware. 
        // Setter 1. bit lik 1 for å tenne 1. LED osv.


        if(offsetX < 0 && offsetY < 0)
            setBit(1, 0, 1);        // 0001
        else 
            setBit(1, 0, 0);
        if(offsetX < 0 && offsetY > 0)      
            setBit(1, 1, 1);        // 0010
        else
            setBit(1, 1, 0);
        if(offsetX > 0 && offsetY > 0)
            setBit(1, 2, 1);        // 0100
        else
            setBit(1, 2, 0);
        if(offsetX > 0 && offsetY < 0)
            setBit(1, 3, 1);        // 1000
        else
            setBit(1, 3, 0);

        console.log(charVal);

        if((offsetX == 0) && (offsetY == 0))
            setBit(1, 'b', 0);

        console.log(charVal);


        return readWriteCharacteristic.writeValue(charVal);
    }
});
*/
