/** Race-time -- data model
 Races: Overall event details.  (Event is a really really bad name to use in javascript!!!)
 Entrants: competitors in a Race
 Stages: tests/stages in a Race
 Scores: result details per Stage per Entrant in a Race.
 Timestamps: stopwatch events related to a Score (Entrant in a Stage)
*/

/**
Race (Aka Event, Meet)
	name:  name of event
    
    codes:  list of non-finishing result codes {name:WD, when:[start], score:{"min(SLOWEST+10, FASTEST*2)"}}
    penalties:  list of penalties.  e.g: {name:flags, max:1, min:0, score:5.0, desc:"Blah Blah"}
*/

Races = new Meteor.Collection("races");


/**
Stage (Aka Test or Heat)
	name:  name of stage (unique in event)
	number: number of stage in event (count from 1, unique in event)
	race_id: id of the Race
	
*/

Stages =  new Meteor.Collection("stages");

/**
Entrant (Aka Competitor)
	name:
	number: Car number (integer, count from 1, unique in event)  Used for 
		sorting and display.  (Unclear if someone has a 1C type junk)
	race_id: id of the Race
*/
Entrants = new Meteor.Collection("entrants");

/**
Score  (Aka result, time, timecard)
This is key as used for collecting and displaying results.

For convenience when a Stage is declared open, all the Score records are 
created at once.  This is simply to make logic a bit simpler.
Further denormalisation may be very helpfull to make client code simpler
and also faster (in particulare to avoid fetching Entrant all the time)

	stage_id:
	entrant_id:
	race_id:  Not Used?  Deprecated.
	when:  Time (seconds since epoch) when Entrant was queued up to start 
			event.  Used for sorting by order ran.
	state:  Used to track entrants into the through the run.  
		null =  not queued up
		ready = in the start queue.  when indicates the order in queue.
		starting = on start line.  (show stopwatches)
		running = in stage, at LEAST one timekeeper hit start button.
		finishing = approaching finish line (show stopwatches)
		finished = passed finish line, finalising scoring. (at LEAST one 
			timekeeper hit stop button)
		done = scores finalised (score published to results)  (Note score
			can still change due to derived results like WD)
		aborted = this run was aborted, competitor gets another run.  Kept 
			for archival purposes.
	score: Actual score shown in results.  Includes penalties and/or derived. time in seconds.
	penalites: name value pairs for any counting style penalties.  e.g.{cones:1}  (do not include 0 values)
	code: string (enum) for a derived result due to non-standard finish.  (eg DNS, WD, DNF etc)
	rawTime:  Time of run before any penalties. (only present if valid)
	editTime: last manually entered time (e.g. external timing)  Set to always
		preserve a manually entered value in face of random clicks. Only present 
		once manual time edited.

*/
Scores = new Meteor.Collection("scores");

/** Timestamps are the stopwatch type events,  related to a particular score.
	Can be multiple per score
	type = "start" or "stop"
	user = "TBA";  String, user name?  TBA
	score_id = id; related Score
	ignore: true if timestamp was deemed not accurate, and ignored.
	ts: derived timestamp of the event (?) seconds, float
	local: client side timestamp of event. seconds, float
	serverOffset: difference between server and client clocks at time of event.  Used to derive ts.  seconds (?) 
*/
Timestamps = new Meteor.Collection("timestamps");




// Helper to genate a enumeration object from a list of names.
// Freezes object to help avoid aliasing errors.
function MakeEnum(names){
	var anum = _.object(names, names);
	return Object.freeze(anum);
}

SSState = MakeEnum([
				 "queued",
				 "starting",	
                 "running", 
                 "finishing",
                 "finished",
                 "done"]);

SSCode = MakeEnum([	
                "WD", 
                "DNS",
                "DNF"]);

function calcScore(score, slowestTime, fastestTime){
	// code (WD etc)
	// penalites.
	// max times (slowest +, fastest )
	// TODO make slowest and fastest a reactive value on Stage.

	// TODO make all this configurable somehow!
	var failTime = Math.min(slowestTime + 5 , 2 * fastestTime);
	var failTimeDNS = Math.min(slowestTime + 10);

	if(score.state !== SSState.done){
		return failTimeDNS;
	}
	
	var s;
	switch (score.code) {
	case SSCode.WD:
	case SSCode.DNF:
		s = failTime; 
		break;

	case SSCode.DNS:
		s = failTimeDNS;
		break;

	default:
		Meteor._debug("calcScore", score.rawTime, parseFloat(score.rawTime));

		var penalties = 	_.reduce(score.penalties, 
				function(memo, num){ return memo + parseInt(num); }, 0);
		s = parseFloat(score.rawTime) + 5 * penalties;
		
	break;
	}
	return s;
}

Meteor.startup(function () {
	Deps.autorun(reactiveScoreUpdater);
});


function reactiveScoreUpdater(){
	Meteor._debug("maybeupdatescore");

	// Need to calc score in a REACTIVE function to pick up new slowest and fastest times...
	// OR do it on load?
	var scores = Scores.find(
			{state:SSState.done,});

	scores.map( function (score){
		// need a gt$ to ensure a non null score?
		// only exist it valid time
		var fastest = Scores.findOne(
				{	stage_id:score.stage_id, 
					state:SSState.done,
					rawTime:{$exists:true}}, 
					{sort:{rawTime:-1}} );

		var slowest = Scores.findOne(
				{stage_id:score.stage_id, 
					state:SSState.done,
					rawTime:{$exists:true}, // only exist it valid time
				}, 
				{sort:{rawTime:1}});
		Meteor._debug("maybeupdatescore", score, slowest, fastest);

		if(slowest && fastest)
		{
			var s = calcScore(score, slowest, fastest);
			if(s !== score.score){
				Meteor._debug("updatescore", score, slowest, fastest);
				Meteor._debug("updatescore", s, slowest.rawTime, fastest.rawTime);
				Scores.update(score._id, {
					$set:{score:s,},});
			};
		};
	});
}
