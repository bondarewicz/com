function clock() {
  let time = new Date();
  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();
  
  document.getElementById('time').innerHTML = '<span class="hljs-comment">'+harold(hours) + ":" + harold(minutes) + ":" + harold(seconds)+'</span>';
  document.getElementById('date').innerHTML = '<span class="hljs-comment">' + time.toISOString().substr(0, 10) + '</span>';
  
  // Array of day names
var dayNames = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");

// document.write("Happy " + dayNames[now.getDay()] + ".");
document.getElementById('greeting').innerHTML = '<span class="hljs-comment">Happy '+dayNames[time.getDay()] + '.</span>';


  function harold(standIn) {
    if (standIn < 10) {
      standIn = '0' + standIn
    }
    return standIn;
  }
}
setInterval(clock, 200);

window.onload = function() {
  
  console.time('fetching github');
  fetch('https://api.github.com/repos/bondarewicz/com/commits')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching github');
      document.getElementById('sha').innerHTML = '<a href="'+data[0].html_url+'"><span class="hljs-comment">'+(data[0].sha).substr(0, 7)+'</span></a>';
    });
  
  console.time('fetching uuid');
  fetch('https://api-bondarewicz.herokuapp.com/uuid')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching uuid');
      document.getElementById('uuid').innerHTML = '<span class="hljs-comment">'+data+'</span>';
    });
  
  console.time('fetching ref');
  fetch('https://api-bondarewicz.herokuapp.com/ref')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching ref');
      document.getElementById('ref').innerHTML = '<span class="hljs-comment">'+data+'</span>';
    });
    
  console.time('fetching ip');
  fetch('https://api-bondarewicz.herokuapp.com/ip')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching ip');
      document.getElementById('ipv4').innerHTML = '<span class="hljs-comment">'+data+'</span>';
    });
  
  console.time('fetching haiku');
  fetch('https://api-bondarewicz.herokuapp.com/haiku')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching haiku');
      document.getElementById('haiku').innerHTML = '<span class="hljs-comment">'+data+'</span>';
    });
  
  console.time('fetching sprint');
  fetch('https://api-bondarewicz.herokuapp.com/sprint')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching sprint');
      document.getElementById('sprint').innerHTML = '<span class="hljs-comment">'+data+'</span>';
    });
  
  console.time('fetching hex');
  fetch('https://api-bondarewicz.herokuapp.com/hex')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching hex');
      document.getElementById('hex').innerHTML = '<span class="hljs-comment">'+data+'</span>';
    });
  
  console.time('fetching geoiplookup');
  fetch('https://json.geoiplookup.io/')
    .then(data => data.json())
    .then(data => {
      console.timeEnd('fetching geoiplookup');
      document.getElementById('isp').innerHTML = '<span class="hljs-comment">'+data.isp+'</span>';
      document.getElementById('ipv6').innerHTML = '<span class="hljs-comment">'+data.ip+'</span>';
      document.getElementById('hostname').innerHTML = '<span class="hljs-comment">'+data.hostname+'</span>';
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
  shift=coded.length
  twitter=""
  for (i=0; i<coded.length; i++) {
    if (key.indexOf(coded.charAt(i))==-1) {
      ltr = coded.charAt(i)
      twitter += (ltr)
    }
    else {     
      ltr = (key.indexOf(coded.charAt(i))-shift+key.length) % key.length
      twitter += (key.charAt(ltr))
    }
  }
  
  coded = "PxxsW://wrxP78.qGc/8GUy9g2trqS"
  key = "gkid7qSmMW9pFeT4lvKoNZCP8RLUxjw1ry63uczIDsa2EBVQOG0fXAYhbHJnt5"
  shift=coded.length
  github=""
  for (i=0; i<coded.length; i++) {
    if (key.indexOf(coded.charAt(i))==-1) {
      ltr = coded.charAt(i)
      github += (ltr)
    }
    else {     
      ltr = (key.indexOf(coded.charAt(i))-shift+key.length) % key.length
      github += (key.charAt(ltr))
    }
  }

  document.getElementById("mail").href = "mailto:" + mailto;
  document.getElementById("twitter").href =  twitter;
  document.getElementById("github").href =  github;
}

window.ontouchmove = function() {
  return false;
}


function startSpeech() {
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.interimResults = true;

  let p = document.createElement('p');
  const words = document.querySelector('.words');
  words.appendChild(p);

  recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('')

      const poopScript = transcript.replace(/poop|poo|shit|dump/gi, '💩');
      p.textContent = poopScript;

      if (e.results[0].isFinal) {
        p = document.createElement('p');
        words.appendChild(p);
      }
  });

  recognition.addEventListener('end', recognition.start);
  recognition.start();
}

