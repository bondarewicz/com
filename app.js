function clock() {
  let time = new Date();
  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  document.getElementById('time').innerHTML = harold(hours) + ":" + harold(minutes) + ":" + harold(seconds);
  document.getElementById('date').innerHTML = time.toISOString().substr(0, 10);

  let dayNames = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");

  document.getElementById('greeting').innerHTML = 'Happy ' + dayNames[time.getDay()] + ' :)';


  function harold(standIn) {
    if (standIn < 10) {
      standIn = '0' + standIn
    }
    return standIn;
  }
}
setInterval(clock, 200);

window.onload = function () {

  console.time('fetching version');
  fetch('https://api.bondarewicz.com/v1/version')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching version');
      document.getElementById('sha').innerHTML = '<a href="' + data.url + '">v.' + data.sha + '</a>';
    });

  console.time('fetching geoiplookup');
  fetch('https://json.geoiplookup.io/')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching geoiplookup');
      document.getElementById('isp').innerHTML = data.org;
      document.getElementById('ipv6').innerHTML = data.ip;
    });

  // @see http://www.jottings.com/obfuscator/
  coded = "WBR1JkySteI@flJtq.eBl"
  key = "Cfezn3o7Q80GKwslNk1ZLOAyIR9BhEVabXSjqY2iTugcp6H4P5DxJWUMmvrdtF"
  shift = coded.length
  mailto = ""
  for (i = 0; i < coded.length; i++) {
    if (key.indexOf(coded.charAt(i)) == -1) {
      ltr = coded.charAt(i)
      mailto += (ltr)
    } else {
      ltr = (key.indexOf(coded.charAt(i)) - shift + key.length) % key.length
      mailto += (key.charAt(ltr))
    }
  }

  coded = "fCCP8://C1FCC4b.ZMT/rM26xb41FZI"
  key = "6HPsXUkKF549NEbxCuMRfqB7v1mzS2ZdQp8AWOjile0gGratYoDhyJVLwTI3nc"
  shift = coded.length
  twitter = ""
  for (i = 0; i < coded.length; i++) {
    if (key.indexOf(coded.charAt(i)) == -1) {
      ltr = coded.charAt(i)
      twitter += (ltr)
    }
    else {
      ltr = (key.indexOf(coded.charAt(i)) - shift + key.length) % key.length
      twitter += (key.charAt(ltr))
    }
  }

  coded = "PxxsW://wrxP78.qGc/8GUy9g2trqS"
  key = "gkid7qSmMW9pFeT4lvKoNZCP8RLUxjw1ry63uczIDsa2EBVQOG0fXAYhbHJnt5"
  shift = coded.length
  github = ""
  for (i = 0; i < coded.length; i++) {
    if (key.indexOf(coded.charAt(i)) == -1) {
      ltr = coded.charAt(i)
      github += (ltr)
    }
    else {
      ltr = (key.indexOf(coded.charAt(i)) - shift + key.length) % key.length
      github += (key.charAt(ltr))
    }
  }

  coded = "fNNBd://JJJ.EzQPgSzQ.kxT/zQ/yxQSo2gJzka/"
  key = "mfxK2Szue7n1A5pV9bcNlvJhoHrdiW06I8ZRP3UOTtXYwCa4gsQLDFBjGykqEM"
  shift=coded.length
  linkedin=""
  for (i=0; i<coded.length; i++) {
    if (key.indexOf(coded.charAt(i))==-1) {
      ltr = coded.charAt(i)
      linkedin += (ltr)
    }
    else {     
      ltr = (key.indexOf(coded.charAt(i))-shift+key.length) % key.length
      linkedin += (key.charAt(ltr))
    }
  }

  document.getElementById("mail").href = "mailto:" + mailto;
  document.getElementById("twitter").href = twitter;
  document.getElementById("github").href = github;
  document.getElementById("linkedin").href = linkedin;
}

window.ontouchmove = function () {
  return false;
}

function getAddress() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {

      var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&addressdetails=1';
      var address = '';

      console.time('fetching openstreetmap');
      fetch(url)
        .then(data => data.json())
        .then(data => {
          console.timeEnd('fetching openstreetmap');
          console.log(data);
          address = data.display_name;
          document.getElementById('address').innerHTML = '';
          document.getElementById('address').innerHTML = address;
        });
    });
  }
}

function getLocation() {
  if ("geolocation" in navigator) {
    console.time('geolocation');
    navigator.geolocation.watchPosition(function (position) {

      console.timeEnd('geolocation');
      // best to test in Simulator.app (macOS)
      function degToCompass(num) {
        const val = Math.floor((num / 22.5) + 0.5);
        const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return arr[(val % 16)]
      }

      // N	   North	          0°
      // NNE	 North-Northeast	22.5°
      // NE	   Northeast	      45°
      // ENE	 East-Northeast	  67.5°
      // E	   East	            90°
      // ESE	 East-Southeast	  112.5°
      // SE	   Southeast	      135°
      // SSE	 South-Southeast	157.5°
      // S	   South	          180°
      // SSW	 South-Southwest	202.5°
      // SW	   Southwest	      225°
      // WSW	 West-Southwest	  247.5°
      // W	   West	            270°
      // WNW	 West-Northwest	  292.5°
      // NW	   Northwest	      315°
      // NNW	 North-Northwest	337.5°

      var direction = (position.coords.heading) ? degToCompass(position.coords.heading) + ' [' + position.coords.heading + '&deg;] ' : '';
      var kph = (position.coords.speed) ? (position.coords.speed * 3.6).toFixed(2) + 'km/h ' : '';
      var mph = (position.coords.speed) ? (position.coords.speed * 2.2369).toFixed(2) + 'mph ' : '';
      var ms = (position.coords.speed) ? (position.coords.speed).toFixed(2) + 'm/s ' : '';
      var speed = kph + ' ' + mph + ' ' + ms;

      document.getElementById('location').innerHTML = '';
      document.getElementById('location').innerHTML = position.coords.latitude + ' ' + position.coords.longitude;
      document.getElementById('direction').innerHTML = direction;
      document.getElementById('speed').innerHTML = speed;

    });
  }
}

document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);

function onMouseUpdate(event) {
  event = event || window.event; // IE-ism
  document.getElementById('pointer').innerHTML = event.pageX + " x " + event.pageY;
}

document.addEventListener('click', countLeft, false);
document.addEventListener('contextmenu', countRight, false);
document.addEventListener('touchstart', countLeft, false);

var lc = 0;
var rc = 0;
function countLeft() {
  lc++;
  document.getElementById('clicks').innerHTML = lc + ' ' + rc;
}
function countRight() {
  rc++;
  document.getElementById('clicks').innerHTML = lc + ' ' + rc;
}

window.onorientationchange = function () {
  document.body.scrollTop = 0;
}

window.onresize = function (event) {
  var size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
  };

  var view = {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth
  }

  document.getElementById('viewport').innerHTML = size.width + ' x ' + size.height;
};

document.getElementById('os').innerHTML = bowser.osname + ' ' + bowser.osversion
document.getElementById('browser').innerHTML = bowser.name + ' ' + bowser.version;
document.getElementById('agent').innerHTML = navigator.userAgent;
var size = {
  width: window.innerWidth || document.body.clientWidth,
  height: window.innerHeight || document.body.clientHeight
};

var view = {
  width: window.screen.width,
  height: window.screen.height,
  colorDepth: window.screen.colorDepth
}

document.getElementById('viewport').innerHTML = size.width + ' x ' + size.height;

