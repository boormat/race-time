var stage = Rt.stage;

// entrants who have not done stage...
Template.stageFindNext.pendingEntrants = function () {
//	Meteor._debug("pendingEntrants", Session.get('race_id'), Session.get('stage_id'));
	var stageId = Session.get('stage_id');
	var entrants = Entrants.find({race_id:Session.get('race_id')});

	var scores = Scores.find({stage_id:stageId});
//	Meteor._debug("scores", scores);

	
	var score_eids = [];
	scores.forEach( function(score) {
//		Meteor._debug("score", score);
		score_eids.push(score.entrant_id);});
//	Meteor._debug("score_eids", score_eids);
	var readyEntrants = _.reject(entrants.fetch(), 
			function(e){return _.contains(score_eids, e._id);});

//	Meteor._debug("readyEntrants", readyEntrants);
	return readyEntrants;
};

// entrants (from pendingEntrants... selected as ready to start.
// Shared by setting a flag on the Entrant.  (since can only be 1 place at once!)
Template.stageReady.entrants = [{name:'cat', number:1}, {name:'cat2', number:2}];

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
	