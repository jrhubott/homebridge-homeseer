'use strict';

//
// HomeSeer Platform Shim for HomeBridge by Jean-Michel Joudrier - (stipus at stipus dot com)
// V0.1 - 2015/10/07
// - Initial version
// V0.2 - 2015/10/10
// - Occupancy sensor fix
// V0.3 - 2015/10/11
// - Added TemperatureUnit=F|C option to temperature sensors
// - Added negative temperature support to temperature sensors
// V0.4 - 2015/10/12
// - Added thermostat support
// V0.5 - 2015/10/12
// - Added Humidity sensor support
// V0.6 - 2015/10/12
// - Added Battery support
// - Added low battery support for all sensors
// - Added HomeSeer event support (using HomeKit switches...)
// V0.7 - 2015/10/13
// - You can add multiple HomeKit devices for the same HomeSeer device reference
// - Added CarbonMonoxide sensor
// - Added CarbonDioxide sensor
// - Added onValues option to all binary sensors
// V0.8 - 2015/10/14
// - Added uuid_base parameter to all accessories
// V0.9 - 2015/10/16
// - Smoke sensor battery fix
// - Added offEventGroup && offEventName to events (turn <event> on launches one HS event. turn <event> off can launch another HS event)
// - Added GarageDoorOpener support
// - Added Lock support
// V0.10 - 2015/10/29
// - Added Security System support
// - Added Window support
// - Added Window Covering support
// - Added obstruction support to doors, windows, and windowCoverings
// V0.11 - 2018/01/13
// - Added battery support to Lock devices and added added battery services to other devices.
// V0.12 - New Pollinng
//
// Remember to add platform to config.json. 
//
// You can get HomeSeer Device References by clicking a HomeSeer device name, then 
// choosing the Advanced Tab.
//
// The uuid_base parameter is valid for all events and accessories. 
// If you set this parameter to some unique identifier, the HomeKit accessory ID will be based on uuid_base instead of the accessory name.
// It is then easier to change the accessory name without messing the HomeKit database.
// 
//
// Example:
// "platforms": [
//     {
//         "platform": "HomeSeer",              // Required
//         "name": "HomeSeer",                  // Required
//         "host": "http://192.168.3.4:81",     // Required - If you did setup HomeSeer authentication, use "http://user:password@ip_address:port"
//
//         "events":[                           // Optional - List of Events - Currently they are imported into HomeKit as switches
//            {
//               "eventGroup":"My Group",       // Required - The HomeSeer event group
//               "eventName":"My On Event",     // Required - The HomeSeer event name
//               "offEventGroup":"My Group",    // Optional - The HomeSeer event group for turn-off <event>
//               "offEventName":"My Off Event", // Optional - The HomeSeer event name for turn-off <event>
//               "name":"Test",                 // Optional - HomeSeer event name is the default
//               "uuid_base":"SomeUniqueId"     // Optional - HomeKit identifier will be derived from this parameter instead of the name
//            }
//         ],
//
//         "accessories":[                      // Required - List of Accessories
//            {
//              "ref":8,                        // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab) 
//              "type":"Lightbulb",             // Optional - Lightbulb is the default
//              "name":"My Light",              // Optional - HomeSeer device name is the default
//              "offValue":"0",                 // Optional - 0 is the default
//              "onValue":"100",                // Optional - 100 is the default
//              "can_dim":true,                 // Optional - true is the default - false for a non dimmable lightbulb
//              "uuid_base":"SomeUniqueId2"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
//            },
//            {
//              "ref":9                         // This is a dimmable Lightbulb by default
//            },
//            {
//              "ref":58,                       // This is a controllable outlet
//              "type":"Outlet"
//            },
//            {
//              "ref":111,                      // Required - HomeSeer Device Reference for your sensor
//              "type":"TemperatureSensor",     // Required for a temperature sensor
//              "temperatureUnit":"F",          // Optional - C is the default
//              "name":"Bedroom temp",          // Optional - HomeSeer device name is the default
//              "batteryRef":112,               // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15           // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor
//              "type":"SmokeSensor",           // Required for a smoke sensor
//              "name":"Kichen smoke detector", // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//              "onValues":[1,1.255]            // Optional - List of all HomeSeer values triggering a "ON" sensor state - Default is any value different than 0
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor (Here it's the same device as the SmokeSensor above)
//              "type":"CarbonMonoxideSensor",  // Required for a carbon monoxide sensor
//              "name":"Kichen CO detector",    // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//              "onValues":[2,2.255]            // Optional - List of all HomeSeer values triggering a "ON" sensor state - Default is any value different than 0
//            },
//            {
//              "ref":113,                      // Required - HomeSeer Device Reference of the Current Temperature Device
//              "type":"Thermostat",            // Required for a Thermostat
//              "name":"Température Salon",     // Optional - HomeSeer device name is the default
//              "temperatureUnit":"C",          // Optional - F for Fahrenheit, C for Celsius, C is the default
//              "setPointRef":167,              // Required - HomeSeer device reference for your thermostat Set Point.
//              "setPointReadOnly":true,        // Optional - Set to false if your SetPoint is read/write. true is the default
//              "stateRef":166,                 // Required - HomeSeer device reference for your thermostat current state
//              "stateOffValues":[0,4,5],       // Required - List of the HomeSeer device values for a HomeKit state=OFF
//              "stateHeatValues":[1],          // Required - List of the HomeSeer device values for a HomeKit state=HEAT
//              "stateCoolValues":[2],          // Required - List of the HomeSeer device values for a HomeKit state=COOL
//              "stateAutoValues":[3],          // Required - List of the HomeSeer device values for a HomeKit state=AUTO
//              "controlRef":168,               // Required - HomeSeer device reference for your thermostat mode control (It can be the same as stateRef for some thermostats)
//              "controlOffValue":0,            // Required - HomeSeer device control value for OFF
//              "controlHeatValue":1,           // Required - HomeSeer device control value for HEAT
//              "controlCoolValue":2,           // Required - HomeSeer device control value for COOL
//              "controlAutoValue":3,           // Required - HomeSeer device control value for AUTO
//              "coolingThresholdRef":169,      // Optional - Not-implemented-yet - HomeSeer device reference for your thermostat cooling threshold
//              "heatingThresholdRef":170       // Optional - Not-implemented-yet - HomeSeer device reference for your thermostat heating threshold               
//            },
//            {
//              "ref":200,                      // Required - HomeSeer Device Reference of a garage door opener
//              "type":"GarageDoorOpener",      // Required for a Garage Door Opener
//              "name":"Garage Door",           // Optional - HomeSeer device name is the default
//              "stateRef":201,                 // Required - HomeSeer device reference for your garage door opener current state (can be the same as ref)
//              "stateOpenValues":[0],          // Required - List of the HomeSeer device values for a HomeKit state=OPEN
//              "stateClosedValues":[1],        // Required - List of the HomeSeer device values for a HomeKit state=CLOSED
//              "stateOpeningValues":[2],       // Optional - List of the HomeSeer device values for a HomeKit state=OPENING
//              "stateClosingValues":[3],       // Optional - List of the HomeSeer device values for a HomeKit state=CLOSING
//              "stateStoppedValues":[4],       // Optional - List of the HomeSeer device values for a HomeKit state=STOPPED
//              "controlRef":201,               // Required - HomeSeer device reference for your garage door opener control (can be the same as ref and stateRef)
//              "controlOpenValue":0,           // Required - HomeSeer device control value for OPEN
//              "controlCloseValue":1,          // Required - HomeSeer device control value for CLOSE
//              "obstructionRef":201,           // Optional - HomeSeer device reference for your garage door opener obstruction state (can be the same as ref)
//              "obstructionValues":[5],        // Optional - List of the HomeSeer device values for a HomeKit obstruction state=OBSTRUCTION
//              "lockRef":202,                  // Optional - HomeSeer device reference for your garage door lock (can be the same as ref)
//              "lockUnsecuredValues":[0],      // Optional - List of the HomeSeer device values for a HomeKit lock state=UNSECURED
//              "lockSecuredValues":[1],        // Optional - List of the HomeSeer device values for a HomeKit lock state=SECURED
//              "lockJammedValues":[2],         // Optional - List of the HomeSeer device values for a HomeKit lock state=JAMMED
//              "unlockValue":0,                // Optional - HomeSeer device control value to unlock the garage door opener
//              "lockValue":1                   // Optional - HomeSeer device control value to lock the garage door opener
//            },
//            {
//              "ref":210,                      // Required - HomeSeer Device Reference of a Lock
//              "type":"Lock",                  // Required for a Lock
//              "name":"Main Door Lock",        // Optional - HomeSeer device name is the default
//              "lockUnsecuredValues":[0],      // Required - List of the HomeSeer device values for a HomeKit lock state=UNSECURED
//              "lockSecuredValues":[1],        // Required - List of the HomeSeer device values for a HomeKit lock state=SECURED
//              "lockJammedValues":[2],         // Optional - List of the HomeSeer device values for a HomeKit lock state=JAMMED
//              "unlockValue":0,                // Required - HomeSeer device control value to unlock
//              "lockValue":1                   // Required - HomeSeer device control value to lock
//              "batteryRef":209,               // Optional - HomeSeer device reference for the lock battery 
//              "batteryThreshold":35,          // Optional - If lock battery level is below this value, the HomeKit LowBattery characteristic is set to 1.
//            },
//            {
//              "ref":230,                      // Required - HomeSeer Device Reference of a Security System
//              "type":"SecuritySystem",        // Required for a security system
//              "name":"Home alarm",            // Optional - HomeSeer device name is the default
//              "armedStayValues":[0],          // Optional - List of the HomeSeer device values for a HomeKit security state=ARMED-STAY
//              "armedAwayValues":[1],          // Optional - List of the HomeSeer device values for a HomeKit security state=ARMED-AWAY
//              "armedNightValues":[2],         // Optional - List of the HomeSeer device values for a HomeKit security state=ARMED-NIGHT
//              "disarmedValues":[3],           // Optional - List of the HomeSeer device values for a HomeKit security state=DISARMED
//              "alarmValues":[4],              // Optional - List of the HomeSeer device values for a HomeKit security state=ALARM
//              "armStayValue":0,               // Required - HomeSeer device control value to arm in stay mode. If you don't have this mode, select any value that arms your system
//              "armAwayValue":1,               // Required - HomeSeer device control value to arm in away mode. If you don't have this mode, select any value that arms your system
//              "armNightValue":2,              // Required - HomeSeer device control value to arm in night mode. If you don't have this mode, select any value that arms your system
//              "disarmValue":3                 // Required - HomeSeer device control value to disarm security system
//            },
//            {
//              "ref":115,                      // Required - HomeSeer Device Reference for a device holding battery level (0-100)
//              "type":"Battery",               // Required for a Battery
//              "name":"Roomba battery",        // Optional - HomeSeer device name is the default
//              "batteryThreshold":15           // Optional - If the level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//            },
//            {
//              "ref":240,                      // Required - HomeSeer Device Reference for a door - HomeSeer values must go from 0 (closed) to 100 (open)
//              "type":"Door",                  // Required for a Door
//              "name":"Main door",             // Optional - HomeSeer device name is the default
//              "obstructionRef":241,           // Optional - HomeSeer device reference for your door obstruction state (can be the same as ref)
//              "obstructionValues":[1]         // Optional - List of the HomeSeer device values for a HomeKit obstruction state=OBSTRUCTION
//            }
//         ]
//     }
// ],
//
//
// SUPORTED TYPES:
// - Lightbulb              (can_dim, onValue, offValue options)
// - Fan                    (onValue, offValue options)
// - Switch                 (onValue, offValue options)
// - Outlet                 (onValue, offValue options)
// - Thermostat             (temperatureUnit, setPoint, state, control options)
// - TemperatureSensor      (temperatureUnit=C|F)
// - HumiditySensor         (HomeSeer device value in %  - batteryRef, batteryThreshold options)
// - LightSensor            (HomeSeer device value in Lux  - batteryRef, batteryThreshold options)
// - ContactSensor          (onValues, batteryRef, batteryThreshold options)
// - MotionSensor           (onValues, batteryRef, batteryThreshold options)
// - LeakSensor             (onValues, batteryRef, batteryThreshold options)
// - OccupancySensor        (onValues, batteryRef, batteryThreshold options)
// - SmokeSensor            (onValues, batteryRef, batteryThreshold options)
// - CarbonMonoxideSensor   (onValues, batteryRef, batteryThreshold options)
// - CarbonDioxideSensor    (onValues, batteryRef, batteryThreshold options)
// - Battery                (batteryThreshold option)
// - GarageDoorOpener       (state, control, obstruction, lock options)
// - Lock                   (unsecured, secured, jammed options)
// - SecuritySystem         (arm, disarm options)
// - Door                   (obstruction option)
// - Window                 (obstruction option)
// - WindowCovering         (obstruction option)

//var Service = require("../api").homebridge.hap.Service;
//var Characteristic = require("../api").homebridge.hap.Characteristic;
var request = require("request");
var pollingtoevent = require("polling-to-event")

var http = require('http');
var Accessory, Service, Characteristic, UUIDGen;

var pollingOffsetCounter=0;

var _services = [];
var _allAccessories = [];
var _globalHSRefs = [];
	_globalHSRefs.pushUnique = function(item) { if (this.indexOf(item) == -1) this.push(item); }
var _priorHSDeviceStatus = [];
var _currentHSDeviceStatus = [];
var _allStatusUrl = [];
var _HSValues = [];

module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-HomeSeerPlatform", "HomeSeer", HomeSeerPlatform, true);
}


