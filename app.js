function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0,
      v = c == 'x'
        ? r
        : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateUuid() {
  if (window.confirm(uuid() + "\nregenerate?")) 
    generateUuid();
  }

cheet('u u i d', function() {
  generateUuid()
});

function ref() {
  var ref = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 20; i++) {
    ref += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return ref;
}

function generateRef() {
  if (window.confirm(ref() + "\nregenerate?")) 
    generateRef();
  }

cheet('r e f', function() {
  generateRef();
});

function ip() {
  return ipv4 + '\n' + ipv6;
}

cheet('i p', function() {
  alert(ip());
});

function ua() {
  return navigator.userAgent;
}
cheet('u a', function() {
  alert(ua());
});

function b() {
  return bowser.name + ' ' + bowser.version + ' on ' + bowser.osname + ' ' + bowser.osversion;
}

cheet('b', function() {
  alert(b());
});

function l() {
  return navigator.languages;
}

cheet('l', function() {
  alert(l());
});

function s() {
  var size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
  };
  return 'Screen: ' + window.screen.width + 'x' + window.screen.height + ' ' + window.screen.colorDepth + 'bit color \nBrowser: ' + size.width + 'x' + size.height;

}

cheet('s', function() {
  alert(s());
});

window.onload = function() {

  // @see http://www.jottings.com/obfuscator/
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

  document.getElementById("mail").href = "mailto:" + link;
}

window.ontouchmove = function() {
  return false;
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
// document.getElementById('ipv6').innerHTML = ipv6;

document.getElementById('browser').innerHTML = bowser.name + ' ' + bowser.version + ' (' + navigator.language + ') on ' + bowser.osname + ' ' + bowser.osversion;
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

document.getElementById('screen').innerHTML = view.width + 'x' + view.height + ' ' + view.colorDepth + 'bit color';
document.getElementById('viewport').innerHTML = size.width + ' x ' + size.height;