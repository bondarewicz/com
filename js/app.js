jQuery('#ip').html('Your IP is '+myip);
jQuery('#timeago').livestamp();

var ref = document.referrer;
if(typeof ref === 'undefined' || ref === ''){
  jQuery('#from').html('when you came directly to this site.');
} else {
  jQuery('#from').html('when you came from '+ref+'.');
};


function waitForWhichBrowser(cb) {
    var callback = cb;
    
    function wait() {
      if (typeof WhichBrowser == 'undefined') 
        window.setTimeout(wait, 100)
      else 
        callback();
    }
    
    wait();
  }

  waitForWhichBrowser(function() {

    try {
      Browsers = new WhichBrowser({
        useFeatures:    true,
        detectCamouflage: true
      });
      
      jQuery('#agent').html('and you are using ' + Browsers);

    } catch (e) {
      //fixme
    }
  });