function httpRequest(url, method, callback) {
    request({
        url: url,
        method: method
    },
        function (error, response, body) {
            callback(error, response, body)
        })
}

function getHSValue(ref) {
	return _HSValues[ref];
}

function HomeSeerPlatform(log, config, api) {
    this.log = log;
    this.config = config;

    if(config)
		if (this.config["poll"]==null)
		{
        this.config["poll"] = 60;
		this.config["platformPoll"] = 60;
		}
		else
		{
			this.config.platformPoll = this.config.poll;
		}

    if(config)
        this.log("System default periodic polling rate set to " + this.config.platformPoll + ' seconds');
}

HomeSeerPlatform.prototype = {
    accessories: function (callback) {
        var that = this;

		
        var foundAccessories = [];

        if (this.config.events) {
            this.log("Creating HomeSeer events.");
            for (var i = 0; i < this.config.events.length; i++) {
                var event = new HomeSeerEvent(that.log, that.config, that.config.events[i]);
                foundAccessories.push(event);
            }
        }

        this.log("Fetching HomeSeer devices.");
        var refList = "";
        for (var i = 0; i < this.config.accessories.length; i++) {
            refList = refList + this.config.accessories[i].ref;
			
			//Gather all HS References For New Polling Method to poll all devices at once	
			_globalHSRefs.pushUnique(this.config.accessories[i].ref);
			if(this.config.accessories[i].batteryRef) _globalHSRefs.pushUnique(this.config.accessories[i].batteryRef);
		
            if (i < this.config.accessories.length - 1)
                refList = refList + ",";
        }
		
		//For New Polling Method to poll all devices at once
		_globalHSRefs.sort();
		_allStatusUrl = this.config["host"] + "/JSON?request=getstatus&ref=" + _globalHSRefs.concat();
		
		this.log("Global Status URL is " + _allStatusUrl);
		
        var url = this.config["host"] + "/JSON?request=getstatus&ref=" + refList;
        httpRequest(url, "GET", function (error, response, body) {
            if (error) {
                this.log('HomeSeer status function failed: %s', error.message);
                callback(foundAccessories);
            } //endif
            else {
                this.log('HomeSeer status function succeeded!');
                var response = JSON.parse(body);
                for (var i = 0; i < this.config.accessories.length; i++) {
                    for (var j = 0; j < response.Devices.length; j++) {
						// Set up initial array of HS Response Values during startup
						_HSValues[response.Devices[j].ref] = response.Devices[j].value;
                        if (this.config.accessories[i].ref == response.Devices[j].ref) {
                            var accessory = new HomeSeerAccessory(that.log, that.config, this.config.accessories[i], response.Devices[j]);
                            foundAccessories.push(accessory);
                            break;
                        } //endfor
                    }
                } //end else.
		    
// This is the new Polling Mechanism to poll all at once.		
			this.accessoriesUpdate = pollingtoevent(
				function (done) {
					this.log ("************************");
					// Now do the poll
							httpRequest(_allStatusUrl, 'GET', function (error, response, body) {
							if (error) {
								this.log("** Warning ** - Polling HomeSeer Failed");
								callback(error, 0);
							}
							else {
								this.log (body.substring(1, 150));
								_priorHSDeviceStatus = _currentHSDeviceStatus;
								_currentHSDeviceStatus = JSON.parse(body).Devices;
								if (_priorHSDeviceStatus == _currentHSDeviceStatus) this.log("HS Devices Unchanged");
								this.log("Number of devices retrieved in poll is " + _currentHSDeviceStatus.length);
							}
							}.bind(this)); // end of the HTTP Request
					done(null, _currentHSDeviceStatus);
					}.bind(this), {interval: this.config.platformPoll * 1000 }
					);	//end polling-to-event function
			

			this.accessoriesUpdate.on("poll",
				function(HSDevices) { 

				// Now Create an array where the HomeSeer Value is tied to the array index location. e.g., ref 101's value is at location 101.
					for (var index in HSDevices)
					{
					// Update List of all HS Values
						_HSValues[HSDevices[index].ref] = HSDevices[index].value;
					} //endfor
				
					// Then scan each device characteristic and update it.
					updateCharacteristicsFromHSData();
				} // end function HSDevices
			);
			
			callback(foundAccessories);
            }
        }.bind(this));

    }
}

