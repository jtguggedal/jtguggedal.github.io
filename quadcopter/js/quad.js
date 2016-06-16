// Give input elements index corresponding to relevant bytes in characteristics
var inputMap = [    'placeholder',
                    '#roll-slave-p', '#roll-slave-i', '#roll-slave-d',
                    '#pitch-slave-p', '#pitch-slave-i', '#pitch-slave-d',
                    '#yaw-slave-p', '#yaw-slave-i', '#yaw-slave-d',
                    '#roll-master-p', '#roll-master-i', '#roll-master-d',
                    '#pitch-master-p', '#pitch-master-i', '#pitch-master-d',
                    '#yaw-master-p', '#yaw-master-i', '#yaw-master-d']


// Get PID values from quadcopter on connect
function readPidData() {
    txChar.readValue()
    .then(originalPid => {

        // Convert from dataView to Uint8Array and save original PID data for possible reset
        originalPidData = new Uint8Array(originalPid.buffer, 0, 20);
        console.log("Original PID data received:", originalPid);

        // Write original PID data to input boxes
        for(var i = 1; i <= 18; i++) {
            select(inputMap[i]).value = txCharVal[i];
        }
        return originalPidData;
    });
}

// Use connect() to connect to quadcopter
addListener('#button-connect', 'click', connect);

// Send throttle and PID data to quadcopter
addListener('#button-send', 'click', sendData);

// Send throttle and PID data to quadcopter
addListener('#button-reset', 'click', resetPid);


// Function to be called on connect to set input properties
function onConnect() {
    var inputs = document.getElementsByTagName('input');
    for( var i = 0; i < inputs.length; i++){
        inputs[i].disabled = false;
    }
}

// Function for sending both PID and controller data to quadcopter
function sendData() {

    // Get all PID input data and store to right index of charVal
    for(var i = 1; i <= 18; i++) {
        txCharVal[i] = select(inputMap[i]).value;
    }

    // Get all control input data and store to right index of exCharVal
    exCharVal[0] = select('#throttle').value;

    // Sending PID data with rxChar over BLE
    writeArrayToChar(txChar, txCharVal)
    .then( () => {
        console.log("PID data sent:", txCharVal);

        // Sending throttle data with exChar over BLE
        writeArrayToChar(exChar, exCharVal)
        .then( () => {
            console.log("Data sent:", exCharVal);
        })
        .catch( (error) => {
            console.log('Control data sending failed:', error)
        });
    })
    .catch( (error) => {
        console.log('PID data sending failed:', error)
    });
}

// Reset PID values to original
function resetPid() {
    for(var i = 1; i <= 18; i++) {
        select(inputMap[i]).value = originalPidData[i];
    }
}


// Roll and pitch parameters should always the same
select('#roll-slave-p').addEventListener('input', function() {
    select('#pitch-slave-p').value = this.value;
});

select('#roll-slave-i').addEventListener('input', function() {
    select('#pitch-slave-i').value = this.value;
});

select('#roll-slave-d').addEventListener('input', function() {
    select('#pitch-slave-d').value = this.value;
});

select('#pitch-slave-p').addEventListener('input', function() {
    select('#roll-slave-p').value = this.value;
});

select('#pitch-slave-i').addEventListener('input', function() {
    select('#roll-slave-i').value = this.value;
});

select('#pitch-slave-d').addEventListener('input', function() {
    select('#roll-slave-d').value = this.value;
});

select('#roll-master-p').addEventListener('input', function() {
    select('#pitch-master-p').value = this.value;
});

select('#roll-master-i').addEventListener('input', function() {
    select('#pitch-master-i').value = this.value;
});

select('#roll-master-d').addEventListener('input', function() {
    select('#pitch-master-d').value = this.value;
});

select('#pitch-master-p').addEventListener('input', function() {
    select('#roll-master-p').value = this.value;
});

select('#pitch-master-i').addEventListener('input', function() {
    select('#roll-master-i').value = this.value;
});

select('#pitch-master-d').addEventListener('input', function() {
    select('#roll-master-d').value = this.value;
});

// Function for short-hand access to querySelector
function select(query) {
    return document.querySelector(query);
}

// Function for short-hand access to adding eventListener to element
function addListener(selector, eventType, func) {
    return document.querySelector(selector).addEventListener(eventType, func);
}
