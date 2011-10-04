var turk = {};

(function() {
	var param = function(url, name ) {
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( url );
	  return ( results == null ) ? "" : results[1];
	}

	var src = param(window.location.href, "assignmentId") ? window.location.href : document.referrer;

	var keys = ["assignmentId","hitId","workerId","turkSubmitTo"];
	keys.map(
		function(key) {
			turk[key] = unescape(param(src, key));
		}
	);

	turk.previewMode = (turk.assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE");

  // Submit a POST request to Turk
	turk.submit = function(data) {

		var assignmentId = turk.assignmentId,
		    turkSubmitTo = turk.turkSubmitTo,
		    filteredData = {},
		    debugOutput = "<p><b>Debug mode</b></p>Here is the data that would have been submitted to Turk: <ul>",
		    hopUndefined = !Object.prototype.hasOwnProperty,
		    form = document.createElement('form');
    
    document.body.appendChild(form);

    if (assignmentId) {
      filteredData["assignmentId"] = assignmentId; 
    }
    
		for(var key in data) {
			if ((hopUndefined || data.hasOwnProperty(key)) && (typeof data[key] != "function") ) {
			  var input = document.createElement('input');
			  input.type = "hidden";
			  input.name = key;
			  input.value = data[key];
			  form.appendChild(input);
				debugOutput += "<li><b>"+key+"</b>: " + data[key] + "</li>" ;
			}
		}
		
		debugOutput += "</ul>";
		
		// If there's no turk info
		if (!assignmentId || !turkSubmitTo) {
		  // Emit the debug output and end
		  var div = document.createElement('div');
		  div.style.font = "14px HelveticaNeue-Light";
		  div.style.boxShadow = "2px 2px 2px grey";
		  div.style.position = "absolute";
		  div.style.padding = "1em";
		  div.style.backgroundColor = "#dfdfdf";
		  div.innerHTML = debugOutput;
		  document.body.appendChild(div);
		  return;
	  }
	  
	  form.action = turk.turkSubmitTo;
    form.method = "POST";
		
		form.submit();
	}
})();