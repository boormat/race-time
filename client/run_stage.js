///////////////////////////////////
//helper ... get best timestamp (local time with server time adjusted!)
function getNowTimestamp(){
	var now = Date.now();
	return {ts:now,  local:now, serverOffset:0.0};
}

// helper gets list Entrant and Scores from the stage, in any of the states.
// skips the First skipCount (e.g. use 1 to not include the next one) 
function getEntrantScores(stageId, states, skipCount, sort){
	sort = sort || {when:1, number:1};
	skipCount = skipCount || 0;
	var scores = Scores.find({stage_id:stageId, 
		state:{$in:states}},
		{sort:sort, skip:skipCount });

	var ess=[];// list of Entrant and Score
	scores.forEach( function(score) {
		es={};
		Meteor._debug("score", score);
		es.score = score;
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});

	return ess;
};

function scoresToEntrantScores(scores)
{
	Meteor._debug("scoresToEntrantScores", scores) ;

	var ess=[];// list of Entrant and Score
	_.forEach(scores, function(score) {
		Meteor._debug("scoresToEntrantScores", scores, score) ;

		es={};
		Meteor._debug("score", score);
		es.score = score;
		es.entrant = Entrants.findOne({_id:score.entrant_id});
		ess.push(es);
	});

	return ess;
}

//helper gets NEXT Entrant and Scores from the stage, in any of the states.
function getEntrantScore(stageId, states, sort){
	sort = sort || {when:1, number:1};
	var score = Scores.findOne({stage_id:stageId, 
		state:{$in:states}},
		{sort:sort});

	var es={}; 
	es.score = score;
	es.entrant = score ? Entrants.findOne({_id:score.entrant_id}) : {};
	return es;
};


///////////////////////////////////
//Overall Stage Page. (nav/admin)

Template.runStage.events({
	"click .openStage": onOpenStage,
});


//on click handler.
//Passes to a Meteor.call (for when we lock down collections!)
function onOpenStage(event, template){
	Meteor._debug("onOpenStage", this, template);
	var stageId = Session.get('stage_id');

	Session.set('starter', 1);
	CallsHack.openStageCall(stageId);
}


///////////////////////////////////
//Stage Find Next Entrants
//entrants who have not done stage...
Template.stageFindNext.pendingEntrants = function () {
	// stage id should maybe a template parameter! (do not use globals in sub-templates!)
	var stageId = Session.get('stage_id');
	return getEntrantScores(stageId, [0], 0, {number:1});
};

Template.stageFindNext.events({
	"click .entrant": onQueueEntrant,
});


function onQueueEntrant(event, template){
	Meteor._debug("queueEntrant", this, template);
	var stageId = Session.get('stage_id');
	var entrantId = this._id;
	var now = Date.now();

	// TODO use a Method to do this... so that the back end can merge duplicates.
	// should work find I think. (see stack overflow)
	var score = Scores.findOne({
		stage_id:stageId,
		entrant_id:entrantId,
	});

	Scores.update(score._id, {$set:{state:"queued", when:now}});
	event.preventDefault();
}


//////////////////////////////////////
// Stage Ready

//entrants (from pendingEntrants... selected as ready to start.
//Shared by setting a flag on the Entrant.  (since can only be 1 place at once!)
Template.stageReady.entrants = getReadyEntrantScores;
Template.stageReady.next = getReadyNext;

Template.stageReady.events({
	"click .dequeue": onDequeueEntrant,
	"click .getReady": onGetReadyToStart,
});

function getReadyNext(){
	var stageId = Session.get('stage_id');
	return getEntrantScore(stageId, ["queued", "starting"]);	
};

