A tiny library for sending data from external webpages to Amazon's Mechanical Turk.

It creates a global JavaScript object, `turk`, that has these five properties:

* `hitId`: the HIT ID variable.
* `assignmentId`: the assignment ID variable.
* `workerId`: the worker ID variable.
* `previewMode`: true if we're currently in the external HIT preview mode.
* `turkSubmitTo`: the Mechanical Turk submission server (either production or sandbox).

These properties get read from `location.href` (e.g., `page.html?assignmentId=foo&workerId=baz&...`)
If they aren't in `location.href`, the script also tries `document.referer`, so you can conceivably split a task across two different pages.
When these properties aren't found, they are set to empty strings (except for `previewMode`, which is true if `assignmentId` is `ASSIGNMENT_ID_NOT_AVAIALBLE`, otherwise false).

mmturkey provides a single method, `turk.submit(data, [unwrap])`, which takes one required argument, `data`, and an optional argument, `unwrap`.

`data` is an object containing keys and values.
If `data` is empty or not supplied, mmturkey responds with an error.
mmturkey will submit `data` (potentially "unwrapped" -- see below) via a POST request to the externalSubmit URL declared in `turk.turkSubmitTo`.

`unwrap`: Best illustrated with an example. Suppose that `data` is this:

```js
{
  id: 30,
  cond: 2,
  demo: {age: 30, gender: "male"},
  trials: [{rt: 100, key: 2}, {rt: 250, key: 1}]
}
```

By default, `unwrap=false`, which means that this will get submitted to Turk:

```js
{
  data: "{'id':30,'cond':2,'demo':{'age':30,'gender':'male'},'trials':[{'rt':100,'key':2},{'rt':250,'key':1}]}"
}
```

Note that what gets submitted to Turk has only a single key, `data`, whose value is the JSON representation of `data`.
When `unwrap` is true, the data submitted to Turk looks like this:

```js
{
  id: 30,
  cond: 2,
  demographics: "{'age': 30, 'gender': 'male'}",
  trials: "[{'rt':100,'key':2},{'rt':250,'answer':1}]"
}
```

Now, the submitted data has four keys, just like `data`; `data` has been "unwrapped".
However, this unwrapping only goes one level deep -- note that the values for `demographics` and `trials` are JSON strings.
Unwrapping is most useful when the data you want to submit is relatively flat.
Ideally, with data that is one level deep, you can directly translate your data into something like a csv file.
For deeper data, you'll have to write your own post-processing code to turn the JSON into something useful for data analysis.
