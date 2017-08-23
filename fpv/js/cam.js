

const CMD_SINGLE_CAPTURE        = 1;
const CMD_START_STREAM          = 2;
const CMD_STOP_STREAM           = 3;
const CMD_CHANGE_RESOLUTION     = 4;
const CMD_CHANGE_PHY            = 5;
const CMD_SEND_BLE_PARAMS       = 6;

const CMD_VAL_GAP_PHY_1MBPS     = 0;
const CMD_VAL_GAP_PHY_2MBPS     = 1;
const DEFAULT_PHY_VAL           = CMD_VAL_GAP_PHY_1MBPS;

const CMD_VAL_RES_160x120       = 0;
const CMD_VAL_RES_320x240       = 1;
const CMD_VAL_RES_640x480       = 2;
const CMD_VAL_RES_800x600       = 3;
const CMD_VAL_RES_1024x768      = 4;
const CMD_VAL_RES_1600x1200     = 5;

const CMD_INFO_IMG_SIZE         = 1;
const CMD_INFO_BLE_PARAMS       = 2;

const RES_160x120               = 0;
const RES_320x240               = 1;
const RES_640x480               = 2;
const RES_800x600               = 3;
const RES_1024x768              = 4;
const RES_1600x1200             = 5;

var receivedImage = new Uint8Array();
var incomingImgSize = 0;
var firstImgByte = true;
var isConnected = false;
var logEnabled = logEnabled | true;
var attemptedPhy = CMD_VAL_GAP_PHY_1MBPS;
var timeRecStart;
var timeRecEnd;

var resolutions = [
    {name: "160x120", value: CMD_VAL_RES_160x120},
    {name: "320x240", value: CMD_VAL_RES_320x240},
    {name: "640x480", value: CMD_VAL_RES_640x480},
    {name: "800x600", value: CMD_VAL_RES_800x600},
    {name: "1024x768", value: CMD_VAL_RES_1024x768},
    {name: "1600x1200 ", value: CMD_VAL_RES_1600x1200}
];


function txNotificationsInit(characteristic) {

    // Stores the notification characteristic object to ble object for global debugging access
    itsTxChar = characteristic;

    // Initiates event listener for notifications sent from DK
    itsTxChar.addEventListener('characteristicvaluechanged', txCharNotificationHandler);

    if (logEnabled)
        console.log('Notifications starting for TX characteristic');

    return itsTxChar.startNotifications();
}

/** Function for handling Tx notifications, ie receiving image data **/
function txCharNotificationHandler(event) {

    if(firstImgByte) {
        timeRecStart = performance.now();
        firstImgByte = false;
    }

    // The received notification consists of a DataView object, assigned to value
    let value = event.target.value;
    value = value.buffer ? value : new DataView(value);

    var valueArray = new Uint8Array(value.byteLength);
    for(var i = 0; i < valueArray.length; i++) {
        valueArray[i] = value.getUint8(i);
    }

    receivedImage = concatTypedArrays(receivedImage, valueArray);

    // When the image is received
    if(receivedImage.length >= incomingImgSize) {
        displayImage(receivedImage);
        receivedImage = new Uint8Array([]);

        timeRecEnd = performance.now();
        var bitrate = ((incomingImgSize * 8 / 1000) / ((timeRecEnd - timeRecStart) / 1000)).toFixed(2);
        var fps = (1 / ((timeRecEnd - timeRecStart) / 1000)).toFixed(1);

        //qs("#cam-info-bitrate").innerHTML = bitrate + " kbps";
        //qs("#cam-info-framerate").innerHTML = fps + " fps";

        firstImgByte = true;
        incomingImgSize = 0;

        if (logEnabled)
            console.log("Bit rate on image transfer: " + bitrate + " kbps");
    }
}


function infoNotificationsInit(characteristic) {

    itsInfoChar = characteristic;
    itsInfoChar.addEventListener('characteristicvaluechanged', infoCharNotificationHandler);

    if (logEnabled)
        console.log('Notifications starting for info characteristic');

    return itsInfoChar.startNotifications();
}


function infoCharNotificationHandler(event) {

    // The received notification consists of a DataView object, assigned to value
    let value = event.target.value;
    value = value.buffer ? value : new DataView(value);

    var valueArray = new Uint8Array(value.byteLength);
    for(var i = 0; i < valueArray.length; i++) {
        valueArray[i] = value.getUint8(i);
    }
    if(valueArray[0] == CMD_INFO_IMG_SIZE) {
        incomingImgSize = u8tou32(valueArray, 1, 4);
        if (logEnabled)
            console.log("Incoming image size: ", incomingImgSize);
    } else if(valueArray[0] == CMD_INFO_BLE_PARAMS) {
        updateParamsInfo(valueArray);
    }
}

function setDefaultParameters() {
    sendCommand(CMD_CHANGE_PHY, DEFAULT_PHY_VAL);
}

