/*
	Fractal by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

  skel.breakpoints({
    xlarge: '(max-width: 1680px)',
    large: '(max-width: 1280px)',
    medium: '(max-width: 980px)',
    small: '(max-width: 736px)',
    xsmall: '(max-width: 480px)',
    xxsmall: '(max-width: 360px)'
  });

  $(function() {

    var $window = $(window),
      $body = $('body');

    // Disable animations/transitions until the page has loaded.
    $body.addClass('is-loading');

    $window.on('load', function() {
      window.setTimeout(function() {
        $body.removeClass('is-loading');
      }, 100);
    });

    // Mobile?
    if (skel.vars.mobile) 
      $body.addClass('is-mobile');
    else 
      skel.on('-medium !medium', function() {
        $body.removeClass('is-mobile');
      }).on('+medium', function() {
        $body.addClass('is-mobile');
      });
    
    // Fix: Placeholder polyfill.
    $('form').placeholder();

    // Prioritize "important" elements on medium.
    skel.on('+medium -medium', function() {
      $.prioritize('.important\\28 medium\\29', skel.breakpoint('medium').active);
    });

    // Scrolly.
    $('.scrolly').scrolly({speed: 1500});

    // ip
    $('#ipv4').html('Your IP is ' + ipv4);
    $('#ipv6').html(ipv6);

    // browser
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
        agent = new WhichBrowser({useFeatures: true, detectCamouflage: true});

        $('#agent').html(' ' + agent);
        var dev = "";
        dev += "Cookies Enabled: " + navigator.cookieEnabled + "<br>";
        dev += "Browser Language: " + navigator.language + "<br>";
        dev += "Browser CodeName: " + navigator.appCodeName + "<br>";
        dev += "Browser Name: " + navigator.appName + "<br>";
        dev += "Browser Version: " + navigator.appVersion + "<br>";
        dev += "User-agent header: " + navigator.userAgent;

        $('#dev').html(' ' + dev);

        var icon = (agent.browser.name.toLowerCase() == 'internet explorer') ? 'internet-explorer' : agent.browser.name.toLowerCase()
        $('#icon').addClass('icon fa-' + icon)

        // A wizard to generate this code is at http://www.jottings.com/obfuscator/
        {
          coded = "WBR1JkySteI@flJtq.eBl"
          key = "Cfezn3o7Q80GKwslNk1ZLOAyIR9BhEVabXSjqY2iTugcp6H4P5DxJWUMmvrdtF"
          shift = coded.length
          link = ""
          for (i = 0; i < coded.length; i++) {
            if (key.indexOf(coded.charAt(i)) == -1) {
              ltr = coded.charAt(i)
              link += (ltr)
            } else {
              ltr = (key.indexOf(coded.charAt(i)) - shift + key.length) % key.length
              link += (key.charAt(ltr))
            }
          }
          $('#mail').attr('href', 'mailto:' + link);
        }

      } catch (e) {
        console.error(e)
      }
    });

  });

})(jQuery);