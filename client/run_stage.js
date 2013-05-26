var stage = {name:'dog', penalties:['flags']};
Template.runStage.stage = stage;
//Template.runStage.meh = [{name:'dog', val:1},{ name:'cat', val:2}];

// entrants who have not done stage...
Template.stageFindNext.pendingEntrants = [{name:'cat', number:1}, {name:'cat2', number:2}];


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
	