function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
    this.log = log;
    this.config = accessoryConfig;
    this.ref = status.ref;
    this.name = status.name
    this.model = status.device_type_string;
    this.onValue = 100;
    this.offValue = 0;

    this.statusCharacteristic = null;

    this.access_url = platformConfig["host"] + "/JSON?";
    this.control_url = this.access_url + "request=controldevicebyvalue&ref=" + this.ref + "&value=";
    this.status_url = this.access_url + "request=getstatus&ref=" + this.ref;

    if (this.config.name)
        this.name = this.config.name;

    if (this.config.uuid_base)
        this.uuid_base = this.config.uuid_base;

    if (this.config.onValue)
        this.onValue = this.config.onValue;

    if (this.config.offValue)
        this.offValue = this.config.offValue;

    var that = this;

    if (this.config.poll==null)
    {
        //Default to 1 minute polling cycle
        this.config.poll = platformConfig["poll"];
    }
}

HomeSeerAccessory.prototype = {

    identify: function (callback) {
        callback();
    },

    updateStatus: function (callback) {
        if (this.statusCharacteristic != null) {
			this.log("statusCharacteristic " + this.statusCharacteristic.displayName + " updated from " + this.statusCharacteristic.value);
            this.statusCharacteristic.getValue();
			this.log("   To New Value: " + this.statusCharacteristic.value);

        }

        if (callback != null)
            callback();
    },

    updateStatusByPolling: function () {
        this.statusUpdateCount++;

        if(this.statusUpdateCount <= this.config.statusUpdateCount)
        {
            this.updateStatus(null);
        }
        else
        {
            this.log(this.name + ": Completed polling for status update");
            this.pollForStatusUpdate.pause();
        }
    },

    pollForUpdate: function () {
        this.log(this.name + ": Polling for status update " + this.config.statusUpdateCount + " times");
        this.statusUpdateCount=0;
        // this.pollForStatusUpdate.resume();
    },

    setPowerState: function (powerOn, callback) {
        var url;

        if (powerOn) {
            url = this.control_url + this.onValue;
            this.log(this.name + ": Setting power state to on");
        }
        else {
            url = this.control_url + this.offValue;
            this.log(this.name + ": Setting power state to off");
        }

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': HomeSeer power function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': HomeSeer power function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        // this.pollForUpdate();
    },

    getPowerState: function (callback) {
            if (!this.ref) {
                this.log(this.name + ': getPowerState function failed: undefined HS Reference');
                callback(error, 0);
            }
            else {
				var value = getHSValue(this.ref);
                this.log(this.name + ': getPowerState function succeeded: value=' + value );
                if (value == 0)
                    callback(null, 0);
                else
                    callback(null, 1);
            }
    },

    getBinarySensorState: function (callback) {
		
			if (!this.ref) {
                this.log(this.name + ': getPowerState function failed: undefined HS Reference');
                callback(error, 0);
            } // end if
            else {
				var value = getHSValue(this.ref);
                this.log(this.name + ': getBinarySensorState function succeeded: value=' + value);
				
                if (this.config.onValues) {
                    if (this.config.onValues.indexOf(value) != -1)
                        callback(null, 1);
                    else
                        callback(null, 0);
                } //end inner if
                else {
                    if (value != 0)
                        callback(null, 1);
                    else
                        callback(null, 0);
                } //end inner else
					
            } // end else
    },

    setBrightness: function (level, callback) {
        
	// Brightness value of 100 is not allowed in Z-Wave, Z-wave permits 1-99 and 255 is allowed as on-last-level
	if (level > 99) level = 99;
	    
	    var url = this.control_url + level;

        this.log(this.name + ": Setting value to %s", level);

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setBrightness function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setBrightness function succeeded!');
                callback();
            }
        }.bind(this));
    },

    getValue: function (callback) {
        var url = this.status_url;
	
		if(this.ref) 
			callback(null, getHSValue(this.ref))
		else {
			this.log("getValue failed - HS Reference not defined for object");
			callback(error, -1);
		}	
    },


    setRotationSpeed: function (rotationSpeed, callback) {
        var url = this.control_url + rotationSpeed;
        
        this.log(this.name + ": Setting rotation speed to %s", rotationSpeed);

        var that=this;
        // Assume this delay is used to counter the HomeKit sending a full ON before the speed?
        setTimeout(function() {

            httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setRotationSpeed function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setRotationSpeed function succeeded!');
                callback();
            }
            }.bind(this));

        //Poll for updated status
        // this.pollForUpdate();
            
        }.bind(this), 300);

        
    },

    setTemperature: function (temperature, callback) {
        this.log(this.name + ": Setting temperature to %s", temperature);
        if (this.config.temperatureUnit == "F") {
            temperature = temperature * 9 / 5 + 32;
        }

        var url = this.control_url + temperature;
        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setTemperature function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setTemperature function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        // this.pollForUpdate();
    },

    getTemperature: function (callback) {
        var url = this.status_url;

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': getTemperature function failed: %s', error.message);
                callback(error, 0);
            }
            else {
                var status = JSON.parse(body);
                var value = status.Devices[0].value;

                this.log(this.name + ': getTemperature function succeeded: value=' + value);
                if (this.config.temperatureUnit == "F") {
                    value = (value - 32) * 5 / 9;
                }
                callback(null, value);
            }
        }.bind(this));
    },

    getThermostatCurrentHeatingCoolingState: function (callback) {
        var ref = this.config.stateRef;
        var url = this.access_url + "request=getstatus&ref=" + ref;

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': getThermostatCurrentHeatingCoolingState function failed: %s', error.message);
                callback(error, 0);
            }
            else {
                var status = JSON.parse(body);
                var value = status.Devices[0].value;

                this.log(this.name + ': getThermostatCurrentHeatingCoolingState function succeeded: value=' + value);
                if (this.config.stateOffValues.indexOf(value) != -1)
                    callback(null, 0);
                else if (this.config.stateHeatValues.indexOf(value) != -1)
                    callback(null, 1);
                else if (this.config.stateCoolValues.indexOf(value) != -1)
                    callback(null, 2);
                else if (this.config.stateAutoValues.indexOf(value) != -1)
                    callback(null, 3);
                else {
                    this.log(this.name + ': Error: value for thermostat current heating cooling state not in offValues, heatValues, coolValues or autoValues');
                    callback(null, 0);
                }
            }
        }.bind(this));
    },

    setThermostatCurrentHeatingCoolingState: function (state, callback) {
        this.log(this.name + ': Setting thermostat current heating cooling state to %s', state);

        var ref = this.config.controlRef;
        var value = 0;
        if (state == 0)
            value = this.config.controlOffValue;
        else if (state == 1)
            value = this.config.controlHeatValue;
        else if (state == 2)
            value = this.config.controlCoolValue;
        else if (state == 3)
            value = this.config.controlAutoValue;

        var url = this.access_url + "request=controldevicebyvalue&ref=" + ref + "&value=" + value;
        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setThermostatCurrentHeatingCoolingState function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setThermostatCurrentHeatingCoolingState function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        this.pollForUpdate();
    },

    getThermostatTargetTemperature: function (callback) {
        var ref = this.config.setPointRef;
        var url = this.access_url + "request=getstatus&ref=" + ref;

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': getThermostatTargetTemperature function failed: %s', error.message);
                callback(error, 0);
            }
            else {
                var status = JSON.parse(body);
                var value = status.Devices[0].value;

                this.log(this.name + ': getThermostatTargetTemperature function succeeded: value=' + value);
                if (this.config.temperatureUnit == "F") {
                    value = (value - 32) * 5 / 9;
                }
                callback(null, value);
            }
        }.bind(this));
    },

    setThermostatTargetTemperature: function (temperature, callback) {
        this.log(this.name + ': Setting thermostat target temperature to %s', temperature);
        if (this.config.temperatureUnit == "F") {
            temperature = temperature * 9 / 5 + 32;
        }

        var ref = this.config.setPointRef;
        var url = this.access_url + "request=controldevicebyvalue&ref=" + ref + "&value=" + temperature;
        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setThermostatTargetTemperature function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setThermostatTargetTemperature function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        this.pollForUpdate();
    },

    getThermostatTemperatureDisplayUnits: function (callback) {
        if (this.config.temperatureUnit == "F")
            callback(null, 1);
        else
            callback(null, 0);
    },

