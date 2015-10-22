if (Meteor.isClient) {
	Meteor.startup(function () {
		
		function setServerTime(){
			//get server time (it's in milliseconds)
			Meteor.call("ktgetServerTime", function (error, result) {

				//get client time in milliseconds
				localTime = new Date().getTime();

				//difference between server and client
				var serverOffset = result - localTime;

				//store difference in the session
				Session.set("serverTimeOffset", serverOffset);
			});
		}

		function setDisplayTime(){
			var offset = Session.get("serverTimeOffset");
			var adjustedLocal = new Date().getTime() + offset;
			Session.set("serverTime", adjustedLocal);
		}

		//run these once on client start so we don't have to wait for setInterval
		setServerTime();
		setDisplayTime();

		//check server time every 15min
		setInterval(function updateServerTime() {
			setServerTime();
		}, 900000);

		//update clock on screen every second
		setInterval(function updateDisplayTime() {
			setDisplayTime();
		}, 1000);

	});

}

//server...
if (Meteor.isServer) {
	Meteor.methods({

		//get server time in milliseconds
		ktgetServerTime: function () {
			var _time = (new Date).getTime();
			Meteor._debug(_time);
			return _time;
		}
	});
}
