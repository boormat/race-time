// GLobal namespace for racetime helpers.
Rt = {};

// global helpers + data
// WARNING do not use event as a global name, it collides confusingly
// with a javascript/meteor(?) event.
Rt.race = function raceF() {
	return Races.findOne(Session.get('race_id'));
};

Rt.stages = function stagesF() {
	return Stages.find({
		race_id: Session.get('race_id')
	}, {
		sort: {
			number: 1,
			name: 1
		}
	});
};

Rt.stage = function stagesF() {
	return Stages.findOne({
		stage_id: Session.get('stage_id')
	});
};

Rt.entrants = function entrantsF() {
	return Entrants.find({
		race_id: Session.get('race_id')
	});
};

Rt.goTo = function goToF(pageName) {
	//TODO check is valid... or use a router!
	return Session.set('page', pageName);
};

Template.page.helpers( {
	pageName: function() {
		return Session.equals('page', undefined) ? 'blank' : Session.get('page');
	},

	showNewRace: function() {
		return Session.equals('page', "newRace");
	},

	showRaceEdit: function() {
		return Session.equals('page',  "raceEdit");
	},

	showRaceSubmit: function() {
		return Session.equals('page', "MEH");
	},

	showResults: function() {
		return Session.equals('page', "results");
	},

	showRacePicker: function() {
		return Session.equals('page', undefined) || Session.equals('page', "pickRace");
	},

	runStage: function() {
		return Session.equals('page', "runStage");
	}
});
