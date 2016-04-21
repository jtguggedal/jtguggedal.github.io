
var slot = slot || {};

slot.spinTime = 2500;		// The duration the slot spins when first triggered, 2,5 seconds
slot.duration = 10000;		// The duration of the power-up
slot.running = false;		// Variable to make sure the method start() can not be triggered when it is already running
slot.powerups = ["boost", "rapidfire", "shield", "health"];
slot.prevVal = 0;

slot.start = function() {
	if(slot.running == false){
		var randomPower;
		slot.running = true;

		$('#slotmachine-container').fadeIn(1000);
		$('span').toggleClass(randomPower);
		$('span').addClass('spin_forward');

		randomPower = slot.powerups[Math.floor(Math.random() * slot.powerups.length)];
		$('span').toggleClass(randomPower);

		setTimeout(function (){
			slot.stop(randomPower);
		}, slot.spinTime);
	}
};

slot.stop = function(powerup){
	$('span').removeClass('spin_forward');
	console.log(powerup);
	slot.activatePowerup(powerup);
	setTimeout(function() {
		slot.fadeout(powerup);
	}, slot.duration);
};

slot.fadeout = function(powerup) {
	$('#slotmachine-container').fadeOut(1000);
	slot.deactivatePowerup(powerup);
	slot.running = false;
};

slot.activatePowerup = function(powerup) {
	switch(powerup) {
		case "boost":
			slot.prevVal = game.speedCoeff;
			game.speedCoeff = 1;
			break;
		case "rapidfire":
			slot.prevVal = game.coolDownPeriod;
			game.coolDownPeriod = 500;
			break;
		case "shield":
			slot.prevVal = game.preventShot;
			game.preventShot = 1;
			break;
		case "health":
			game.score++
			$('#points').text('♥ ' + game.score);
			break;
	};
};

slot.deactivatePowerup = function(powerup) {
	switch(powerup) {
		case "boost":
			slot.speedCoeff = slot.prevVal;
			break;
		case "rapidfire":
			slot.coolDownPeriod = slot.prevVal;
			break;
		case "shield":
			slot.preventShot = slot.prevVal;
			break;
	};
};
