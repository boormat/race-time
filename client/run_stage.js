var stage = Rt.stage;

///////////////////////////////////
// Stage Find Next Entrants
// entrants who have not done stage...
// TODO might be EASIEST to create all the 'blank' results when
// the stage is opened.  Save allot of hassle!
Template.stageFindNext.pendingEntrants = function () {
	var stageId = Session.get('stage_id');
	var entrants = Entrants.find({race_id:Session.get('race_id')});

	var scores = Scores.find({stage_id:stageId});
	
	var score_eids = [];
	scores.forEach( function(score) {
		score_eids.push(score.entrant_id);});
	var readyEntrants = _.reject(entrants.fetch(), 
			function(e){return _.contains(score_eids, e._id);});

	return readyEntrants;
};

Template.stageFindNext.events({
		"click .entrant": onQueueEntrant,
});

function onQueueEntrant(event, template){
	Meteor._debug("queueEntrant", this, template);
	var stageId = Session.get('stage_id');
	var entrantId = this._id;
	var raceId = this.race_id;
	
	// TODO use a Method to do this... so that the back end can merge duplicates.
	// should work find I think. (see stack overflow)
    Scores.insert( {stage_id:stageId, entrant_id:entrantId, state:'queued'});
	
	event.preventDefault();
}


//////////////////////////////////////
// Stage Ready

// entrants (from pendingEntrants... selected as ready to start.
// Shared by setting a flag on the Entrant.  (since can only be 1 place at once!)
Template.stageReady.entrants = getReadyEntrantScores;

Template.stageReady.events({
	"click .dequeue": onDequeueEntrant,
});

function getReadyEntrantScores(){
	var stageId = Session.get('stage_id');
	var scores = Scores.find({stage_id:stageId, state:"queued"});

	var ess=[];// list of Entrant and Score
	scores.forEach( function(score) {
		es={};
//		Meteor._debug("score", score);
		es.score = score;
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});

//	Meteor._debug("getReadyEntrantScores", getReadyEntrantScores);
	return ess;
};


function onDequeueEntrant(event, template){
	Meteor._debug("onDequeueEntrant", this, template);
	var id = this.score._id;
	Scores.remove( {_id:id}); // TODO instead just change state.  (less risk of data loss!)
	
	event.preventDefault();
}


//////////////////////////////////////
//Stage Ready

Template.stageRunning.entrants = [{name:'cat', number:1}, {name:'cat2', number:2}];

var ess = [];
var es1 = {};
es1.entrant = {name:'cat', number:1};
es1.score = { score:61.23, time:61.23, code:'WD', penalties:{cones:1}}; //[{name:'cones', val:1}]};
es1.rawScores = [{start:{time:2, trashed:0}, stop:{time:1}}, 
             	{start:{time:2, trashed:1}, stop:{time:1}}
];
ess.push(es1);

Template.stageScore.stage = stage;

Template.stageScore.entrantScores = ess;
//Template.stageScore.entrantScore.entrant = [{name:'cat', number:1}, {name:'cat2', number:2}];
//Template.stageScore.entrantScore.rawScores = [{start:{time:2, trashed:0}, stop:{time:1}}, 
//	{start:{time:2, trashed:0}, stop:{time:1}}
//	];

Template.stageDone.entrantScores = ess;
Template.stageDone.stage = stage;
//Template.stageDone.myname = function(arg){return "hi arg['cones']";};

// helper to break down the penalty map to a name value list.
// more recent Handlebars can apparently do this built in {{@key}}
Template.stageDone.penaltyList = function(arg){
//	_.map({one : 1, two : 2, three : 3}, function(num, key){ return num * 3; });
	var meh = _.map(arg, function(val, key, list){ 
		return {'key':key, 'val':val};}
		);
	return meh;
	};
//	return [arg['cones']];};//"hi arg['cones']";};
	