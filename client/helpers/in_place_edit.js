//////////Helpers for in-place editing //////////

//Returns an event map that handles the "escape" and "return" keys and
//"blur" events on a text input (given by selector) and interprets them
//as "ok" or "cancel".
okCancelEvents = function okCancelEventsF(selector, callbacks) {
	var ok = callbacks.ok || function () {};
	var cancel = callbacks.cancel || function () {};


	// actually want this scoped here to use ok + cancel vars.
	// Any better way?
	function onFocusEvent(evt) {
		if (evt.type === "keydown" && evt.which === 27) {
			// escape = cancel
			cancel.call(this, evt);

		} else if (evt.type === "keyup" && evt.which === 13 ||
				evt.type === "focusout") {
			// blur/return/enter = ok/submit if non-empty
			var value = String(evt.target.value || "");
			if (value)
				ok.call(this, value, evt);
			else
				cancel.call(this, evt);
		}
	};

	// build up the event map.
	var events = {};
	events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
		onFocusEvent;

	return events;
};

activateInput = function activateInputF(input) {
	input.focus();
	input.select();
};

