var turk;
turk = turk || {};

(function() {
  if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
      var len = this.length >>> 0;
      if (typeof fun != "function") { throw new TypeError(); }

      var res = new Array(len);
      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in this)
          res[i] = fun.call(thisp, this[i], i, this);
   		}
      return res;
    };
  }

  
  var hopUndefined = !Object.prototype.hasOwnProperty,
      showPreviewWarning = true;
  
  // We can disable the previewWarning by including this script with "nowarn" in the script url
  // (i.e. mmturkey.js?nowarn). This doesn't work in FF 1.5, which doesn't define document.scripts
  if (document.scripts) {
    for(var i=0, ii = document.scripts.length; i < ii; i++ ) {
      var src = document.scripts[i].src;
      if ( /mmturkey/.test(src) && /\?nowarn/.test(src) ) {
        showPreviewWarning = false;
        break;
      }
    }
  }
  
  var param = function(url, name ) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return ( results == null ) ? "" : results[1];
  }
  
  function getKeys(obj) {
    var a = [];
    for(var key in obj) {
      if ((hopUndefined || obj.hasOwnProperty(key)) && (typeof obj[key] != "function") ) {
        a.push(key);
      }
    }
    return a;
  }
  
  // warning: Object.keys() is no good in older browsers
  function isTable(array,equality) {
  	if (!(array instanceof Array)) {
  		return false;
  	}
  	
  	// if the array contains a non-Object, bail
  	if (array.reduce(function(acc,x) { return !(x instanceof Object) || acc },false)) {
  	  return false;
  	}

  	if (equality == "loose") {
  		return array.reduce(function(a,x) {
  			return a && typeof x == "object"
  		},true);
  	}
  	
    var arraysEqual = function(a,b) {
    	var i = a.length;
    	if (b.length != i) {
    		return false;
    	}
    	while(i--) {
    		if (a[i] != b[i]) {
    			return false;
    		}
    	}
    	return true;	
    }    

  	var keys = getKeys(array[0]);

  	return array.reduce(function(a,x) {
  		return a && arraysEqual(keys,getKeys(x));
  	},true);
  }
  
  var htmlifyTable = function(array) {
    var getRow = function(obj) {
      var str = "";
      str += "<tr>";
      str += keys.map(function(k) { return "<td>" + obj[k] + "</td>" }).join("\n");
      str += "</tr>";
      return str;
    }
    
    var keys = getKeys(array[0]);
    
    var str = "";
    str += "<span title='tabular representation of array of objects with the same set of keys'>";
    str += "<table border='1' style='border-collapse: collapse' cellpadding='3'>"
    str += "<tr>";
      str += keys.map(function(k) { return "<th>" + k + "</th>" }).join("\n");
    str += "</tr>";
    str += array.map(getRow).join("\n");
    str += "</table></span>";
    
    return str;
  }
  
  // Give an HTML representation of an object
  var htmlify = function(obj) {
    // Disabled for now, as this doesn't work for tables embedded within tables
    /*if (isTable(obj)) {
      return htmlifyTable(obj);
    } else */
    if (obj instanceof Array) {
      return "[" + obj.map(function(o) { return htmlify(o) } ).join(",") + "]";
    } else if (typeof obj == "object") {
      var strs = [];
      for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var str = "<li>" + htmlify(key) + ": " + htmlify(obj[key]) + "</li>";
          strs.push(str);
        }
      }
      return "{<ul>" + strs.join("") + "</ul>}";
    } else if (typeof obj == "string")  {
      return '"' + obj + '"';
    } else if (typeof obj == "undefined" ) {
      return "[undefined]"
    } else {
      return obj.toString();
    }
  };
  
  var addFormData = function(form,key,value) {
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  var url = window.location.href,
      src = param(url, "assignmentId") ? url : document.referrer,
      keys = ["assignmentId","hitId","workerId","turkSubmitTo"];
  
  keys.map(function(key) {
    turk[key] = unescape(param(src, key));
  });

  turk.previewMode = (turk.assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE");

  // Submit a POST request to Turk
  turk.submit = function(object, unwrap) {
    var keys = getKeys(object);
    
    if (typeof object == "undefined" || keys.length == 0) {
      alert("mmturkey: you need to pass an object (i.e., actual data) to turk.submit() ");
      return;
    }
    
    unwrap = !!unwrap;
    
    var assignmentId = turk.assignmentId,
        turkSubmitTo = turk.turkSubmitTo,
        rawData = {},
        form = document.createElement('form');
   
    document.body.appendChild(form);
    
    if (assignmentId) {
      rawData.assignmentId = assignmentId;
      addFormData(form,"assignmentId",assignmentId);
    }
    
    if (unwrap) {
      // Filter out non-own properties and things that are functions
      keys.map(function(key) {
        rawData[key] = object[key];
        addFormData(form, key, JSON.stringify(object[key]));
      });
      
    } else {
      rawData["data"] = object;
      addFormData(form, "data", JSON.stringify(object));
    }

    // If there's no turk info
    if (!assignmentId || !turkSubmitTo) {
      // Emit the debug output and stop
      var div = document.createElement('div'),
          style = div.style;
      style.fontFamily = '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", sans-serif';
      style.fontSize = "14px";
      style.cssFloat = "right";
      style.padding = "1em";
      style.backgroundColor = "#dfdfdf";
      div.innerHTML = "<p><b>Debug mode</b></p>Here is the data that would have been submitted to Turk: <ul>" + htmlify(rawData) + "</ul>";
      div.className = "mmturkey-debug";
      document.body.appendChild(div);
      return;
    }

    // Otherwise, submit the form
    form.action = turk.turkSubmitTo + "/mturk/externalSubmit";
    form.method = "POST";
    form.submit();
  }
  
  // simulate $(document).ready() to show the preview warning
  if (showPreviewWarning && turk.previewMode) {
    var intervalHandle = setInterval(function() {
      try {
        var div = document.createElement('div'),
            style = div.style;
        style.backgroundColor = "gray";
        style.color = "white";
        
        style.position = "absolute";
        style.margin = "0";
        style.padding = "0";
        style.paddingTop = "15px";
        style.paddingBottom = "15px";
        style.top = "0";
        style.width = "98%";
        style.textAlign = "center";
        style.fontFamily = "arial";
        style.fontSize = "24px";
        style.fontWeight = "bold";
        
        style.opacity = "0.5";
        style.filter = "alpha(opacity = 50)";
        
        div.innerHTML = "PREVIEW MODE: CLICK \"ACCEPT\" ABOVE TO START THIS HIT";
        
        document.body.appendChild(div);
        clearInterval(intervalHandle);
      } catch(e) {
        
      }
    },20);
  }
  
})();