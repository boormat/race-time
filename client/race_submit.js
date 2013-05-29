//Note do not use forms.  It makes more work as you just have to override more stuff (i.e. keystrokes!)
var Todos = new Meteor.Collection(null);  // will not work if you pass the name.


Template.raceSubmit.events({
	'click .save':onSave,
	'click .cancel':onCancel,
	'click .clear':onClear,
});

function onCancel(event) {
	Meteor._debug('loggy cancel', this, event);
	Rt.goTo("pickRace");
}

function onClear(event) {
	Todos.remove({});
//	Meteor._debug('loggy cancel', this, event);
//	Rt.goTo("pickRace");
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
	Rt.goTo('editRace');
};



//////////Todos //////////

//Template.todos.loading = function () {
//return todosHandle && !todosHandle.ready();
//};

//Use a local data source while creating.
//This is so can validate the bunch.
//Todos =  new Meteor.Collection("newRace");

Template.todos.events(okCancelEvents(
		'#new-todo',
		{
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

Template.todos.todos = function () {
	return Todos.find();
};

Template.todo_item.editing = function () {
	return Session.equals('editing_itemname', this._id);
};

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
		'#todo-input',
		{
			ok: function (value) {
				Todos.update(this._id, {$set: {text: value}});
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



