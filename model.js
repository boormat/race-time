//Race-time -- data model
//Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Races
Races = new Meteor.Collection("races");

// Stage / Test / Heat(?)  are per race.
// Note sure how to represent just yet (Can use nested Lists and Maps in the race Say)
// But we do want a Score to be per Stage, so want a Stage Id?  Or do we just count em?
// See Parties rsvps for example showing manipulating the sub entry.  Might also impact 
// the update/callbacks (ie update an 'race' Vs updating a single stage?)
Stages =  new Meteor.Collection("stages");

Entrants = new Meteor.Collection("entrants");
Scores = new Meteor.Collection("scores");
Timestamps = new Meteor.Collection("timestamps");





function MeNum(names){
	var anum = _.object(names, names);
	return Object.freeze(anum);
}

SSState = MeNum([	
                 "running", 
                 "finishing",
                 "finished",
                 "done"]);

SSCode = MeNum([	
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
