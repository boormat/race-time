//////////////////////////
// Event Picker.
// Add a search later by club too :-)
Template.events.events = function () {
	return Events.find({}, {});
};

Template.events.show = function () {
	return !rtevent();
};

Template.event_picker.events({
	'click': function () {
		Session.set("event_id", this._id);
	}
});

