///////////////////////////////////
//helper ... get best timestamp (local time with server time adjusted!)
function getNowTimestamp(){
	var now = Date.now();
	return {ts:now,  local:now, serverOffset:0.0};
}


///////////////////////////////////
// Overall Stage Page. (nav/admin)

Template.runStage.events({
	"click .openStage": onOpenStage,
});


// on click handler.
// Passes to a Meteor.call (for when we lock down collections!)
function onOpenStage(event, template){
	Meteor._debug("onOpenStage", this, template);
	var stageId = Session.get('stage_id');

	Session.set('starter', 1);
//	Meteor.call("openStage", stageId);
	CallsHack.openStageCall(stageId);
}


///////////////////////////////////
// Stage Find Next Entrants
// entrants who have not done stage...
// TODO check if reactivity churn is too high on results???
// MAYBE this should probably be a publication? Still need filter on client tho?
Template.stageFindNext.pendingEntrants = function () {
	// stage id should maybe a template parameter! (do not use globals in sub-templates!)
	var stageId = Session.get('stage_id');
	
	var scores = Scores.find({
		stage_id:stageId, state:0 },
		{sort:{number:1} });
	
	var ess =[];
	scores.map(function(score){
		es = {};
		es.score = score;
		es.entrant = Entrants.findOne(score.entrant_id);
		Meteor._debug("pendingEntrants", es);

		ess.push(es);
	});
	return ess;
};

Template.stageFindNext.events({
		"click .entrant": onQueueEntrant,
});


function onQueueEntrant(event, template){
	Meteor._debug("queueEntrant", this, template);
	var stageId = Session.get('stage_id');
	var entrantId = this._id;
	var now = Date.now();
//	var raceId = this.race_id;
	
	// TODO use a Method to do this... so that the back end can merge duplicates.
	// should work find I think. (see stack overflow)
	var score = Scores.findOne({
		stage_id:stageId,
		entrant_id:entrantId,
		});

	Scores.update(score._id, {$set:{state:"queued", when:now}});
	Meteor._debug("queueEntrant update", score, Scores.findOne(score._id));
	event.preventDefault();
}

function onFilterEntrants(event, template){
	Meteor._debug("onFilterEntrants", this, template);
	var value = String(event.target.value || "");
	Meteor._debug("onFilterEntrants", value);

	// This sets up a DOM change cycle that is clearing the input.
	// maybe a focus thing?
	Session.set('entrantFilter', value);
//	event.preventDefault();
}


//////////////////////////////////////
// Stage Ready

// entrants (from pendingEntrants... selected as ready to start.
// Shared by setting a flag on the Entrant.  (since can only be 1 place at once!)
Template.stageReady.entrants = getReadyEntrantScores;
Template.stageReady.next = getReadyNext;

Template.stageReady.events({
	"click .dequeue": onDequeueEntrant,
	"click .getReady": onGetReadyToStart,
});

function getReadyNext(){
	var stageId = Session.get('stage_id');
	var score = Scores.findOne({stage_id:stageId, 
		state:{$in:["queued", "starting"]}},
		{sort:{when:1, number:1} });
	Meteor._debug("getReadyNext", stageId, score);

	var es={}; 
	es.score = score;
	es.entrant = score ? Entrants.findOne({_id:score.entrant_id}) : {};

	return es;
};

function getReadyEntrantScores(){
	var stageId = Session.get('stage_id');
	var scores = Scores.find({stage_id:stageId, 
		state:{$in:["queued", "starting"]}},
		{sort:{when:1, number:1} });

	var ess=[];// list of Entrant and Score
	scores.forEach( function(score) {
		es={};
		Meteor._debug("score", score);
		es.score = score;
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});
	// hide the 'next' one
	ess.shift();

	Meteor._debug("getReadyEntrantScores", ess);
	return ess;
};


function onDequeueEntrant(event, template){
	Meteor._debug("onDequeueEntrant", this, template);
	var id = this.score._id;
	Scores.update(id, {$set:{state:0}});
	
	event.preventDefault();
}

