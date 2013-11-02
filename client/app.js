// GLobal namespace for racetime helpers.
Rt = {};

// global helpers + data
// WARNING do not use event as a global name, it collides confusingly
// with a javascript/meteor(?) event.
Rt.race = function raceF() {
	  return Races.findOne(Session.get('race_id'));
};

Rt.stages = function stagesF() {
	  return Stages.find(
		{ race_id:Session.get('race_id')},
		{sort:{number:1, name:1}});
};

Rt.stage = function stagesF() {
	  return Stages.findOne({stage_id:Session.get('stage_id')});
};

Rt.entrants = function entrantsF() {
	  return Entrants.find({race_id:Session.get('race_id')});
};

Rt.goTo = function goToF(pageName){
	//TODO check is valid... or use a router!
	return Session.set('page', pageName);
};

Template.page.pageName = function(){
    return Session.get('page');
};

Template.page.showNewRace = function(){
    return Session.get('page') === "newRace";
};

Template.page.showRaceEdit = function(){
    return Session.get('page') === "raceEdit";
};

Template.page.showRaceSubmit = function(){
	return Session.get('page') === "MEH";
};

Template.page.showResults = function(){
	return Session.get('page') === "results";
//	return 1;
};

Template.page.showRacePicker = function(){
	return !Session.get('page') || Session.get('page') === "pickRace";
};

Template.page.runStage = function(){
	return Session.get('page') === "runStage";
};