function updateParamsInfo(valueArray) {
    var mtu = u8tou16(valueArray, 1, 2);
    var connectionInterval = u8tou16(valueArray, 3, 2) * 1.25;
    var txPhy = valueArray[5];
    var rxPhy = valueArray[6];

    // Update info overview
    //qs("#cam-info-phy").innerHTML = (txPhy == 1) ? ((attemptedPhy == CMD_VAL_GAP_PHY_1MBPS) ? "1 Mbps" : "1 Mbps, 2 Mbps N/A") : "2 Mbps";
    //qs("#cam-info-ci").innerHTML = connectionInterval + " ms";
    //qs("#cam-info-mtu").innerHTML = mtu + " bytes";

    if(logEnabled) {
        console.log("MTU: ", mtu);
        console.log("Connection interval: ", connectionInterval);
        console.log("Tx PHY: ", (txPhy == 1) ? ((attemptedPhy == CMD_VAL_GAP_PHY_1MBPS) ? "1 Mbps" : "1 Mbps, 2 Mbps not available") : "2 Mbps");
        console.log("Rx PHY: ", (rxPhy == 1) ? ((attemptedPhy == CMD_VAL_GAP_PHY_1MBPS) ? "1 Mbps" : "1 Mbps, 2 Mbps not available") : "2 Mbps");
    }
}

function sendCommand(cmd, value = 0) {
    itsRxChar.writeValue(new Uint8Array([cmd, value]));
    if(cmd == CMD_CHANGE_PHY)
        attemptedPhy = value;
}

function startStream() {
    sendCommand(CMD_START_STREAM);
    //qs("#cam-stop-stream-btn").style.display = "inline-block";
    //qs("#cam-start-stream-btn").style.display = "none";
}


function stopStream() {
    sendCommand(CMD_STOP_STREAM);
    //qs("#cam-stop-stream-btn").style.display = "none";
    //qs("#cam-start-stream-btn").style.display = "inline-block";
}

function displayImage(data) {
    qs("img.fpv-img").style.display = "block";
    qs("img.fpv-img").src = 'data:image/png;base64,' + Uint8ToBase64(data);
}


//var elConnectBtn = document.querySelector('#connect-btn');


/*
function onConnect() {
    var h1 = document.querySelector('h1');
    elConnectBtn.style.background = "rgba(4, 113, 83, 0.8)";
    document.querySelector('#controllers-wrapper').style.display = "block";
    h1.style.fontSize = "30px";
    h1.style.marginTop = "40px";
    h1.style.marginBottom = "10px";
    elConnectBtn.style.margin = "0 auto";
    elConnectBtn.style.padding = "0 1px";
    elConnectBtn.style.width = "100px";
    elConnectBtn.style.fontSize = "14px";
    elConnectBtn.style.position = "absolute";
    elConnectBtn.style.top = "8px";
    elConnectBtn.style.right = "8px";
    elConnectBtn.innerHTML = "Connected";
    //qs("#cam-info-wrapper").style.display = "block";
}*/

function showResOptions() {
    //qs("#cam-res-dropdown").classList.toggle("show");
}

function setResolution(res) {
    sendCommand(CMD_CHANGE_RESOLUTION, res.value);
    //qs("#cam-info-res").innerHTML = res.name;
}


// Event liseteners

clickListener("#connect-btn", connect);
//clickListener("#cam-single-capture-btn", function() { sendCommand(CMD_SINGLE_CAPTURE); });
//clickListener("#cam-start-stream-btn", function() { startStream(); });
//clickListener("#cam-stop-stream-btn", function() { stopStream(); });
//clickListener("#cam-set-res-btn", showResOptions);
//clickListener("#cam-res-160x120-btn", function() { setResolution(resolutions[RES_160x120]); });
//clickListener("#cam-res-320x240-btn", function() { setResolution(resolutions[RES_320x240]); });
//clickListener("#cam-res-640x480-btn", function() { setResolution(resolutions[RES_640x480]); });
//clickListener("#cam-res-800x600-btn", function() { setResolution(resolutions[RES_800x600]); });
//clickListener("#cam-res-1024x768-btn", function() { setResolution(resolutions[RES_1024x768]); });
//clickListener("#cam-res-1600x1200-btn", function() { setResolution(resolutions[RES_1600x1200]); });
//clickListener("#cam-req-1mbps-btn", function() { sendCommand(CMD_CHANGE_PHY, CMD_VAL_GAP_PHY_1MBPS); });
//clickListener("#cam-req-2mbps-btn", function() { sendCommand(CMD_CHANGE_PHY, CMD_VAL_GAP_PHY_2MBPS); });

window.onclick = function(event) {
    if (!event.target.matches("#cam-set-res-btn")) {

        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};


// Helper functions

function qs(selector) {
    return document.querySelector(selector);
}

function clickListener(el, cb) {
    qs(el).addEventListener("click", cb);
}

function u8tou32(arr, start, count) {
    var u32bytes = arr.buffer.slice(start, start + count);
    return new Uint32Array(u32bytes)[0];
}

function u8tou16(arr, start, count) {
    var u16bytes = arr.buffer.slice(start, start + count);
    return new Uint16Array(u16bytes)[0];
}

function concatTypedArrays(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

function concatBytes(ui8a, byte) {
    var b = new Uint8Array(1);
    b[0] = byte;
    return concatTypedArrays(ui8a, b);
}

function bufferToBase64(buf) {
    var binstr = Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
    }).join('');
    return btoa(binstr);
}

function Uint8ToBase64(u8a){
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
    }
    return btoa(c.join(""));
}
