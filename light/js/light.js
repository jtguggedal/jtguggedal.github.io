
const serviceUUID               = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID        = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";


const RED_BYTE_INDEX            = 1;
const GREEN_BYTE_INDEX          = 0;
const BLUE_BYTE_INDEX           = 2;
const LED_NUMBER_BYTE_OFFSET    = 3;
const SEQUENCE_BYTE_INDEX       = 4;

var rgbArray = new Uint8Array(10);

// Event listeners

function onConnect() {
    qs("#connectWrapper").style.display = "none";
    qs("#disconnectWrapper").style.display = "block";
    qs("#chooserWrapper").style.display = "block";
    qs("h1").style.fontSize = "35px";
    qs("h1").style.marginTop = "15px";
    qs("#description").innerHTML = "Du er nå tilkoblet.";
}

clickListener('#connectBtn', function(e) {
    ble.connect(serviceUUID, characteristicUUID, true)
    .then( () => {
        if(ble.isConnected())
            onConnect();
    });
});

clickListener('#disconnectBtn', function(e) {
    ble.disconnect()
    .then( () => {
        console.log("Device disconnected gracefully");
        window.location.reload();
    } );
});

// clickListener('#sequenceSelector', function(e) {
//         rgbArray[SEQUENCE_BYTE_INDEX] = qs('#sequenceSelector').value
//         ble.sendData(rgbArray);
// });

ColorPicker (
    qs('#slide'),
    qs('#picker'),
    function(hex, hsv, rgb) {
        qs('body').style.background = hex;

        // Calculating perceived contrast, and setteing H1 color to white or black accordingly
        var o = Math.round(((parseInt(rgb.r.toFixed()) * 299) +
                          (parseInt(rgb.g.toFixed()) * 587) +
                          (parseInt(rgb.b.toFixed()) * 114)) / 1000);
        qs("h1").style.color = (o > 125) ? 'black' : 'white';
        qs("#wrapper").style.color = (o > 125) ? 'black' : 'white';

        rgbArray[RED_BYTE_INDEX] = rgb.r.toFixed();
        rgbArray[GREEN_BYTE_INDEX] = rgb.g.toFixed();
        rgbArray[BLUE_BYTE_INDEX] = rgb.b.toFixed();
        rgbArray[LED_NUMBER_BYTE_OFFSET] = qs('#ledSelector').value;

        ble.sendData(rgbArray);
    });

function qs(selector) {
    return document.querySelector(selector);
}

function clickListener(el, cb) {
    qs(el).addEventListener("click", cb);
}
