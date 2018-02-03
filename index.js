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


//var Service = require("../api").homebridge.hap.Service;
//var Characteristic = require("../api").homebridge.hap.Characteristic;
var request = require("request");
var pollingtoevent = require("polling-to-event")

var http = require('http');
var Accessory, Service, Characteristic, UUIDGen;

var pollingOffsetCounter=0;

var _allAccessories = [];
var _globalHSRefs = [];
	_globalHSRefs.pushUnique = function(item) { if (this.indexOf(item) == -1) this.push(item); }
var _priorHSDeviceStatus = [];
var _currentHSDeviceStatus = [];
var _allStatusUrl = [];
var _HSValues = [];

var updateEmitter;

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
            var foundAccessories = [];
				
			var that = this;

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
			updateEmitter = pollingtoevent(
				function (done) {
					that.log ("************************");
					// Now do the poll
							httpRequest(_allStatusUrl, 'GET', function (error, response, body) {
							if (error) {
								this.log("** Warning ** - Polling HomeSeer Failed");
								callback(error, 0);
							}
							else {

								_priorHSDeviceStatus = _currentHSDeviceStatus;
								_currentHSDeviceStatus = JSON.parse(body).Devices;
								if (_priorHSDeviceStatus == _currentHSDeviceStatus) this.log("HS Devices Unchanged");
								this.log("Device Data for %s HomeSeer devices retrieved from HomeSeer ",  _currentHSDeviceStatus.length);
							}
							}.bind(this)); // end of the HTTP Request
					done(null, _currentHSDeviceStatus);
					}.bind(this), {interval: this.config.platformPoll * 1000 }
					);	//end polling-to-event function
			

			updateEmitter.on("poll",
				function(HSDevices) { 
					that.log("----------- Debug: Entered function accessoriesUpdate.on -----------");
				// Now Create an array where the HomeSeer Value is tied to the array index location. e.g., ref 101's value is at location 101.
					for (var index in HSDevices)
					{
					// Update List of all HS Values
						_HSValues[HSDevices[index].ref] = HSDevices[index].value;
					} //endfor
				
					// Then scan each device characteristic and update it.
					// that.log("calling updateCharacteristicsFromHSData");
					// that.log("that.foundAccessories is defined? " + that.foundAccessories);
					updateCharacteristicsFromHSData(that);
				} // end function HSDevices
			);
			this.log("------------------ Debug ------------------");
			this.log(foundAccessories);
			this.log ("----------------------");
			
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

    var that = this; // May be unused?

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
	
	// setHSValue function expects to be bound by .bind() to a HomeKit Service Object Characteristic!
	setHSValue: function (level, callback) {
        var url;
		
			switch(this.props.format)
			{
				case("int"):
				{
					if ((this.props.unit == "percentage") && ( level == 100) ) // Z-Wave doesn't like 100%. Force to 99.
					{level =  99; 
					}
					// may want to force-modify the HS polled data to reflect new value up until the next poll!
					break;
				}
				case("float"):
				{
					// Double-Check on this to make sure that HomeSeer always reports in celsius!
					// if ((character.props.unit == "celsius") ) newValue = ((newValue -32) * (5 / 9));
					// character.updateValue( newValue);
					break;
				}
			}; //end switch
		
		 url = this.access_url + "request=controldevicebyvalue&ref=" + this.HSRef + "&value=" +level;
		 _HSValues[this.HSRef] = level; // force previously retrieved HomeSeer data to match the value being sent. This will be then re-polled next time.


        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                // console.log("This = : " + this);
				var propnames =Object.getOwnPropertyNames(this);
				console.log(propnames);
				// console.log(this.name + ': HomeSeer setHSValue function failed: %s', error.message);
                callback(error);
            }
            else {
                console.log(this.name + ': HomeSeer setHSValue function succeeded!');
                callback();
            }
        }.bind(this));
		updateEmitter.emit("poll");
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

    },

    getPositionState: function (callback) {
        callback(null, 2);  // Temporarily return STOPPED. TODO: full door support
    },

    getServices: function () {
		this.log("---------------getServices function called --------- Debug ----------------------------");
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
				temperatureSensorService.displayName = "Service.TemperatureSensor";

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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
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
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;						
						
                    services.push(batteryService);

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
				lockService.displayName = "Service.LockMechanism";
				
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
					batteryService.displayName = "Service.BatteryService";
					
					batteryService
                        .getCharacteristic(Characteristic.BatteryLevel)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.HSRef = this.config.batteryRef;
						
					batteryService
                        .getCharacteristic(Characteristic.StatusLowBattery)
						.batteryThreshold = this.config.batteryThreshold;
						
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
				lightbulbService.displayName = "Service.Lightbulb"
				
				lightbulbService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
				
                lightbulbService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this));
                    // .on('get', this.getPowerState.bind(this));
		    
                if (this.config.can_dim == null || this.config.can_dim == true) {
					
					this.onValue = 255; // Force to 255 for all Z-Wave dimmers, else the lights will flash while dimming
                    lightbulbService
                        .addCharacteristic(new Characteristic.Brightness())
						.HSRef = this.config.ref;
					
					lightbulbService
						.getCharacteristic(Characteristic.Brightness)
						.access_url = this.access_url;
						
					lightbulbService
						.getCharacteristic(Characteristic.Brightness)
                        .on('set', this.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.Brightness)));
                        // .on('get', this.getValue.bind(this));
                }
				
                services.push(lightbulbService);

                break;
            }
        }

        if (this.config.statusUpdateCount == null)
           this.config.statusUpdateCount = 20;
        
        this.statusUpdateCount = this.config.statusUpdateCount-1;

        this.log(this.name + ": statusUpdateCount=" + this.config.statusUpdateCount);

		_allAccessories.push(services);

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