function getAddress() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      
      var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat='+position.coords.latitude+'&lon='+position.coords.longitude+'&addressdetails=1';
      var address = '';
      
      console.time('fetching openstreetmap');
      fetch(url)
        .then(data => data.json())
        .then(data => {
          console.timeEnd('fetching openstreetmap');
          console.log(data);
          address = data.display_name;
          document.getElementById('address').innerHTML = '';
          document.getElementById('address').innerHTML = '<span class="hljs-comment">'+address+'</span>';
        });
    });
  }
}

function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(function(position) {
      
      // best to test in Simulator.app (macOS)
      function degToCompass(num){
        const val =  Math.floor((num / 22.5) + 0.5);
        const arr = ["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
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
      
      var direction = (position.coords.heading) ? degToCompass(position.coords.heading) +' ['+position.coords.heading+'&deg;] ' : '';
      var kph = (position.coords.speed) ? (position.coords.speed*3.6).toFixed(2) +'km/h ' : '';
      var mph = (position.coords.speed) ? (position.coords.speed*2.2369).toFixed(2) +'mph ' : '';
      var ms = (position.coords.speed) ? (position.coords.speed).toFixed(2) +'m/s ' : '';
      var speed = kph+' '+mph + ' ' +ms;
      
      document.getElementById('location').innerHTML = '';
      document.getElementById('location').innerHTML = '<span class="hljs-comment">'+position.coords.latitude +' '+position.coords.longitude+'</span>';
      document.getElementById('direction').innerHTML = '<span class="hljs-comment">'+direction+'</span>';
      document.getElementById('speed').innerHTML = '<span class="hljs-comment">'+speed+'</span>';
      
    });
  }  
}
    
document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);
    
function onMouseUpdate(event) {
  event = event || window.event; // IE-ism
  document.getElementById('pointer').innerHTML = '<span class="hljs-comment">'+event.pageX + " x " + event.pageY+'</span>';
}

document.addEventListener('click', countLeft, false);
document.addEventListener('contextmenu', countRight, false);
document.addEventListener('touchstart', countLeft, false);

var lc = 0;
var rc = 0;
function countLeft() {
  lc++;
  document.getElementById('clicks').innerHTML = '<span class="hljs-comment"> '+lc+' '+rc+'</span>';
}
function countRight() {
  rc++;
  document.getElementById('clicks').innerHTML = '<span class="hljs-comment"> '+lc+' '+rc+'</span>';
}

window.onorientationchange = function() {
  document.body.scrollTop = 0;
}

window.onresize = function(event) {
  var size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
  };

  var view = {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth
  }

  document.getElementById('screen').innerHTML = '<span class="hljs-comment">' + view.width + 'x' + view.height + ' ' + view.colorDepth + 'bit color</span>';
  document.getElementById('viewport').innerHTML = '<span class="hljs-comment">' + size.width + ' x ' + size.height + '</span>';
};

document.getElementById('ipv4').innerHTML = ipv4;
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

document.getElementById('screen').innerHTML = view.width + ' x ' + view.height;
document.getElementById('color').innerHTML = view.colorDepth + 'bit';
document.getElementById('viewport').innerHTML = size.width + ' x ' + size.height;
document.getElementById('lang').innerHTML = navigator.languages;

