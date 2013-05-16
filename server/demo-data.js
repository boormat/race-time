//All Tomorrow's Parties -- server

//Meteor.publish("directory", function () {
//return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
//});

//Meteor.publish("parties", function () {
//return Parties.find(
//{$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
//});


//if the database is empty on server start, create some sample data.
//var Fiber = require('fibers');
Fiber = Npm.require('fibers');

function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield();
}

function dog() {
//	Events.remove({});
//	Stages.remove({});
//	Entrants.remove({});
	if (Events.find().count() < 2) {
		var data = [
		            {
		            	name: "Hyles1",
		            	tests: [
		            	        ["Swoopy1"],
		            	        ["Blasty1"],
		            	        ["Stoppy1"],
		            	        ],
		            	        entrants: [["Mat Boorman"],
		            	                   ["Rat"],
		            	                   ["Meh"],
		            	                   ["Champer"],
		            	                   ["Awesome"],
		            	                   ["n00b"]]     
		            },
		            {
		            	name: "Hyles2",
		            	tests: [
		            	        ["Swoopy2"],
		            	        ["Blasty2"],
		            	        ["Stoppy2"],
		            	        ],
		            	        entrants: [["Mat Boorman"]]     
		            },
		            ];

//		var timestamp = (new Date()).getTime();
		console.log("loding data ");
		for (var i = 0; i < data.length; i++) {
			var event_id = Events.insert({name: data[i].name});
			console.log("add event ", data[i].name);

			for (var j = 0; j < data[i].tests.length; j++) {
				var info = data[i].tests[j];
				console.log("add stage ", info[0]);
				Stages.insert({event_id: event_id,
					number: j+1,
					name: info[0]});
			}

			for (var j = 0; j < data[i].entrants.length; j++) {
				var info = data[i].entrants[j];
				console.log("add entrant ", info[0]);
				Entrants.insert({event_id: event_id,
					number: j + 1,
					name: info[0]});
			}

//			Stages.find({event_id:event_id}).forEach(function (stage){
//			Entrants.find({event_id:event_id}).forEach(function (entrant) {
//			console.log("add score ");
//			s = Scores.insert({event_id:event_id, stage_id:stage._id, entrant_id:entrant._id,
//			score: Math.floor(Random.fraction()*10)*5});
//			console.log(Scores.findOne(s));
////			sleep(1000);
////			Fiber.current.sleep(1000);
//			});
//			});
		}
	}
	
    Meteor.setTimeout(addResults, 1000);
};

function addResults()
{
	// Using forEach callbacks is probably more efficient
	// tried that before ... but some other bug led me to think not working.

	// turn off server timer to avoid loading meteor.com with the test code
	// TODO find a client connecting callback hook to start it again!
	var meh = false;
	for(s in Meteor.default_server.sessions ){
		meh = true;
		console.log("s", s);
	}
	
	if(!meh){
		console.log("No clients so long sleep");
	    Meteor.setTimeout(addResults, 60000);
	    return;
	}
	
	console.log("addResults ");
	console.log("status", Meteor.default_server.sessions, meh );
	events = Events.find().fetch();
	for (ev in events){
		event = events[ev];
	  	stages = Stages.find({event_id:event._id}).fetch();
	  	for(s in stages){
			stage = stages[s];
	      	entrants = Entrants.find({event_id:event._id}).fetch();
	      	for(en in entrants){
	      		entrant = entrants[en];
				score = Scores.findOne({event_id:event._id, stage_id:stage._id, entrant_id:entrant._id});
//				console.log("score ", event, stage, entrant, score);
				
				if (!score ){
					console.log("add score ");
					s = Scores.insert({event_id:event._id, stage_id:stage._id, entrant_id:entrant._id,
						score: Math.floor(Random.fraction()*10)*5});

//					console.log(Scores.findOne(s));
					Meteor.setTimeout(addResults, 5000);
					return;
				}
			};
		};
	};
	
	console.log("Score inserts DONE");
	Scores.remove({});
	Meteor.setTimeout(addResults, 10000);

}

//function addResults()
//{
//	events = Events.find().fetch();
//	for (event in events){
////    for (var e = 0; e < events.length; e++) {
////    	event = events[]
//    	stages = Stages.find({event_id:event._id}).fetch();
//    	for(stage in stages){
//        	entrants = Entrants.find({event_id:event._id}).fetch();
//        	for(stage in stages){
//
//    		//        for (var s = 0; s < stages.length; s++) {
//				score = Scores.findOne({event_id:event._id, stage_id:stage._id, entrant_id:entrant._id});
//				if (!score){
//					console.log("add score ");
//					s = Scores.insert({event_id:event._id, stage_id:stage._id, entrant_id:entrant._id,
//						score: Math.floor(Random.fraction()*10)*5});
//
////					score.score = 
//
//					console.log(Scores.findOne(s));
////					Meteor.setTimeout(addResults, 1000);
//					return;
//				}
////				Deps.flush();
////				sleep(1000);
////				Fiber.current.sleep(1000);
//			});
//		});
//	});
//}


Meteor.startup(dog);
