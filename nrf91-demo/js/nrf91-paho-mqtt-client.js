var random = Math.floor(Math.random() * 1000001); // returns a random integer from 0 to 1000.000
// Create a client instance
var client = new Paho.MQTT.Client('5.189.130.26', Number(1897), random.toString());

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({
  onSuccess:onConnect
});


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("Connected to WebSocket");
  client.subscribe("publish/plain");
  message = new Paho.MQTT.Message("Ping");
  message.destinationName = "publish/plain";
  client.send(message);
  client.subscribe("maker_faire/switch");
  client.subscribe("maker_faire/gps");
  connectionStatus.innerHTML = "CONNECTED as " + random;
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
    alert("WebSocket connection lost. "+responseObject.errorMessage);
    connectionStatus.innerHTML = "CONNECTION LOST";
  }
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("Message Arrived: " + message.payloadString);
  console.log("Topic: "      + message.destinationName);
  console.log("..")
  
  if(message.destinationName === "maker_faire/gps")
  {
    const nmeaString = message.payloadString;
    if (nmeaString.split(",")[2].length > 0) {
      const latLng = parseNmeaString(nmeaString);
      updateMap(latLng);
    }
  }
  
  if ((message.destinationName === "maker_faire/switch") && (message.payloadString === "1"))
  {
    waiting.style.display = 'none';
    active.style.display = 'block';
    
  }
  else if ((message.destinationName === "maker_faire/switch") && (message.payloadString === "0")) {
    waiting.style.display = 'block';
    active.style.display = 'none';
  }
}

function updateMap(latLng) {
  circle.setCenter(new google.maps.LatLng(latLng));
  map.setCenter(latLng);
}

function parseNmeaString(str) {
  const gpsData = str.split(",");
  console.log(gpsData);

  const gpsLat = gpsData[2];
  const gpsLatDeg = parseInt(gpsLat.substring(0, 2));
  const gpsLatMins = (parseFloat(gpsLat.substring(2))) / 60;
  console.log(gpsLatMins)


  const gpsLatitude = gpsLatDeg + gpsLatMins;

  const gpsLong = gpsData[4];
  const gpsLongDeg = parseInt(gpsLong.substring(1, 3));
  const gpsLongMins = (parseFloat(gpsLong.substring(3))) / 60;

  gpsLongitude = gpsLongDeg + gpsLongMins;

  return {
    lat: gpsLatitude,
    lng: gpsLongitude
  };
}
