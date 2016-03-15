	var slotSpinTime = 2500;		// The duration the slot spins when first triggered, 2,5 seconds
	var slotDuration = 10000;		// The duration of the power-up
	var running = false;			// Variable to make sure the function startSlot| can not be triggered when it is already running

$('#btn-slotmachine').on('touchstart mousedown', function(event) {
	console.log("Før startSlot");
	startSlot();
	console.log("Etter startSlot");
	event.preventDefault();
});

function startSlot () {
	if(running == false){
		var randomPower;
		var powerups = ["boost", "rapidfire", "shield", "health"];
		
		running = true;
		
		$('#slotmachine-container').fadeIn(1000);						// Slotmachine fades in during 1 second
		$('span').toggleClass(randomPower);
		$('span').addClass('spin_forward');
			
		randomPower = powerups[Math.floor(Math.random() * powerups.length)];
		$('span').toggleClass(randomPower); 

		setTimeout(function (){stopSlot(randomPower);}, slotSpinTime);								// stopSlot is triggered and the slotmachine stops after rotating for 2,5 seconds
	}
};

function stopSlot(powerup){
	$('span').removeClass('spin_forward');
	console.log(powerup);
	activatePowerup(powerup);
	setTimeout(slotFadeout, slotDuration);								// slotFadeout is triggered after 10 seconds
 }
 
function slotFadeout() {
	$('#slotmachine-container').fadeOut(1000); 							// Slotmachine fades out over the course of 1 second
	deactivatePowerup();
	running = false;
 }

function activatePowerup (powerup) {
	switch (powerup) {
		case "boost":
			speedCoeff = 1;
			break;
		case "rapidfire":
			coolDownPeriod = 500;
			break;
		case "shield":
			preventShot = 1;
			break;
		case "health":
			score++
			$('#points').text('♥ ' + score);
			break;
	};
};

function deactivatePowerup () {
	speedCoeff = 0.78;
	coolDownPeriod = 1500;
	preventShot = 0;
};

