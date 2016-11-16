
const CMD_JOYSTICK              = 0x05;
const CMD_SHOOT                 = 0x06;
const MODE_JOYSTICK             = 0x01;
const MODE_ACCELEROMETER        = 0x02;
const MODE_DEFAULT              = MODE_JOYSTICK;


var mode = MODE_DEFAULT;

var serviceUUID         = "00001523-1212-efde-1523-785feabcd123";
var buttonCharUUID      = "00001524-1212-efde-1523-785feabcd123";
var ledCharUUID         = "00001525-1212-efde-1523-785feabcd123";

const uartUUID          = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const uartTxUUID        = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const uartRxUUID        = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

var bluetoothDevice;
var ledButtonService;
var ledCharacteristic;
var buttonCharacteristic;
var writeAllowed = true;
var connected = false;
var shotPending = false;

function connect() {
    log('Searching for devices...');
    navigator.bluetooth.requestDevice(
        {filters: [{services: [serviceUUID]}]}
    )
    .then( device => {
        log('Device found, connecting to GATT server...');
        bluetoothDevice = device;       // Making device available in global scope
        return device.gatt.connect();
    })
    .then( server => {
        log('Connected to GATT server, getting specified service...');
        setConnectionStatus(1);
        return server.getPrimaryService(serviceUUID);
    })
    .then( service => {
        log('Service found and available in global scope (var ledButtonService). \nGetting specified characteristics...');
        ledButtonService = service;     // Making service available in global scope
        return Promise.all([
            service.getCharacteristic(ledCharUUID)
            .then( characteristic => {
                log('Found LED characteristic, and it\'s now available in global scope (var ledCharacteristic).');
                ledCharacteristic = characteristic;
            }),
            service.getCharacteristic(buttonCharUUID)
            .then( characterstic => {
                buttonCharacteristic = characterstic
                log('Found button characterstic, now available in global scope (var buttonCharacteristic).\nEvent listener added.');
                buttonCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);
                return buttonCharacteristic.startNotifications();
            })
        ]);
    })
}

function setLed(status) {
    value = new Uint8Array([status%2]);
    ledCharacteristic.writeValue(value);
}


// Function to send command from web to nRF52 Development Kit
function sendCommand(cmd, value, highPriority = false) {
    data = new Uint8Array([cmd, value]);
    var el = document.querySelector('#servo-value').innerHTML = parseInt(value - 100) + '%';
    if(writeAllowed && connected && !shotPending) {
        writeAllowed = false;
        return ledCharacteristic.writeValue(data)
        .then( () => {
            if(shotPending)
                sendShot();
            writeAllowed = true;
        });
    }
    else if(highPriority == true) {
        // Something smart
        shotPending = true;
        setTimeout( function() {
            ledCharacteristic.writeValue(data)
            .then( () => {
                writeAllowed = true;
                shotPending = false;
            });
        }, 40);
    }
}

// Function to trigger shot
function sendShot() {
    sendCommand(CMD_SHOOT, 1, true)
    .then( () => {
        shotPending = false;
    });
    //sendCommand(CMD_SHOOT, 0, true);
}

function setServo(value) {
    setPoint = new Uint8Array([value]);
    var el = document.querySelector('#servo-value').innerHTML = parseInt(value - 100) + '%';
    if(writeAllowed) {
        writeAllowed = false;
        ledCharacteristic.writeValue(setPoint)
        .then( () => {
            writeAllowed = true;
        });
    }
}


function setConnectionStatus(status) {
    if (status == 1) {
        connected = true;
        var el = document.querySelector('#status-wrapper');
        el.style.backgroundColor = 'rgb(24, 126, 65)';
        el.innerHTML = "Connected";
    }
}

function handleNotification(event) {
    var value = event.target.value;
    var received = [];
    log("notification received: ", value);
    for(var i = 0; i < value.byteLength; i++) {
        received[i] = value.getUint8(i);
    }
    log("notification received: ", received[0]);
    log(value);
    return value;
}

// Function to handle orientation events
function orientationHandler(event) {

    window.removeEventListener('deviceorientation', orientationHandler);
    var x = event.beta;
    var output = x * 2.5;

    output = output > 100 ? 100 : output < -100 ? -100 : output;

    output += 100;

    document.querySelector('#servo-value').innerHTML = (output - 100) + '%';
    document.querySelector('#servo-slider').value = output;

    sendCommand(CMD_JOYSTICK, parseInt(output));
    setTimeout(function() {
        window.addEventListener('deviceorientation', orientationHandler);
    }, 30);
}

// Function to check controller mode
function setMode()
{
    var el_j = document.querySelector('#mode-radio-btn-slider');
    var el_a = document.querySelector('#mode-radio-btn-acc');

    if(el_j.checked == true)
        mode = MODE_JOYSTICK;
    else if(el_a.checked == true)
        mode = MODE_ACCELEROMETER;

    if(mode == MODE_JOYSTICK)
        window.removeEventListener('deviceorientation', orientationHandler);
    else if(mode == MODE_ACCELEROMETER)
        window.addEventListener('deviceorientation', orientationHandler);

    log("New mode: " + mode);
}


document.querySelector('#shoot-button').addEventListener('touchstart', function(event) {
    if(mode = MODE_ACCELEROMETER)
        window.removeEventListener('deviceorientation', orientationHandler);

    sendShot();
    var e = this;
    var prevW = e.clientWidth;
    var prevH = e.clientHeight;
    var prevBS = e.style.boxShadow;

    e.style.width = prevW * 0.95 + 'px';
    e.style.height = prevH * 0.95 + 'px';
    e.style.boxShadow = '0px 1px 7px rgba(0, 0, 0, 0.4)';

    setTimeout(function() {
        e.style.width = prevW + 'px';
        e.style.height = prevH + 'px';
        e.style.boxShadow = prevBS;
    }, 100);

    if(mode = MODE_ACCELEROMETER)
        window.addEventListener('deviceorientation', orientationHandler);
});

function orientationPreHandler(event) {
    log(window.orientation);
}

// Function to start game
function startGame() {

    // Go to fullscreen
    toggleFullScreen();

    // Connect to DK
    connect();

    // Hide overlay
    var el = document.querySelector('#overlay');
    el.style.display = 'none';

}

// Check screen orientation
(function() {
    if(window.matchMedia("(orientation: portrait)").matches) {
        var el = document.querySelector('#overlay-rotate');

    }
    document.querySelector('#overlay-button').addEventListener('click', startGame);
})();

function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) ||
   (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
}

// Shorthand logging
function log(string) {
    console.log(string);
}
