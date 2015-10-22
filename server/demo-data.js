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


// run at server startup to load some demo races (no results)
function demo_data() {
	if (Races.find().count() < 2) {
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

		Meteor._debug("loding data ");
		for (var i = 0; i < data.length; i++) {
			var race_id = Races.insert({name: data[i].name});
			Meteor._debug("add race ", data[i].name);

			for (var j = 0; j < data[i].tests.length; j++) {
				var info = data[i].tests[j];
				Meteor._debug("add stage ", info[0]);
				Stages.insert({race_id: race_id,
					number: j+1,
					name: info[0]});
			}

			for (var j = 0; j < data[i].entrants.length; j++) {
				var info = data[i].entrants[j];
				Meteor._debug("add entrant ", info[0]);
				Entrants.insert({race_id: race_id,
					number: j + 1,
					name: info[0]});
			}
		}
	}
	
//   STOP this now thanks.  Add a button to trigger? 
	Meteor.setTimeout(addResults, 1000);
};

// Adds a random result to the demo races.  Do not run on prod!
function addResults()
{
	// Using forEach callbacks is probably more efficient
	// tried that before ... but some other bug led me to think not working.

	// turn off server timer to avoid loading meteor.com with the test code
	// TODO find a client connecting callback hook to start it again!
	var meh = false;
	for(s in Meteor.default_server.sessions ){
		meh = true;
		Meteor._debug("s", s);
	}
	
	if(!meh){
		Meteor._debug("No clients so long sleep");
	    Meteor.setTimeout(addResults, 30000);
	    return;
	}
	
	Meteor._debug("addResults ");
	Meteor._debug("status", Meteor.default_server.sessions, meh );
	var races = Races.find().fetch();
	for (ev in races){
		var race = races[ev];
	  	var stages = Stages.find({race_id:race._id}).fetch();
	  	for(s in stages){
			stage = stages[s];
	      	entrants = Entrants.find({race_id:race._id}).fetch();
	      	for(en in entrants){
	      		entrant = entrants[en];
				score = Scores.findOne({race_id:race._id, stage_id:stage._id, entrant_id:entrant._id});
//				Meteor._debug("score ", race, stage, entrant, score);
				
				if (!score ){
					Meteor._debug("add score ");
					s = Scores.insert({race_id:race._id, stage_id:stage._id, entrant_id:entrant._id,
						score: Math.floor(Random.fraction()*10)*5});

//					Meteor._debug(Scores.findOne(s));
					Meteor.setTimeout(addResults, 5000);
					return;
				}
			};
		};
	};
	
	Meteor._debug("Score inserts DONE");
	Scores.remove({});
	Meteor.setTimeout(addResults, 10000);

}

Meteor.startup(demo_data);