function onGetReadyToStart(event, template){
	Meteor._debug("onGetReadyToStart", this, template);
	// popup the modal dialog by putting the score into starting state...
	var id = this.score._id;

	Scores.update(id, {$set:{state:"starting"}});

	Session.set('starter', true);

	event.preventDefault();
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage starterDialog
Template.starterDialog.entrantScores = getStarterEntrantScores;

Template.starterDialog.events({
	"click .now": onRunStart,
	"click .cancel": onCancelStarting,
	"click .notTimer": onNotStarter,
});

Template.starterDialog.show = function () {
	Session.setDefault('starter', true);
	if (! Session.get('starter'))
		return false;

	var stageId = Session.get('stage_id');

	var startingScores = Scores.find(
		{stage_id:stageId,state:"starting"},
		{sort:{when:1, number:1}});
	var startingIds = [];
	startingScores.map(function(score){ 
		startingIds.push(score._id);});

	Session.setDefault('startTimeNeeded', []);
	var wasStarting = Session.get('startTimeNeeded');

	// get was is still startable (because we hit start a bit later than some other timer)
	var runningIds = [];
	var runningScores = Scores.find(
			{stage_id:stageId, state:"running"} );
	runningScores.map(function(score){ 
		runningIds.push(score._id);});
	
	// Note attempt to keep insertion order to avoid screen resorts. (per client)
	var startables = _.union(startingIds,
			_.intersection(wasStarting, runningIds) );

	// filter out anything definately finished? Nah
	Meteor._debug("starterDialog", wasStarting, startables, runningIds, startingIds);
	
	//check to avoid a potential loop of death when I have a bug!
	if(wasStarting !== startables)
		Session.set('startTimeNeeded', startables);
	return startables.length;
};

function getStarterEntrantScores(){
	var startTimeNeeded = Session.get('startTimeNeeded');
	

	var ess=[];// list of Entrant and Score
	_.each(startTimeNeeded, function(scoreId){
		es={};
		es.score = 	Scores.findOne(scoreId);
		es.entrant = Entrants.findOne(es.score.entrant_id);
		ess.push(es);
	});

	return ess;
};

function onRunStart(event, template){
	Meteor._debug("onRunStart", this, template);
	// popup the modal dialog by putting the score into starting state...
	// should check state is valid... but still record a time in the result
	// just in case already moved to 'finished'???
	var id = this.score._id;
	var startTime = getNowTimestamp();
	
	Scores.update(id, {
		$set:{state:"running"},
		$push: {rawStartTimes:{user:"TBA", time:startTime}},
		});

	var starting = Session.get('startTimeNeeded') || [];
	var nowStarting = _.without(starting, id);
	Session.set('startTimeNeeded', nowStarting);	
}

function onCancelStarting(event, template){
	Meteor._debug("onCancelStarting", this, template);
	// popup the modal dialog by putting the score into starting state...
	// This REALLY needs to be server side, but try to minimise races
	// by checking state on update.
	// otherwise come up with better model so 'starting and finishing'
	// are not state records on the Score.  (e.g. a separate message?)
	// then is a one way, (each client just cancels when they want?)
	var id = this.score._id;
	
	var score = Scores.findOne(id);//;, state:"running"}, {$set:{state:"queued"}});
	if(score.state === "starting")
		Scores.update(id, {$set:{state:"queued"}});
	
	// still remove from popup!
	var starting = Session.get('startTimeNeeded') || [];
	var nowStarting = _.without(starting, id);
	Session.set('startTimeNeeded', nowStarting);	
	event.preventDefault();
}

function onNotStarter(event, template){
	Session.set('starter', null);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage Running

//Template.stageRunning.stage = Rt.stage;
Template.stageRunning.entrantScores = getRunningEntrantScores;

Template.stageRunning.events({
//	"click .dequeue": onDequeueEntrant,
	"click .getReady": onGetReadyToFinish,
});

//Template.stageRunning.entrants = // [{name:'cat', number:1}, {name:'cat2', number:2}];
function getRunningEntrantScores(){
	var stageId = Session.get('stage_id');
	var scores = Scores.find(
		{stage_id:stageId, state:{$in:["running","finishing"]}},
		{sort:{when:1, number:1}}
		);

	var ess=[];// list of Entrant and Score
	scores.forEach( function(score) {
		es={};
//		Meteor._debug("score", score);
		es.score = score;
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});

//	Meteor._debug("getStarterEntrantScores", ess);
	return ess;
};

function onGetReadyToFinish(event, template){
	Meteor._debug("onGetReadyToFinish", this, template);
	// popup the modal dialog by putting the score into starting state...
	var id = this.score._id;
	Scores.update(id, {$set:{state:"finishing"}});

	Session.set('finisher', true);

	event.preventDefault();
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage Run Finishing Dialog


Template.finisherDialog.entrantScores = getFinisherEntrantScores;

Template.finisherDialog.events({
	"click .now": onRunStop,
	"click .cancel": onRunStopLater,
	"click .notTimer": onNotFinisher,
});

Template.finisherDialog.show = function () {
	Meteor._debug("finisherDialog", "show");

	Session.setDefault('finisher', true);
	if (! Session.get('finisher'))
		return false;

	var stageId = Session.get('stage_id');
	var scores = Scores.find({stage_id:stageId, state:"finishing"}).fetch();
	var hasScores = scores.length;

	return hasScores;
};

function getFinisherEntrantScores(){
	var stageId = Session.get('stage_id');
	var scores = Scores.find({stage_id:stageId, state:"finishing"});

	var ess=[];// list of Entrant and Score
	scores.forEach( function(score) {
		es={};
		es.score = score;
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});

	return ess;
};

function onRunStopLater(event, template){
//	Session.set('starter', null);
	Meteor._debug("onRunStopLater", this, template);
	// popup the modal dialog by putting the score into starting state...
	var id = this.score._id;
	Scores.update(id, {
		$set:{state:"running"},
		});
}

function onRunStop(event, template){
//	Session.set('starter', null);
	Meteor._debug("onRunStop", this, template);
	// popup the modal dialog by putting the score into starting state...
	var id = this.score._id;
	var time = getNowTimestamp();
	Scores.update(id, {
		$set:{state:"finished"},
		$push: {rawStopTimes:{user:"TBA", time:time}},
		});
}

//function onCancelStarting(event, template){
//	Meteor._debug("onCancelStarting", this, template);
//	// popup the modal dialog by putting the score into starting state...
//	var id = this.score._id;
//	Scores.update(id, {$set:{state:"queued"}});
//	
//	event.preventDefault();
//}

function onNotFinisher(event, template){
	Session.set('finisher', null);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage Confirm Score
//Template.stageScore.stage = Rt.stage;
Template.stageScore.entrantScores = getFinishedEntrantScores;
Template.stageScore.next = getFinishedEntrantScore;

function getFinishedEntrantScores(){
	var stageId = Session.get('stage_id');
	var scores = Scores.find(
		{stage_id:stageId, state:"finished"},
		{sort:{when:1, number:1} });

	var ess=[];// list of Entrant and Score
	scores.forEach( function(score) {
		es={};
		es.score = score;
		p = es.score.penalties = es.score.penalties || {};
		p.cones = p.cones || 0;
		p.gates = p.gates || 0;
		
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});

	// drop the 'next' one
	ess.shift();
	return ess;
};

function getFinishedEntrantScore(){
	var stageId = Session.get('stage_id');
	var score = Scores.findOne(
		{stage_id:stageId, state:"finished"},
		{sort:{when:1, number:1} });
	
	Meteor._debug("getFinishedEntrantScore", stageId, score);

	if (!score)
		return null;

	var es={}; 
	es.score = score;
	es.entrant = score ? Entrants.findOne({_id:score.entrant_id}) : {};

	return es;
};


//Template.stageScore.entrantScore.entrant = [{name:'cat', number:1}, {name:'cat2', number:2}];
//Template.stageScore.entrantScore.rawScores = [{start:{time:2, trashed:0}, stop:{time:1}}, 
//	{start:{time:2, trashed:0}, stop:{time:1}}
//	];


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage Done   Archive.
var ess = [];
var es1 = {};
es1.entrant = {name:'cat', number:1};
es1.score = { score:61.23, time:61.23, code:'WD', penalties:{cones:1}}; //[{name:'cones', val:1}]};
es1.rawScores = [{start:{time:2, trashed:0}, stop:{time:1}}, 
           	{start:{time:2, trashed:1}, stop:{time:1}}
];
ess.push(es1);

Template.stageDone.entrantScores = ess;
Template.stageDone.stage = Rt.stage;
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
	