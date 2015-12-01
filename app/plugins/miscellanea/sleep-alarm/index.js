var libQ = require('kew');
var libFast = require('fast.js');
var fs=require('fs-extra');
var config= new (require('v-conf'))();
var schedule = require('node-schedule');
var io 	= require('socket.io-client');

var sleepTimeout;

// Define the SleepAlarm class
module.exports = SleepAlarm;

function SleepAlarm(context) {
	var self = this;

	// Save a reference to the parent commandRouter
	self.context=context;
	self.commandRouter = self.context.coreCommand;
}

SleepAlarm.prototype.getConfigurationFiles = function()
{
	var self = this;

	return ['config.json'];
}

SleepAlarm.prototype.onVolumioStart = function() {
	var self = this;
	//Perform startup tasks here
	var configFile=self.commandRouter.pluginManager.getConfigurationFile(self.context,'config.json');
	config.loadFile(configFile);
}

SleepAlarm.prototype.onStart = function() {
	var self = this;
	//Perform startup tasks here
}

SleepAlarm.prototype.onStop = function() {
	var self = this;
	//Perform startup tasks here
}

SleepAlarm.prototype.onRestart = function() {
	var self = this;
	//Perform startup tasks here
}

SleepAlarm.prototype.onInstall = function()
{
	var self = this;
	//Perform your installation tasks here
}

SleepAlarm.prototype.onUninstall = function()
{
	var self = this;
	//Perform your installation tasks here
}

SleepAlarm.prototype.getUIConfig = function()
{
	var self = this;

	var uiconf=fs.readJsonSync(__dirname+'/UIConfig.json');

	//enable
	uiconf.sections[0].content[0].value=config.get('enabled');

	//hour
	uiconf.sections[0].content[1].value.value=config.get('hour');

	//minute
	uiconf.sections[0].content[2].value.value=config.get('minute');

	return uiconf;
}

SleepAlarm.prototype.setUIConfig = function(data)
{
	var self = this;

	var uiconf=fs.readJsonSync(__dirname+'/UIConfig.json');

}

SleepAlarm.prototype.getConf = function(varName)
{
	var self = this;

	return self.config.get(varName);
}

SleepAlarm.prototype.setConf = function(varName, varValue)
{
	var self = this;

	self.config.set(varName,varValue);
}

//Optional functions exposed for making development easier and more clear
SleepAlarm.prototype.getSystemConf = function(pluginName,varName)
{
	var self = this;
	//Perform your installation tasks here
}

SleepAlarm.prototype.setSystemConf = function(pluginName,varName)
{
	var self = this;
	//Perform your installation tasks here
}

SleepAlarm.prototype.getAdditionalConf = function()
{
	var self = this;
	//Perform your installation tasks here
}

SleepAlarm.prototype.setAdditionalConf = function()
{
	var self = this;
	//Perform your installation tasks here
}


SleepAlarm.prototype.saveAlarm=function(data)
{
	var self = this;

	var defer = libQ.defer();

	var enabled=data['enabled'];
	var hour=data['hour'];
	var minute=data['minute'];

	config.set('enabled', enabled);
	config.set('hour', hour);
	config.set('minute', minute);

	self.commandRouter.pushToastMessage('success',"Sleep/Alarm", 'Your alarm has been set');


	defer.resolve({});
	return defer.promise;
}

SleepAlarm.prototype.getSleep = function()
{
	var self = this;
	var defer = libQ.defer();


	defer.resolve({
		enabled:config.get('sleep_enabled'),
		time:config.get('sleep_hour')+':'+config.get('sleep_minute')
	});
	return defer.promise;
}

SleepAlarm.prototype.setSleep2 = function(data)
{
	var self = this;
	var defer = libQ.defer();

	config.set('sleep_time',date.duration);
	config.set('sleep_mode',data.mode);
    

	defer.resolve({});
	return defer.promise;
}

SleepAlarm.prototype.changeSleepState = function(data)
{
	var self = this;
	var defer = libQ.defer();

    

    // If we want to enable the timer we enable a setTimeout to stop playing at deferred time
    if(data.enable){
        sleepTimeout = setTimeout(function(){
            var socketURL = 'http://localhost:3000';
            var options = {
                transports: ['websocket'],
                'force new connection': true
            };

            var client1 = io.connect(socketURL, options);

            client1.on('connect', function(data){
                //self.logger.info("Stop playing (time to sleep !) ");
                client1.emit('stop');
            });
        },5000/*config.get('sleep_time')*/);
    }else{
        clearTimeout(sleepTimeout);
    }

    defer.resolve({});
	return defer.promise;
}

SleepAlarm.prototype.changeAlarmState = function(data)
{
	var self = this;
	var defer = libQ.defer();

    if(data.enable){
		  self.alarmSchedule=schedule.scheduleJob('0 27 12 * * *', function(){
            var socketURL = 'http://localhost:3000';
            var options = {
                transports: ['websocket'],
                'force new connection': true
            };

            var client1 = io.connect(socketURL, options);

            client1.on('connect', function(data){
                client1.emit('play');
            });
        });
    }else{
        schedule.cancelJob(self.alarmSchedule);
    }

    defer.resolve({});
	return defer.promise;
}

SleepAlarm.prototype.setSleep = function(data)
{
	var self = this;
	var defer = libQ.defer();

	var splitted=data.time.split(':');

	config.set('sleep_enabled',data.enabled);
	config.set('sleep_hour',splitted[0]);
	config.set('sleep_minute',splitted[1]);
	config.set('sleep_mode',data.mode);
    

	if(self.haltSchedule!=undefined)
	{
		self.haltSchedule.cancel();
		delete self.haltSchedule;
	}

	if(data.enabled)
	{
		self.haltSchedule=schedule.scheduleJob('0 '+splitted[1]+' '+splitted[0]+' * * *', function(){
			config.set('sleep_enabled',false);

            var sleepMode = config.get('sleep_mode',data.mode);
            
            if(sleepMode=='shutdown'){
                self.haltSchedule.cancel();
                delete self.haltSchedule;

                console.log("System is shutting down....");
                setTimeout(function()
                {
                    var exec = require('child_process').exec;

                    exec('halt',
                        function (error, stdout, stderr) {
                            console.log('stdout: ' + stdout);
                            console.log('stderr: ' + stderr);
                            if (error !== null) {
                                console.log('exec error: ' + error);
                            }
                        });
                },5000);
            }else if(sleepMode=='stopPlaying'){
                console.log("Time to sleep ! Stopping music...");
            }
		});
	}

	defer.resolve({});
	return defer.promise;
}