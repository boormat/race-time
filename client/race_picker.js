//////////////////////////
// Race Picker.
// Add a search later by club too :-)
Template.racePicker.raceList = function () {
	return Races.find({}, {});
};

Template.racePicker.show = function () {
	return !Rt.race();
};

Template.racePicker.events({
	'click .newRace':onCreateRace,
    'click .editRace': onEditRace,
	'click .runStage': onRunStage,
});

Template.racePicker.raceStages = function (race_id) {
	  return Stages.find({race_id:race_id},
				{sort:{number:1, name:1}});
};


//////// 
Template.racePickerItem.events({
	'click .pickRace': onPickRace,
});


function onPickRace(event, template)
{
	Session.set("race_id", this._id);
	Rt.goTo("results");
    event.preventDefault();
};

function onRunStage(event, template)
{
	Meteor._debug("onRunStage", this.race_id, this._id);
	
	Session.set("race_id", this.race_id);
	Session.set("stage_id", this._id);

	Rt.goTo("runStage");
    event.preventDefault();
};

function onEditRace(event, template)
{
    Meteor._debug("Clicky", this, this._id);
    Session.set("race_id", this._id);
	Rt.goTo("raceEdit");
    event.preventDefault();
};

function onCreateRace(event, template)
{
	Meteor._debug("Clicky", event);
	Meteor._debug("Clicky", template);
	Session.set("race_id", null);
	Rt.goTo("newRace");
    event.preventDefault();
};
