// Note do not use forms.  It makes more work as you just have to override more stuff (i.e. keystrokes!)

Template.raceSubmit.events({
	'click .save':onSave,
	'click .cancel':onCancel,
});

function onCancel(event) {
	Meteor._debug('loggy cancel', this, event);
	goTo("pickRace");
}

function onSave(event, template) {
	loggy(event, template);

	var name = $(event.target).find('[name=name]').val();
//	title: $(event.target).find('[name=title]').val(),
//	message: $(event.target).find('[name=message]').val()
	
	if (! name )
	{
		throwError("Enter a race name");
		return;
	}

	var race_id = Races.insert({name: name});
	Session.set('race_id', race_id);
	goTo('editRace');
};

//	var post = {
//			url: $(event.target).find('[name=url]').val(),
//			title: $(event.target).find('[name=title]').val(),
//			message: $(event.target).find('[name=message]').val()
//	};
//
//	Meteor.call('post', post, function(error, id) {
//		if (error) {
//			// display the error to the user
//			throwError(error.reason);
//
//			// if the error is that the post already exists, take us there
//			if (error.error === 302)
//				Meteor.Router.to('postPage', error.details);
//
//		} 
//		else {
//			Meteor.Router.to('postPage', id);
//		}
//	});



