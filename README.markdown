A tiny library for submitting external HITs on Mechanical Turk.

It creates a global JavaScript object, `turk`, that has these five properties:

* `hitId`: the HIT ID variable.
* `assignmentId`: the assignment ID variable.
* `workerId`: the worker ID variable.
* `previewMode`: true if we're currently in the external HIT preview mode.
* `turkSubmitTo`: the Mechanical Turk submission server (either production or sandbox).


These variables get read from `window.location.href`. If they aren't in `window.location.href`, the scrip script also tries `document.referer`, so you can conceivably split a task across two different pages. The script provides a single method:

* `submit(data)`: takes in a single variable, an object (containing keys and values) to store in Turk, and submits a POST request to the proper externalSubmit URL. If an externalSubmit URL hasn't been provided (e.g. because you're testing code outside of the Turk system), it displays what data would have been submitted to Turk.