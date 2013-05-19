// helper for event binding testing.
loggy = function loggy(event, template){
	
    if (event) event.preventDefault();
	Meteor._debug('loggy loggy');
	if(event)	Meteor._debug('loggy event', event);
	if(this)	Meteor._debug('loggy this', this);
	if(template)	Meteor._debug('loggy template', template);

};