function getReadyEntrantScores(){
	var stageId = Session.get('stage_id');
	return getEntrantScores(stageId, ["queued", "starting"], 1);
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

	var ts = getNowTimestamp();
	ts.type = "start";
	ts.user = "TBA";
	ts.score_id = id;
	Timestamps.insert(ts);

	Scores.update(id, {
		$set:{state:"running"},
//		$push: {rawStartTimes:{user:"TBA", time:startTime}},
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

function getRunningEntrantScores(){
	var stageId = Session.get('stage_id');
	return getEntrantScores(stageId, ["running","finishing"]);
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

//	return true;
	return getFinisherEntrantScores().length;
//	var stageId = Session.get('stage_id');
//	var scores = Scores.find({stage_id:stageId, state:"finishing"}).fetch();
//	var hasScores = scores.length;

	return hasScores;
};

//CONSTANTS/
//SS={ FINISHED:"finished"};
//var strset = require("./enums");
//var color = new enums.Enum("red", "green", "blue");

//var SSState = new enums.Enum(

//yarp... NOT mongo friendly... so try...

function getFinisherEntrantScores(){

	var stageId = Session.get('stage_id');

	Session.setDefault('finishTimeNeeded', []);

	var wasStarting = Session.get('finishTimeNeeded');
	Meteor._debug("starterDialog", wasStarting,SSState.finishing) ;

	var finishingScores = Scores.find(
			{stage_id:stageId,
				$or:[{state:SSState.finishing},
				     {state:SSState.finished,
					_id:{$in:wasStarting}}]
			},
			{sort:{when:1, number:1}}).fetch();

	//check to avoid a potential loop of death when I have a bug!
	var ids = _.pluck(finishingScores, "_id");
	Session.set('finishTimeNeeded', ids);

	var ess = scoresToEntrantScores(finishingScores);
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

	var ts = getNowTimestamp();
	ts.type = "stop";
	ts.user = "TBA";
	ts.score_id = id;
	Timestamps.insert(ts);

	Scores.update(id, {
		$set:{state:"finished"},
	});

	var starting = Session.get('finishTimeNeeded') || [];
	var nowStarting = _.without(starting, id);
	Session.set('finishTimeNeeded', nowStarting);	
}

function onNotFinisher(event, template){
	Session.set('finisher', null);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage Confirm Score
//Template.stageScore.stage = Rt.stage;
Template.stageScore.entrantScores = getFinishedEntrantScores;
Template.stageScore.next = getFinishedEntrantScore;
Template.stageScore.asTime = tsToMMss; // add as 'object' props on the TimeStamp coln?
Template.stageScore.timestampClass = timestampClass;

Template.stageScore.events({
	"click .save": onScoreSave,
	"click .penalty": onPenalty,
});

function getFinishedEntrantScores(){
	var stageId = Session.get('stage_id');
	return getEntrantScores(stageId, ["finished"], 1);
};

function getFinishedEntrantScore(){
	var stageId = Session.get('stage_id');

	var es = getEntrantScore(stageId, ["finished"]);
	if (! es.score)
		return null;

	es.startTimes=Timestamps.find({score_id:es.score._id, type:"start"}, {sort:{ts:1, user:1 }});
	es.stopTimes=Timestamps.find({score_id:es.score._id, type:"stop"}, {sort:{ts:1, user:1 }});

	var starts = _.reject( es.startTimes.fetch(), function(ts){ return ts.ignore; });
	var stops  = _.reject(  es.stopTimes.fetch(), function(ts){ return ts.ignore; });

	Meteor._debug("times", starts, stops);

	if(starts.length && stops.length){
		var startAvg = _.reduce(starts, function(memo, ts){ return memo + ts.ts; }, 0);
		startAvg /= starts.length;

		var stopAvg = _.reduce(stops, function(memo, ts){ return memo + ts.ts; }, 0); 
		stopAvg /= stops.length;

		es.time = (stopAvg-startAvg) / 1000; // seconds
		es.time = Math.round(es.time * 100) / 100; // round to 100ths (So always consistent)
		//  TODO make configurable... and pad zeros in html
		es.timeSet=true;
		Meteor._debug("times", startAvg, stopAvg, es.time);
	}
	else
	{		
		es.timeSet=false;
		es.time = es.score.rawTime;
	}


	return es;
};


function timestampClass(timestamp) {
	if (timestamp.ignore)
		return "strike";
	return "";
}


function tsToMMss(ts_ms) {
	var d = new Date(ts_ms);

	var m =  d.getMinutes(); 
	var s =  d.getSeconds();
	var cs = d.getMilliseconds()/10;
	var str = m.toPrecision(2) + ':'
	+ s.toPrecision(2) + "."
	+ cs.toPrecision(2);
	return str;
}

function onScoreSave(event, template){

	var id = this.score._id;
	var t = this.timeSet ? this.time : $('#time').val();
	t = Math.round(t * 100) / 100; // round to 100ths (So always consistent)
	Meteor._debug("onScoreSave", t, this, template);
	Scores.update(id, {
		$set:{
			state:SSState.done,
			rawTime:t,
		},
	});
}


function onPenalty(event, template){
	Meteor._debug("onScorePlus", this, event, template);

	var id = this.score._id;

	var pname = 'penalties.' + event.target.name;
	var inc = Number(event.target.value);
	var p = {};
	p[pname] = inc;

	// when client side, cant use a selector...
	if(Meteor.isServer)
	{
		Scores.update({_id:id, $gt:{pname:0}}, 
				{$inc:p,});
	}
	else
	{

		var newp = this.score.penalties[event.target.name] + inc;

		if( newp >= 0 ){
			Meteor._debug("onScorePlus SADF", newp, pname);
			Scores.update(id, {$inc:p,});
		}

	}
}

//Template.
Template.toggleableTimestamp.asTime = tsToMMss; // add as 'object' props on the TimeStamp coln?
Template.toggleableTimestamp.timestampClass = timestampClass;
Template.toggleableTimestamp.events({
	"click ": onToggleTimestamp,
});

function onToggleTimestamp(event, template){
	Meteor._debug("onToggleTimestamp", this, template, this.ignore);

	Timestamps.update(this._id, {
		$set:{ ignore:!this.ignore,}
	});
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Stage Done   Archive.

Template.stageDone.entrantScores = getDoneEntrantScores;
Template.stageDone.stage = Rt.stage;

Template.stageDone.events({
	"click .edit": onDoneUnsave,
});

function getDoneEntrantScores(){
	var stageId = Session.get('stage_id');
	return getEntrantScores(stageId, [SSState.done]);
};


//helper to break down the penalty map to a name value list.
//more recent Handlebars can apparently do this built in {{@key}}
Template.stageDone.penaltyList = function(arg){
//	_.map({one : 1, two : 2, three : 3}, function(num, key){ return num * 3; });
	var meh = _.map(arg, function(val, key, list){ 
		return {'key':key, 'val':val};}
	);
	return meh;
};

// revert a done score back to edit view
function onDoneUnsave(event, template){
	Meteor._debug("onDoneUnsave", this, template, this.ignore);

	Scores.update(this.score._id, {
		$set:{ state:SSState.finished}
	});
}