// getBatteryValue added to support reading of the Battery Level for locks using the batteryRef reference.
    getBatteryValue: function (callback) {
			callback(null, getHSValue(this.config.batteryRef));
	 },
	

    getLowBatteryStatus: function (callback) {
		var minValue = 20;
		
        if (this.config.batteryThreshold) minValue = this.config.batteryThreshold;

        if (getHSValue(this.config.batteryRef)  > minValue)
				{ callback(null, 0); }
            else
				{ callback(null, 1); }
			
    }, // end function

    getCurrentDoorState: function (callback) {
        var ref = this.config.stateRef;
        var url = this.access_url + "request=getstatus&ref=" + ref;

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': getCurrentDoorState function failed: %s', error.message);
                callback(error, 0);
            }
            else {
                var status = JSON.parse(body);
                var value = status.Devices[0].value;

                this.log(this.name + ': getCurrentDoorState function succeeded: value=' + value);
                if (this.config.stateOpenValues.indexOf(value) != -1)
                    callback(null, Characteristic.CurrentDoorState.OPEN);
                else if (this.config.stateClosedValues.indexOf(value) != -1)
                    callback(null, Characteristic.CurrentDoorState.CLOSED);
                else if (this.config.stateOpeningValues && this.config.stateOpeningValues.indexOf(value) != -1)
                    callback(null, 2);
                else if (this.config.stateClosingValues && this.config.stateClosingValues.indexOf(value) != -1)
                    callback(null, 3);
                else if (this.config.stateStoppedValues && this.config.stateStoppedValues.indexOf(value) != -1)
                    callback(null, 4);
                else {
                    this.log(this.name + ': Error: value for current door state not in stateO0penValues, stateClosedValues, stateOpeningValues, stateClosingValues, stateStoppedValues');
                    callback(null, 0);
                }
            }
        }.bind(this));
    },

    setTargetDoorState: function (state, callback) {
        this.log(this.name + ': Setting target door state state to %s', state);

        var ref = this.config.controlRef;
        var value = 0;
        if (state == 0)
            value = this.config.controlOpenValue;
        else if (state == 1)
            value = this.config.controlCloseValue;

        var url = this.access_url + "request=controldevicebyvalue&ref=" + ref + "&value=" + value;
        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setTargetDoorState function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setTargetDoorState function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        this.pollForUpdate();
    },

    getObstructionDetected: function (callback) {
        if (this.config.obstructionRef) {
            var ref = this.config.obstructionRef;
            var url = this.access_url + "request=getstatus&ref=" + ref;

            httpRequest(url, 'GET', function (error, response, body) {
                if (error) {
                    this.log(this.name + ': getObstructionDetected function failed: %s', error.message);
                    callback(error, 0);
                }
                else {
                    var status = JSON.parse(body);
                    var value = status.Devices[0].value;

                    this.log(this.name + ': getObstructionDetected function succeeded: value=' + value);
                    if (this.config.obstructionValues && this.config.obstructionValues.indexOf(value) != -1)
                        callback(null, 1);
                    else {
                        callback(null, 0);
                    }
                }
            }.bind(this));
        }
        else {
            callback(null, 0);
        }
    },

    getLockCurrentState: function (callback) {
        var ref = this.config.lockRef;
        var url = this.access_url + "request=getstatus&ref=" + ref;

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': getLockCurrentState function failed: %s', error.message);
                callback(error, 3);
            }
            else {
                var status = JSON.parse(body);
                var value = status.Devices[0].value;

                this.log(this.name + ': getLockCurrentState function succeeded: value=' + value);
                if (this.config.lockUnsecuredValues && this.config.lockUnsecuredValues.indexOf(value) != -1)
                    callback(null, 0);
                else if (this.config.lockSecuredValues && this.config.lockSecuredValues.indexOf(value) != -1)
                    callback(null, 1);
                else if (this.config.lockJammedValues && this.config.lockJammedValues.indexOf(value) != -1)
                    callback(null, 2);
                else {
                    callback(null, 3);
                }
            }
        }.bind(this));
    },

    setLockTargetState: function (state, callback) {
        this.log(this.name + ': Setting target lock state to %s', state);

        var ref = this.config.lockRef;
        var value = 0;
        if (state == 0 && this.config.unlockValue)
            value = this.config.unlockValue;
        else if (state == 1 && this.config.lockValue)
            value = this.config.lockValue;

        var url = this.access_url + "request=controldevicebyvalue&ref=" + ref + "&value=" + value;
        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setLockTargetState function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setLockTargetState function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        this.pollForUpdate();
    },

    getSecuritySystemCurrentState: function (callback) {
        var url = this.access_url + "request=getstatus&ref=" + this.ref;

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': getSecuritySystemCurrentState function failed: %s', error.message);
                callback(error, 3);
            }
            else {
                var status = JSON.parse(body);
                var value = status.Devices[0].value;

                this.log(this.name + ': getSecuritySystemCurrentState function succeeded: value=' + value);
                if (this.config.armedStayValues && this.config.armedStayValues.indexOf(value) != -1)
                    callback(null, 0);
                else if (this.config.armedAwayValues && this.config.armedAwayValues.indexOf(value) != -1)
                    callback(null, 1);
                else if (this.config.armedNightValues && this.config.armedNightValues.indexOf(value) != -1)
                    callback(null, 2);
                else if (this.config.disarmedValues && this.config.disarmedValues.indexOf(value) != -1)
                    callback(null, 3);
                else if (this.config.alarmValues && this.config.alarmValues.indexOf(value) != -1)
                    callback(null, 4);
                else
                    callback(null, 0);
            }
        }.bind(this));
    },

    setSecuritySystemTargetState: function (state, callback) {
        this.log("Setting security system state to %s", state);

        var value = 0;
        if (state == 0 && this.config.armStayValue)
            value = this.config.armStayValue;
        else if (state == 1 && this.config.armAwayValue)
            value = this.config.armAwayValue;
        else if (state == 2 && this.config.armNightValue)
            value = this.config.armNightValue;
        else if (state == 3 && this.config.disarmValue)
            value = this.config.disarmValue;

        var url = this.access_url + "request=controldevicebyvalue&ref=" + this.ref + "&value=" + value;
        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': setSecuritySystemTargetState function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': setSecuritySystemTargetState function succeeded!');
                callback();
            }
        }.bind(this));

        //Poll for updated status
        this.pollForUpdate();
    },

    getPositionState: function (callback) {
        callback(null, 2);  // Temporarily return STOPPED. TODO: full door support
    },

    getServices: function () {
        var services = []

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, "HS " + this.config.type + " ref " + this.ref);
        services.push(informationService);


        switch (this.config.type) {

            case "Fan": {
                var fanService = new Service.Fan
				fanService.isPrimaryService = true;
				
				fanService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;				
                fanService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this));

                if (this.config.can_dim) {
                    fanService
                        .addCharacteristic(new Characteristic.RotationSpeed())
						.HSRef = this.config.ref;
						
					fanService
						.getCharacteristic(Characteristic.RotationSpeed)
						.on('set', this.setRotationSpeed.bind(this))
                        .on('get', this.getValue.bind(this));
                }

                this.statusCharacteristic = fanService.getCharacteristic(Characteristic.On);
                services.push(fanService);
                break;
            }
            case "Switch": {
                var switchService = new Service.Switch();
				switchService.isPrimaryService = true;
				
				switchService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
					
                switchService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this));

                this.statusCharacteristic = switchService.getCharacteristic(Characteristic.On);
                services.push(switchService);
                break;
            }
            case "Outlet": {
                var outletService = new Service.Outlet();
				outletService.isPrimaryService = true;
				
				outletService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
				
                outletService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this));

                this.statusCharacteristic = outletService.getCharacteristic(Characteristic.On);
                services.push(outletService);
                break;
            }
            case "TemperatureSensor": {
                var temperatureSensorService = new Service.TemperatureSensor();
				temperatureSensorService.isPrimaryService = true;

                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature)
					.HSRef = this.config.ref;
				
                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature)
                    .on('get', this.getTemperature.bind(this));
				
                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature).setProps({ minValue: -100 });

                services.push(temperatureSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "CarbonMonoxideSensor": {
                var carbonMonoxideSensorService = new Service.CarbonMonoxideSensor();
                carbonMonoxideSensorService.isPrimaryService = true;
				
                carbonMonoxideSensorService
                    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
                    .on('get', this.getBinarySensorState.bind(this))
					.HSRef = this.config.ref;

                services.push(carbonMonoxideSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "CarbonDioxideSensor": {
                var carbonDioxideSensorService = new Service.CarbonDioxideSensor();
				carbonDioxideSensorService.isPrimaryService = true;
				
                carbonDioxideSensorService
                    .getCharacteristic(Characteristic.CarbonDioxideDetected)
                    .on('get', this.getBinarySensorState.bind(this))
                    .HSRef = this.config.ref;

                services.push(carbonDioxideSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "ContactSensor": {
                var contactSensorService = new Service.ContactSensor();
                contactSensorService.isPrimaryService = true;
				
				contactSensorService
                    .getCharacteristic(Characteristic.ContactSensorState)
                    .on('get', this.getBinarySensorState.bind(this))
                    .HSRef = this.config.ref;

                services.push(contactSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }

                break;
            }
            case "MotionSensor": {
                var motionSensorService = new Service.MotionSensor();
                motionSensorService.isPrimaryService = true;
                motionSensorService.HSRef = this.config.ref;
				
                motionSensorService
                    .getCharacteristic(Characteristic.MotionDetected)
                    .on('get', this.getBinarySensorState.bind(this));

                services.push(motionSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "LeakSensor": {
                var leakSensorService = new Service.LeakSensor();
                leakSensorService
                    .getCharacteristic(Characteristic.LeakDetected)
                    .on('get', this.getBinarySensorState.bind(this))
                    .isPrimaryService = true;

                services.push(leakSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "OccupancySensor": {
                var occupancySensorService = new Service.OccupancySensor();
                occupancySensorService
                    .getCharacteristic(Characteristic.OccupancyDetected)
                    .on('get', this.getBinarySensorState.bind(this))
                    .isPrimaryService = true;

                services.push(occupancySensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "SmokeSensor": {
                var smokeSensorService = new Service.SmokeSensor();
                smokeSensorService
                    .getCharacteristic(Characteristic.SmokeDetected)
                    .on('get', this.getBinarySensorState.bind(this))
                    .isPrimaryService = true;

                services.push(smokeSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "LightSensor": {
                var lightSensorService = new Service.LightSensor();
                lightSensorService
                    .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
                    .on('get', this.getValue.bind(this))
                    .isPrimaryService = true;

                services.push(lightSensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "HumiditySensor": {
                var humiditySensorService = new Service.HumiditySensor();
                humiditySensorService
                    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
                    .on('get', this.getValue.bind(this))
                    .isPrimaryService = true;

                services.push(humiditySensorService);

                // If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
                break;
            }
            case "Door": {
                var doorService = new Service.Door();
                doorService
                    .getCharacteristic(Characteristic.CurrentPosition)
                    .on('get', this.getValue.bind(this))
					.HSRef = this.config.ref;
                doorService
                    .getCharacteristic(Characteristic.TargetPosition)
                    .on('set', this.setBrightness.bind(this))
					.HSRef = this.config.ref;
                doorService
                    .getCharacteristic(Characteristic.PositionState)
                    .on('get', this.getPositionState.bind(this));
                if (this.config.obstructionRef) {
                    doorService
                        .addCharacteristic(new Characteristic.ObstructionDetected())
                        .on('get', this.getObstructionDetected.bind(this));
                }
             

                this.statusCharacteristic = doorService.getCharacteristic(Characteristic.CurrentPosition);
                services.push(doorService);
                break;
            }
            case "Window": {
                var windowService = new Service.Window();
                windowService
                    .getCharacteristic(Characteristic.CurrentPosition)
                    .on('get', this.getValue.bind(this));
                windowService
                    .getCharacteristic(Characteristic.TargetPosition)
                    .on('set', this.setBrightness.bind(this));
                windowService
                    .getCharacteristic(Characteristic.PositionState)
                    .on('get', this.getPositionState.bind(this));
                if (this.config.obstructionRef) {
                    windowService
                        .addCharacteristic(new Characteristic.ObstructionDetected())
                        .on('get', this.getObstructionDetected.bind(this));
                }

                this.statusCharacteristic = windowService.getCharacteristic(Characteristic.CurrentPosition);
                services.push(windowService);
                break;
            }
            case "WindowCovering": {
                var windowCoveringService = new Service.WindowCovering();
                windowCoveringService
                    .getCharacteristic(Characteristic.CurrentPosition)
                    .on('get', this.getValue.bind(this));
                windowCoveringService
                    .getCharacteristic(Characteristic.TargetPosition)
                    .on('set', this.setBrightness.bind(this));
                windowCoveringService
                    .getCharacteristic(Characteristic.PositionState)
                    .on('get', this.getPositionState.bind(this));

                
                if (this.config.obstructionRef) {
                    windowCoveringService
                        .addCharacteristic(new Characteristic.ObstructionDetected())
                        .on('get', this.getObstructionDetected.bind(this));
                }

                this.statusCharacteristic = windowCoveringService.getCharacteristic(Characteristic.CurrentPosition);
                services.push(windowCoveringService);

                break;
            }
            case "Battery": {
                var batteryService = new Service.BatteryService();
				batteryService.isPrimaryService = true;
				
                this.config.batteryRef = this.ref;
	
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
                        .on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));

                services.push(batteryService);
		break;
            }
            case "Thermostat": {
                var thermostatService = new Service.Thermostat();
				thermostatService.isPrimaryService = true;
				
                thermostatService
                    .getCharacteristic(Characteristic.CurrentTemperature)
                    .on('get', this.getTemperature.bind(this));
                thermostatService
                    .getCharacteristic(Characteristic.TargetTemperature)
                    .on('get', this.getThermostatTargetTemperature.bind(this));
                if (this.config.setPointReadOnly === null || this.config.setPointReadOnly === false)
                    thermostatService
                        .getCharacteristic(Characteristic.TargetTemperature)
                        .on('set', this.setThermostatTargetTemperature.bind(this));
                thermostatService
                    .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                    .on('get', this.getThermostatCurrentHeatingCoolingState.bind(this));
                thermostatService
                    .getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .on('get', this.getThermostatCurrentHeatingCoolingState.bind(this));
                thermostatService
                    .getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .on('set', this.setThermostatCurrentHeatingCoolingState.bind(this));
                thermostatService
                    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
                    .on('get', this.getThermostatTemperatureDisplayUnits.bind(this));

                services.push(thermostatService);
                break;
            }
            case "GarageDoorOpener": {
                //Better default
                if (this.config.statusUpdateCount == null)
                    this.config.statusUpdateCount = 40;

                var garageDoorOpenerService = new Service.GarageDoorOpener();
				garageDoorOpenerService.isPrimaryService = true;
				
                garageDoorOpenerService
                    .getCharacteristic(Characteristic.CurrentDoorState)
                    .on('get', this.getCurrentDoorState.bind(this));
                garageDoorOpenerService
                    .getCharacteristic(Characteristic.TargetDoorState)
                    .on('set', this.setTargetDoorState.bind(this));
                garageDoorOpenerService
                    .getCharacteristic(Characteristic.TargetDoorState)
                    .on('get', this.getCurrentDoorState.bind(this));
                garageDoorOpenerService
                    .getCharacteristic(Characteristic.ObstructionDetected)
                    .on('get', this.getObstructionDetected.bind(this));
                if (this.config.lockRef) {
                    garageDoorOpenerService
                        .addCharacteristic(new Characteristic.LockCurrentState())
                        .on('get', this.getLockCurrentState.bind(this));
                    garageDoorOpenerService
                        .addCharacteristic(new Characteristic.LockTargetState())
                        .on('set', this.setLockTargetState.bind(this));
                }
                services.push(garageDoorOpenerService);

                this.statusCharacteristic = garageDoorOpenerService.getCharacteristic(Characteristic.CurrentDoorState);

                break;
            }
            case "Lock": {
                this.config.lockRef = this.ref;
                var lockService = new Service.LockMechanism();
				lockService.isPrimaryService = true;
				
                lockService
                    .getCharacteristic(Characteristic.LockCurrentState)
                    .on('get', this.getLockCurrentState.bind(this));
                lockService
                    .getCharacteristic(Characteristic.LockTargetState)
                    .on('get', this.getLockCurrentState.bind(this));
                lockService
                    .getCharacteristic(Characteristic.LockTargetState)
                    .on('set', this.setLockTargetState.bind(this));
		    
				lockService.isPrimaryService = true;
		    
		services.push(lockService);
		this.statusCharacteristic = lockService.getCharacteristic(Characteristic.LockCurrentState);

		// If batteryRef has been defined, then add a battery service.
                if (this.config.batteryRef) {
                    this.log("Adding a Battery Service to " + this.name);

                    var batteryService = new Service.BatteryService();
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
                    batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.on('get', this.getBatteryValue.bind(this));
                    batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
                        .on('get', this.getLowBatteryStatus.bind(this));
                    services.push(batteryService);
                }
		    			
                break;
            }
            case "SecuritySystem": {

                //Better default
                if (this.config.statusUpdateCount == null)
                    this.config.statusUpdateCount = 75;

                var securitySystemService = new Service.SecuritySystem();
				securitySystemService.isPrimaryService = true;
				
                securitySystemService
                    .getCharacteristic(Characteristic.SecuritySystemCurrentState)
                    .on('get', this.getSecuritySystemCurrentState.bind(this));
                securitySystemService
                    .getCharacteristic(Characteristic.SecuritySystemTargetState)
                    .on('get', this.getSecuritySystemCurrentState.bind(this));
                securitySystemService
                    .getCharacteristic(Characteristic.SecuritySystemTargetState)
                    .on('set', this.setSecuritySystemTargetState.bind(this));
                services.push(securitySystemService);

                this.statusCharacteristic = securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState);

                break;
            }
            case "Lightbulb": 
			default: {

                //Better default
                if (this.config.statusUpdateCount == null)
                    this.config.statusUpdateCount = 5;

                var lightbulbService = new Service.Lightbulb();
				lightbulbService.isPrimaryService = true;
				
				lightbulbService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
				
                lightbulbService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this));
		    
                if (this.config.can_dim == null || this.config.can_dim == true) {
					
					this.onValue = 255; // Force to 255 for all Z-Wave dimmers, else the lights will flash while dimming
                    lightbulbService
                        .addCharacteristic(new Characteristic.Brightness())
						.HSRef = this.config.ref;
						
					lightbulbService
						.getCharacteristic(Characteristic.Brightness)
                        .on('set', this.setBrightness.bind(this))
                        .on('get', this.getValue.bind(this));
                }
				
				this.statusCharacteristic = lightbulbService.getCharacteristic(Characteristic.On);

                services.push(lightbulbService);

                break;
            }
        }

        if (this.config.statusUpdateCount == null)
           this.config.statusUpdateCount = 20;
        
        this.statusUpdateCount = this.config.statusUpdateCount-1;

        this.log(this.name + ": statusUpdateCount=" + this.config.statusUpdateCount);

        services[services.length - 1].accessory = this;
	    _allAccessories.push(this);

        //Update the global service list
        _services.push(services[services.length - 1]);

        return services;
    }
}

function HomeSeerEvent(log, platformConfig, eventConfig) {
    this.log = log;
    this.config = eventConfig;
    this.name = eventConfig.eventName
    this.model = "HomeSeer Event";

    this.access_url = platformConfig["host"] + "/JSON?";
    this.on_url = this.access_url + "request=runevent&group=" + encodeURIComponent(this.config.eventGroup) + "&name=" + encodeURIComponent(this.config.eventName);

    if (this.config.offEventGroup && this.config.offEventName) {
        this.off_url = this.access_url + "request=runevent&group=" + encodeURIComponent(this.config.offEventGroup) + "&name=" + encodeURIComponent(this.config.offEventName);
    }

    if (this.config.name)
        this.name = this.config.name;

    if (this.config.uuid_base)
        this.uuid_base = this.config.uuid_base;
}

HomeSeerEvent.prototype = {

    identify: function (callback) {
        callback();
    },

    launchEvent: function (value, callback) {
        this.log("Setting event value to %s", value);

        var url = this.on_url;
        if (value == 0 && this.off_url) {
            url = this.off_url;
        }

        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                this.log(this.name + ': launchEvent function failed: %s', error.message);
                callback(error);
            }
            else {
                this.log(this.name + ': launchEvent function succeeded!');
                callback();
            }

            if(this.off_url==null && value != 0)
            {
                setTimeout(function() {
                    this.log(this.name + ': Momentary switch reseting to 0');
                    this.switchService.getCharacteristic(Characteristic.On).setValue(0);
                }.bind(this),2000);
            }

        }.bind(this));
    },


    getServices: function () {
        var services = []

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, "HS Event " + this.config.eventGroup + " " + this.config.eventName);
        services.push(informationService);

        
        this.switchService = new Service.Switch();
        this.switchService
            .getCharacteristic(Characteristic.On)
            .on('set', this.launchEvent.bind(this));
        services.push(this.switchService);

        return services;
    }
}

function updateCharacteristicsFromHSData()
{
	var HSValue = 0;
	
	for (var i = 0, len = _services.length; i < len; i++) {

		for (var j in _services[i].characteristics) {
			//Only Update Characteristics if they have an associated HomeSeer Reference
			if (_services[i].characteristics[j].HSRef) 	{
				
				HSValue = getHSValue(_services[i].characteristics[j].HSRef)
				
				switch(_services[i].characteristics[j].displayName)
				{
				case("Battery Level"):
				{
				_services[i].characteristics[j].value = HSValue;
				break;
				}
				case("On"):
				{
				_services[i].characteristics[j].value = 
					( (HSValue != 0) ? true : false);
					break;
				}
				case ("Brightness"):
				{
				// Update - add code so if HS says 99 show on Homekit Interface as 100%
				_services[i].characteristics[j].value = ((HSValue == 99) ? 100 : HSValue);
					break;
				}
				// for any Binary Sensor
				case("Carbon Monoxide Detected"):
				case("Carbon Dioxide Detected"):
				case("Contact Sensor State"):
				case("Motion Detected"):
				case("Leak Detected"):
				case("Occupancy Detected"):
				case("Smoke Detected"):
				{
				// If a set of onValues is defined, then HS value must be one of them. Else just non-zero.
				if (_services[i].characteristics[j].onValues) 
						{_services[i].characteristics[j].value = 
						(_services[i].characteristics[j].onValues.indexOf(HSValue) != -1) ? true : false;
					else { _services[i].characteristics[j].value = ((HSValue > 0) ? true : false )} 	
						
				}
				default:
				{
				console.log("Unable to update value using global polling: Characteristic type not handled");
				break;
				}
				} // end switch
								
				console.log("Updated " + _services[i].accessory.name);
				console.log("     characteristic: " + _services[i].characteristics[j].displayName + " : With Value " + _services[i].characteristics[j].value + " for HS Reference " +  _services[i].characteristics[j].HSRef);
			} // endif
		} //end for j			
	} // end for i
}
					

module.exports.platform = HomeSeerPlatform;
