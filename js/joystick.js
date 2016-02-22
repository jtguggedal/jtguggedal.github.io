
// Funksjon for at joysticken skal gå tilbake til nullpunktet når den slippes
var REVERT_THRESHOLD = 1000;
var $ball = $('.ball.moveable');
var initialOffset = $ball.offset();


$('.ball').on("change mousemove touchmove", function() {
    var offset = $ball.position();
    var y = initialOffset.top - offset.top;
    var x = -1*(initialOffset.left - offset.left);
    var speed = sqrt(x^2 + y^2);

    $('#pos-x').html('x: ' + x + 'px');
    $('#pos-y').html('y: ' + y + 'px');
    $('#speed').html('Hastighet: ' + speed);

});

$ball.pep({

  useCSSTranslation: false,
  shouldEase: false,
  constrainTo: 'parent',
   initiate: function(){
     this.$el.removeClass('ease')
   },
  stop: function(){
    var offset = this.$el.position();    
    var diffTop  = initialOffset.top - offset.top;
    var diffLeft = -1*(initialOffset.left - offset.left);

    if ( diffTop < REVERT_THRESHOLD && diffLeft < REVERT_THRESHOLD ){
      this.$el.css( initialOffset ).addClass('ease') ;



    }
  }
})