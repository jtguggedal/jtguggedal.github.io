//**************************************************************************************************************//
//  Functions for connecting to BLE device and setting up main service and characteristics                      //
//                                                                                                              //
//  connect                             Searches for devices that matches the filter criterias                  //
//  notificationCharacteristicHandler   Sets up event listener for the notification characteristic              //
//  handleNotification                  Event handler for changes in the notifications                          //
//  readWriteCharacteristicHandler      Sets up the readWriteCharacteristic                                     //
//  readFromCharacteristic              Function for reading values from the readWriteCharacteristic            //
//  writeToCharacteristic               Function for reading chosen values from the readWriteCharacterstic      //


//* Creatig BLE object
var ble = {
    /** Declaring the necessary global variables **/
    mainServiceUUID : '00001523-1212-efde-1523-785feabcd123',
    readWriteCharacteristicUUID : '00001525-1212-efde-1523-785feabcd123',
    notificationCharacteristicUUID : '00001524-1212-efde-1523-785feabcd123',

    bluetoothDevice : '',
    mainServer : '',
    mainService : '',
    readWriteCharacteristic : '',
    notificationCharacteristic : '',
    notificationContent : '',

    prevNotification : '',

    /** Function for establishing BLE connection to device advertising the main service **/
    connect : function() {
        'use strict';

        // Searching for Bluetooth devices that match the filter criteria
        console.log('Requesting Bluetooth Device...');
        navigator.bluetooth.requestDevice(
            {filters: [{services: [this.mainServiceUUID]}]})
            .then(device => {
                bluetoothDevice = device;
                // Adding event listener to detect loss of connection
                //bluetoothDevice.addEventListener('gattserverdisconnected', disconnectHandler);
                console.log('> Found ' + bluetoothDevice.name);
                console.log('Connecting to GATT Server...');
                return bluetoothDevice.connectGATT()
                .then(gattServer => {
                    mainServer = gattServer;
                    console.log('> Bluetooth Device connected: ');
                    connectionStatus(1);

                });
            })

            // When matching device is found and selected, get the main service
            .then(server => {
                console.log('Getting main Service...');
                return mainServer.getPrimaryService(mainServiceUUID);
            })
            .then(service => {
                // Storing the main service object globally for easy access from other functions
                mainService = service;
                console.log('> serviceReturn: ' + service);
                return Promise.all([
                    // Get all characteristics and call handler functions for both
                    service.getCharacteristic(readWriteCharacteristicUUID)
                    .then(readWriteCharacteristicHandler),
                    service.getCharacteristic(notificationCharacteristicUUID)
                    .then(notificationCharacteristicHandler)
                ])
                // Print errors  to console
                .catch(error => {
                    console.log('>' + error);
                });
            })
        // Print errors  to console
        .catch(error => {
            console.log('Argh! ' + error);
        });
    },


    /** Function for disconnecting th Bluetooth Device **/
    disconnect : function() {
        if (!bluetoothDevice) {
            connectionStatus(0);
            return;
        }
        console.log('> Disconnecting from Bluetooth Device...');
        if (bluetoothDevice.gatt.connected) {
            bluetoothDevice.gatt.disconnect();
            console.log('> Bluetooth Device connected: ' + bluetoothDevice.gatt.connected);
        } else {
            console.log('> Bluetooth Device is already disconnected');
        }
        connectionStatus(0);
    },

    /** Function for handling disconnect event **/
    disconnectHandler : function() {
        connectionStatus(0);
        console.log('>>> Device disconnected.');
    },

    /** Function for handling connection status **/
    connectionStatus : function(status) {
        if(status == 1)
            document.getElementById("connectionStatus").style.backgroundColor = 'green';
        else if(status == 0)
            document.getElementById("connectionStatus").style.backgroundColor = 'red';
    },

    /** Function for setting up the notification characteristic **/
    notificationCharacteristicHandler : function(characteristic) {
        'use strict';

        // Stores the notification characteristic object globally for easy access
        notificationCharacteristic = characteristic;
        console.log('Notifications started.');

        // Initiates event listener for notifications sent from DK
        notificationCharacteristic.addEventListener('characteristicvaluechanged',handleNotification);
        return characteristic.startNotifications();
    },

     /** Function for handling the read and write characteristic **/
    readWriteCharacteristicHandler : function(characteristic) {
        'use strict';
        // Stores the readWriteCharacteristic globally
        readWriteCharacteristic = characteristic;
        return 1;
    },


    /** Function for handling notifications **/
    handleNotification : function (event) {
        'use strict';

        // The received notification consists of a DataView object, assigned to value
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value);

        if(value != prevNotification) {

            // Checks if notificationCallback exists, and if it does, calls it with the received data array as argument
            if (typeof notificationCallback === "function") {
                var valueArray = new Uint8Array(20);
                for(var i = 0; i < 20; i++)
                    valueArray[i] = value.getUint8(i);

                notificationCallback(valueArray);
            }
        } else {
        }

        prevNotification = value;
        return value;

    },

    /** Function for reading from the read and write characteristic **/
    //  Parameter      byteOffset      int, 0-19    or  string, 'all'
    readFromCharacteristic : function(byteOffset) {
        'use strict';

        // Data is sent from DK as a 20 byte long Uint8Array, stores in the data variable
        var data = new Uint8Array(20);

        // Calls the redValue method in the readWriteCharacteristic
        readWriteCharacteristic.readValue()
          .then(value => {
            // DataView is received from DK
            value = value.buffer ? value : new DataView(value);

            // Checks if a single byte or all received data is to be returned from the function
            if(byteOffset == 'all') {
                // Loops through the received DataView and copies to the data array
                for(var i = 0; i < 20 ; i++) {
                    data[i] = value.getUint8(i);
                }
            } else {
                // Copies the chosen byte from the DataView to data array
                data[byteOffset] = value.getUint8(byteOffset);
            }
            console.log('readchar: ' + data);

        });

        // Returns the selected byte or all data as Uint8Array
        if(byteOffset != 'all')
            return data[byteOffset];
        else
            return data;
    },

    /** Function for writing to the read and write characteristic **/
    //  Parameters      byteOffset      int, 0-19
    //                  value           int, 0-255
    writeToCharacteristic : function(byteOffset, value) {
        'use strict';

        charVal[byteOffset] = value;
        console.log('writechar: ' + charVal);


        readWriteCharacteristic.writeValue(charVal);
    },

    /** Function for writing array to the read and write characteristic **/
    //  Parameters      charVal     Uint8Array, maximum 20 bytes long
    writeArrayToCharacteristic : function(charVal) {
        'use strict';

        console.log('writechar: ' + charVal);


        if(writePermission) {
            readWriteCharacteristic.writeValue(charVal);
            return 1;
        } else {
            return 0;
        }
    },


    /** Function for sending data with high priority, pausing other sendings **/

    priorityWrite : function(charVal) {
        'use strict';

        priorityPacket = 1;

        if(!writePermission) {
            setTimeout( function() {
                priorityWrite(charVal);
            }, 20);
            return 0;
        } else {
            writePermission = 0;
            return readWriteCharacteristic.writeValue(charVal)
                .then( writeReturn => {
                    writePermission = 1;
                    priorityPacket = 0;
                    console.log('Priority sent: ' + charVal);
            });
        }


    }
};
