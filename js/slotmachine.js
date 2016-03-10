	var slotTimeOut = 2500;
	var running = false;

$(document).ready(function() {
	
	$('#btn-slotmachine').on('touchstart mousedown', function() {
			if(running == false)
			startSlot();		
	});
	
 });

function startSlot () {
	running = true;
	
	$('#slotmachine-container').fadeIn(1000);
	$('span').toggleClass(rand);
	$('span').addClass('spin_forward');
	
    var powerups = ["boost", "rapidfire", "shield", "health"],
		
    rand = powerups[Math.floor(Math.random() * powerups.length)];
	$('span').toggleClass(rand); 
	console.log(rand); 
	setTimeout(stopSlot, slotTimeOut);
};

 function stopSlot(){
	 $('span').removeClass('spin_forward');
	 setTimeout(slotFadeout, 5000);	
 }
 
  function slotFadeout() {
	$('#slotmachine-container').fadeOut(1000); 
	running = false;
 }


