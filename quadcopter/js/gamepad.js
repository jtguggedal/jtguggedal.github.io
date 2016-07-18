
var haveEvents = 'GamepadEvent' in window;
var controllers = {};
var gamepadEnable = false;

var rAF = window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;

function startGamepad() {
    scanGamePads();

}

function updateStatus() {
    scangamepads();

    if(gamepadEnable) {
      for (j in controllers) {
        var controller = controllers[j];
        for (var i=0; i<controller.buttons.length; i++) {
          var b = buttons[i];
          var val = controller.buttons[i];
          var pressed = val == 1;
        }

        for (var i = 0; i < controller.axes.length; i++) {
          console.log('Axis ' + i + ': ' + controller.axes[i]);
        }
      }
      rAF(updateStatus);
    }
}

function scanGamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (!(gamepads[i].index in controllers)) {
      } else {
        controllers[gamepads[i].index] = gamepads[i];
      }
    }
  }
}


if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
}



function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  delete controllers[gamepad.index];
}


function connecthandler(e) {
  rAF(updateStatus);
}
