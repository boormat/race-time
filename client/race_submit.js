Template.newRace.events({
	'submit ': onNewRace,
	'click .save': onNewRace,
	'click .cancel': onCancel,
});

function onCancel(event) {
	Meteor._debug('cancel', this, event);
	Rt.goTo("pickRace");
}

function onNewRace(event, template) {
	event.preventDefault();

	var name = template.find("#name").value;
	//	var name = $(event.target).find('[name=name]').val();
	Meteor._debug('onNewRace', name, event, template, $(event.target), $(event.target).find('[name=name]'));
	//$('#myform').
	Meteor._debug(event.target);
	Meteor._debug(template.find("#name").value);
	if (!name) {
		throwError("Enter a race name");
		return;
	}

	var race_id = Races.insert({
		name: name
	});
	Session.set('race_id', race_id);
	Rt.goTo('editRace');
};



Template.raceEdit.events(okCancelEvents(
	'#racename', {
		ok: function (text, evt) {
			Meteor._debug("update", evt.target.value);
			var id = this._id;
			Races.update(id, {
				name: text
			});
			evt.target.value = '';
			Session.set("editing", null);
		},
		cancel: function (text, evt) {
			Session.set("editing", null);
		},
	}));


Template.raceEdit.helpers({
	race: function () {
		var id = Session.get("race_id");
		Meteor._debug("raceEdit", id);

		return Races.findOne(id);
	},

	editing: function (event, template) {
		return Session.get("editing") === "editname";
	},
});

Template.raceEdit.events({
	'click .save': onSave,
	'click .cancel': onCancel,
	'click h2': onEditName,
});


function onEditName(event, template) {
	Session.set("editing", "editname");
	Deps.flush(); // force DOM redraw, so we can focus the edit field
	var ctl = template.find("#racename")
	Meteor._debug('onEditName', this, event, ctl);
	activateInput(ctl);
}



function onSave(event, template) {
	loggy(event, template);

	var name = $(event.target).find('[name=name]').val();
	//	title: $(event.target).find('[name=title]').val(),
	//	message: $(event.target).find('[name=message]').val()

	if (!name) {
		throwError("Enter a race name");
		return;
	}

	var race_id = Races.insert({
		name: name
	});
	Session.set('race_id', race_id);
	Rt.goTo('editRace');
};


Template.raceEdit.events(okCancelEvents(
	'#new-todo', {
		ok: function (text, evt) {
			Meteor._debug("new", evt.target.value);
			Meteor._debug("new", Todos);
			Todos.insert({
				text: text,
				//					list_id: Session.get('list_id'),
				//					done: false,
				//					timestamp: (new Date()).getTime(),
			});
			evt.target.value = '';
		}
	}));



Template.todo_item.helpers({
	editing: function () {
		return Session.equals('editing_itemname', this._id);
	},
});

Template.todo_item.events({
	'click .destroy': function () {
		Todos.remove(this._id);
	},

	'dblclick .display .todo-text': function (evt, tmpl) {
		Session.set('editing_itemname', this._id);
		Deps.flush(); // update DOM before focus
		activateInput(tmpl.find("#todo-input"));
	},

});

Template.todo_item.events(okCancelEvents(
	'#todo-input', {
		ok: function (value) {
			Todos.update(this._id, {
				$set: {
					text: value
				}
			});
			Session.set('editing_itemname', null);
		},
		cancel: function () {
			Session.set('editing_itemname', null);
		}
	}));


//var post = {
//url: $(event.target).find('[name=url]').val(),
//title: $(event.target).find('[name=title]').val(),
//message: $(event.target).find('[name=message]').val()
//};

//Meteor.call('post', post, function(error, id) {
//if (error) {
//// display the error to the user
//throwError(error.reason);

//// if the error is that the post already exists, take us there
//if (error.error === 302)
//Meteor.Router.to('postPage', error.details);

//} 
//else {
//Meteor.Router.to('postPage', id);
//}
//});
