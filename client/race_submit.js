Template.raceSubmit.events({
	'click h2': function () {
		Meteor._debug('unclick');
		Session.set('race_id', null);
	},
	'click .save':onSave,
	'click .cancel':onCancel,
});

Template.raceSubmit.meh = "YOYO";

function onCancel(event) {
	event.preventDefault();
	Meteor._debug('loggy cancel', this, event);
	goTo("pickRace");
}

function onSave(event) {
	event.preventDefault();

	var post = {
			url: $(event.target).find('[name=url]').val(),
			title: $(event.target).find('[name=title]').val(),
			message: $(event.target).find('[name=message]').val()
	};

	Meteor.call('post', post, function(error, id) {
		if (error) {
			// display the error to the user
			throwError(error.reason);

			// if the error is that the post already exists, take us there
			if (error.error === 302)
				Meteor.Router.to('postPage', error.details);

		} 
		else {
			Meteor.Router.to('postPage', id);
		}
	});
}