function updateCharacteristicsFromHSData(that)
{
	var HSValue = 0;
	that.log("Updated Characteristics from HS Data");
	that.log("Found accessories defined: " + (_allAccessories && _allAccessories.length));

	for (var aIndex = 0; aIndex < _allAccessories.length; aIndex++)
	{
		var thisAccessory = _allAccessories[aIndex];
		for(var sIndex = 0; sIndex < thisAccessory.length; sIndex++)
		{
		var service = thisAccessory[sIndex];

			for(var cIndex = 0; cIndex < service.characteristics.length; cIndex++)
			{
				var character = service.characteristics[cIndex];
				if (character.HSRef)
				{
					
				var newValue = getHSValue(character.HSRef);

				that.log("Service %s: %s has updatable characteristic %s: %s and HS Ref: %s and old value %s", sIndex, service.displayName, cIndex, character.displayName, character.HSRef, character.value);
				// that.log(character.props);
				
				
				switch(character.props.format)
				{
					case("bool"):
					{
						character.updateValue( newValue ? true : false);
						break;
					}
					
					case("int"):
					{
						if ((character.props.unit == "percentage") && ( newValue == 99) ) newValue=100;
						character.updateValue(newValue);
						break;
					}
					case("float"):
					{
						// Double-Check on this to make sure that HomeSeer always reports in celsius!
						if ((character.props.unit == "celsius") ) newValue = ((newValue -32) * (5 / 9));
						character.updateValue( newValue);
						break;
					}
					case("uint8"):
					{
						if(character.displayName == "Status Low Battery")
						{
							that.log("Battery Threshold status of battery level %s with threshold %s", newValue, character.batteryThreshold);
							var lowBatteryStatus = (newValue < character.batteryThreshold) ? true : false;
							character.updateValue(lowBatteryStatus);
							break;
						}
						
					}
					default:
					{
						that.log("** WARNING ** -- Possible Incorrect Value Assignment for service %s, with characteristic %s", service.displayName, character.displayName);
						character.updateValue( newValue);
					}
				}; //end switch
				
				that.log("   %s value after update is: %s", character.displayName, character.value);
				
				}
			}
		}
	} 
}
					

module.exports.platform = HomeSeerPlatform;
