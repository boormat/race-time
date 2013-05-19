//////////////////////////
// Race Picker.
// Add a search later by club too :-)
Template.racePicker.raceList = function () {
	return Races.find({}, {});
};

Template.racePicker.show = function () {
	return !race();
};

Template.racePicker.events({
	'click .newRace':onCreateRace,
});


//////// 
Template.racePickerItem.events({
	'click .pickRace': onPickRace,
});


function onPickRace(event, template)
{
	Session.set("race_id", this._id);
	goTo("results");
    event.preventDefault();
};

function onCreateRace(event, template)
{
	Meteor._debug("Clicky", event);
	Meteor._debug("Clicky", template);
	Session.set("race_id", null);
	goTo("newRace");
    event.preventDefault();
};
