Races = new Meteor.Collection("races");

// Stage / Test / Heat(?)  are per race.
// Note sure how to represent just yet (Can use nested Lists and Maps in the race Say)
// But we do want a Score to be per Stage, so want a Stage Id?  Or do we just count em?
// See Parties rsvps for example showing manipulating the sub entry.  Might also impact 
// the update/callbacks (ie update an 'race' Vs updating a single stage?)
Stages =  new Meteor.Collection("stages");
Entrants = new Meteor.Collection("entrants");
Scores = new Meteor.Collection("scores");


// global helpers + data
// WARNING do not use event as a global name, it collides confusingly
// with a javascript/meteor(?) event.
race = function raceF() {
	  return Races.findOne(Session.get('race_id'));
};

stages = function stagesF() {
	  return Stages.find({race_id:Session.get('race_id')});
};

entrants = function entrantsF() {
	  return Entrants.find({race_id:Session.get('race_id')});
};

Template.page.showRaceSubmit = function(){
	return Session.get('page') === "newRace";
};

Template.page.showResults = function(){
	return Session.get('page') === "results";
//	return 1;
};

Template.page.showRacePicker = function(){
	return !Session.get('page') || Session.get('page') === "pickRace";
};

Template.page.runStage = function(){
	return !Session.get('page') || Session.get('page') === "runStage" || 1;
};

goTo = function goToF(pageName){
	//TODO check is valid... or use a router!
	return Session.set('page', pageName);
};