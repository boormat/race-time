
Meteor.methods({openStage:openStageCall});

// Meteor.call function (if not autopublished)
// Sets stage status as open and creates empty Score records for all entrants.
// Does not replace existing scores.
// No return values
function openStageCall(stage_id)
{
	Meteor._debug("openStageCall", "hello stage", stage_id);

	var stage = Stages.findOne(stage_id);
	
	if(!stage){
		alert("no stage set", stage_id);
		Meteor._debug("openStageCall", "no stage set", stage_id);
		// error handle? Also check state is as expected.
		return;
	}

	Stages.update(stage_id, {$set:{state:"open"}});
	var entrants = Entrants.find({race_id:stage.race_id});

	entrants.map( function(entrant){
		Meteor._debug("openStageCall", "entrant", entrant);
		insertBlankScore(stage_id, entrant._id);
	});
}

// insert empty score, if not already present.
// returns the Score's _id.
function insertBlankScore(stage_id, entrant_id)
{
	var score = Scores.findOne({stage_id:stage_id, entrant_id:entrant_id});
	if (score){
		Meteor._debug("insertBlankScore", "score already here", score);
		return score._id;
	}
	
	Meteor._debug("insertBlankScore", "NEW", entrant_id, stage_id);
	id = Scores.insert({
		stage_id:stage_id, 
		entrant_id:entrant_id,
		state:0, //0 is not run yet.
		});
	return id;
}
