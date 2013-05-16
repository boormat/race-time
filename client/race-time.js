(function(){ Events = new Meteor.Collection("events");

// Stage / Test / Heat(?)  are per event.
// Note sure how to represent just yet (Can use nested Lists and Maps in the event Say)
// But we do want a Score to be per Stage, so want a Stage Id?  Or do we just count em?
// See Parties rsvps for example showing manipulating the sub entry.  Might also impact 
// the update/callbacks (ie update an 'event' Vs updating a single stage?)
Stages =  new Meteor.Collection("stages");

Entrants = new Meteor.Collection("entrants");
Scores = new Meteor.Collection("scores");

// virtual results table...
// one row per entrant.  
// Entrant fields... augmented with results.
//Results = new Meteor.Collection("results");

// global helpers + data
var event = function () {
	  return Events.findOne(Session.get('event_id'));
};
var stages = function () {
	  return Stages.find({event_id:Session.get('event_id')});
};
var entrants = function () {
	  return Entrants.find({event_id:Session.get('event_id')});
};


//////////////////////////
// Event Picker.
// Add a search later by club too :-)
Template.events.events = function () {
	return Events.find({}, {});
};

Template.events.show = function () {
	  return !event();
};

Template.event_picker.events({
	'click': function () {
		Session.set("event_id", this._id);
	}
});


////////////////////////// 
// event picker/nav bar
Template.event.event = function () { return event();};
Template.event.show = function () {
	  return !!event();
};
Template.event.events({
	'click': function () {
		console.log('unclick');
		Session.set('event_id', null);
	}
});

//Template.events.entrants = function (event_id) {
//  return Entrants.find({event_id: event_id}, {sort: {score: -1}});
//};
//
//Template.events.stages = function (event_id) {
//	return Stages.find({event_id: event_id}, {sort: {score: -1}});
//};



////////////////////////////////////////
// results page
Template.results.show = function () {
	  return !!event();
};
Template.results.event = function () { return event();};

Template.results.entrants = function (event_id) {
	return entrants;
//	return Entrants.find({event_id: event_id}, {sort: {score: -1}});
};

Template.results.stages = function () {
//	event_id = Session.get('event_id');// || Events.findOne().event_id;
//	Events.findOne({});
//	console.log("results event is", event_id);
//		return Stages.find({event_id: event_id}, {sort: {name: 1}});
	return stages;
//	return Stages.find({}, {sort: {number: 1}});
};

Template.results.results = virtual_results;

//function () {
////	event_id = Session.get('event_id');// || Events.findOne().event_id;
//	Scores.find({event_id: event_id}, {sort: {name: 1}})
////	Events.findOne({});
////	console.log("results event is", event_id);
////		return Stages.find({event_id: event_id}, {sort: {name: 1}});
//	return stages;
////	return Stages.find({}, {sort: {number: 1}});
//};



//results = virtualize_status(entrants.fetch());

//this function goes through and adds the status
function virtual_results() {
	// maybe a MAP would be better, but could not seem to work for me.
	var results=[];
	var scores=[];
	entrants().forEach( function(entrant) {
		// array of scores, sorted by stage number.
		var total = 0;
		entrant.scores = [];
		stages().map( function (stage) {
			var score = Scores.findOne({entrant_id:entrant._id, stage_id:stage._id});
			if(score){
				entrant.scores.push(score);
				total += score.score;
			}
			else{
				entrant.scores.push('');
			}
		});
		entrant.total = total;
		scores.push(total);
		results.push(entrant);
	
	});

	// now calculate position.
	// Hmm write a help to do this... 
	// need to do =1 type calcs.  (A string or a object?)  number and 'iseq' flag
	// Pass in a array of results, and it returns a MAP of score Vs position.
//	_.for()
	// position?  Tricky... Add to totals?
	var posmap = positions_map(scores);
	console.log('scores' , scores);
	console.log('posmap' , posmap);
	_.each(results, function (result) {
		result.position = posmap[result.total];
	});
	
	// sorting... selectable?
	console.log('presorting' , results);
	results.sort(function(a,b){ return a.position - b.position;});
	console.log('  post sorting' , results);
	
	return results;
}


function positions_map(scores){
	var posmap={};
	var counts = _.countBy(scores, function (s) {
    	return s;
    });
	console.log('counts', counts);
//	sorted_counts = _.sortBy(counts, function (key, val, list) {
//		return val;
//	});
	var ss = _.map(scores, function(v) {return parseInt(v);});
	ss.sort(function(a,b){return a-b;}); // stupid javascript numeric sort!
	var sscores = _.uniq(ss, false);
	console.log('sscores', sscores);
	console.log('ss', sscores);
	var pos = 1;
	_.each(sscores, function (key) {
		posmap[key] = pos;
		var val = parseInt(counts[key]);
		if (val > 1)
			posmap[key] = pos; // '=' + pos;
		pos += val;
	});
	return posmap;
}

/*
Template.results.results = function () {
//	event_id = Session.get('event_id');// || Events.findOne().event_id;
	event_id = Session.get('event_id');// || Events.findOne().event_id;
//	entrants = Entrants.
	
    entrants.forEach(function (entrant) {
    	entrant.
    }
	_.each.entrants stages.
	Scores.find({event_id: event_id}, {sort: {name: 1}})
//	Events.findOne({});
//	console.log("results event is", event_id);
//		return Stages.find({event_id: event_id}, {sort: {name: 1}});
	return stages;
//	return Stages.find({}, {sort: {number: 1}});
};





//Pick out the unique tags from all todos in current list.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Todos.find({list_id: Session.get('list_id')}).forEach(function (todo) {
    _.each(todo.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });

  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

results = virtualize_status(Collection.find({}).fetch());


//this function goes through and adds the status
function virtualize_status(results) {
  var totalresults = results.length, element = null;

  for (var i = 0; i < length; i++) {
      element = results[i];
      green = 0;
      red = 0;

      for (var j = 0; j < element.subtasks.length; j++) {
         if(element.subtasks[j].status == "green") {
             green++;
         }
         else if(element.subtasks[j].status == "red") {
             red++;
         }
      }

      final_status = "yellow";

      if(red > 0) {
          final_status = "red";
      }
      else if(green == element.subtasks.length) {
          final_status = "green"
      }

      results[i]["status"] = final_status;
  }

  return results;
}
*/
}).call(this);
