Events = new Meteor.Collection("events");

// Stage / Test / Heat(?)  are per event.
// Note sure how to represent just yet (Can use nested Lists and Maps in the event Say)
// But we do want a Score to be per Stage, so want a Stage Id?  Or do we just count em?
// See Parties rsvps for example showing manipulating the sub entry.  Might also impact 
// the update/callbacks (ie update an 'event' Vs updating a single stage?)
Stages =  new Meteor.Collection("stages");
Entrants = new Meteor.Collection("entrants");
Scores = new Meteor.Collection("scores");


// global helpers + data
// WARNING do not use event as a global name, it collides confusingly
// with a javascript/meteor(?) event.
rtevent = function rtEvent() {
	  return Events.findOne(Session.get('event_id'));
};

stages = function rtStages() {
	  return Stages.find({event_id:Session.get('event_id')});
};

entrants = function rtEntrants() {
	  return Entrants.find({event_id:Session.get('event_id')});
};

