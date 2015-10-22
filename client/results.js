////////////////////////////////////////
// Race results page

//// basic routing

Template.results.helpers({
	race: Rt.race,
	stages: Rt.stages,
	results: virtual_results,
});

Template.results.events({
	'click h1': function () {
		Meteor._debug('unclick');
		Session.set('race_id', null);
		Rt.goTo("pickRace");
	}
});


//this function goes through and adds the status
function virtual_results() {
	var results = [];
	var scores = []; // per entrant total score for pos calc.

	// Build the row of results per Entrant, adding stage scores array and total.
	Rt.entrants().forEach(function (entrant) {
		// array of scores, sorted by stage number.
		var total = 0;
		var stageCount = 0;
		entrant.scores = [];
		Rt.stages().map(function (stage) {
			var score = Scores.findOne({
				entrant_id: entrant._id,
				stage_id: stage._id,
				state: SSState.done
			});
			if (score) {
				entrant.scores.push(score.score.toFixed(2));
				total += score.score;
				stageCount++;
			}
			else {
				entrant.scores.push('');
			}
		});
		entrant.total = total.toFixed(2); //configurable
		entrant.scoreKey = [stageCount, entrant.total]; //]{total:entrant.total, stages:stageCount};
		scores.push(entrant.scoreKey); //{total:entrant.total, stages:stageCount});
		results.push(entrant);

	});

	// now calculate position.
	// Hmm write a help to do this... 
	// need to do =1 type calcs.  (A string or a object?)  number and 'iseq' flag
	// Pass in a array of results, and it returns a MAP of score Vs position.
	// TODO ... make the SORT used a derived time for competitors yet to run, so
	// partial results reflect order at end of last stage.  (Or sort finished people
	// before those not yet run?  Seems fair???
	var posmap = positions_map(scores);
	Meteor._debug('scores', scores);
	Meteor._debug('posmap', posmap);
	_.each(results, function (result) {
		result.position = posmap[result.scoreKey]; //result.total];
	});

	// sorting... 
	// TODO make selectable.
	Meteor._debug('presorting', results);
	results.sort(function (a, b) {
		return a.position.num - b.position.num;
	});
	Meteor._debug('  post sorting', results);

	return results;
}


// helper function to generate the list of positions for the passed in list of scores.
// TODO return text AND numeric (sortable) (or provide a sort function?)
function positions_map(scores) {
	var posmap = {};

	// group and the same scores into a map.
	var counts = _.countBy(scores, function (s) {
		return s;
	});
	Meteor._debug('counts', counts);

	// sort and filter to unique scores 
	var ss = _.map(scores, function (v) {
		return v;
	});
	ss.sort(function (a, b) {
		// sort by num stages finsihed first
		// then by times.
		return b[0] - a[0] || a[1] - b[1];
	});

	// uniq borked when a list instead of a primitive (ptr I guess)
	var sscores = _.uniq(ss, false, function (val) {
		return '' + val[0] + val[1];
	});
	Meteor._debug('sscores', sscores);

	// build the map of score against position.
	var pos = 1;
	_.each(sscores, function (key) {
		var val = parseInt(counts[key]);
		//		posmap[key] = pos;
		var posName = ((val > 1) ? '=' : '') + pos;
		posmap[key] = {
			name: posName,
			num: pos
		};
		pos += val; ///AH do not increment till out of block....?
		Meteor._debug('ss', key, posmap[key], val);
	});
	return posmap;
};
