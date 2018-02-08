'use strict';

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



var request = require("request");

var promiseHTTP = require("request-promise-native");


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

var _accessURL;

var _statusObjects = []; // Holds things that can be changed when HomeSeer values change!

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
function setHSValue(ref, level)
{
		// This function is used to temporarily 'fake' a HomeSeer poll update.
		// Used when, e.g., you set a new value of an accessory in HomeKit - this provides a fast update to the
		// Retrieved HomeSeer device values which will then be "corrected / confirmed" on the next poll.
		_HSValues[ref] = level;
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

			updateEmitter = setInterval(
				function () 
					{
					// Now do the poll
						promiseHTTP(_allStatusUrl)
							.then( function(htmlString) 
									{
										_currentHSDeviceStatus = JSON.parse(htmlString).Devices;
										that.log("Polled HomeSeer, Retrieved %s values",  _currentHSDeviceStatus.length);
										for (var index in _currentHSDeviceStatus)
										{
											_HSValues[_currentHSDeviceStatus[index].ref] = _currentHSDeviceStatus[index].value;
										} //endfor

										updateAllFromHSData();
									
									}
								) // end then
								.catch(function(err)
									{
										that.log("HomeSeer poll attempt failed with error %s", err);
									}
								);//end catch

					}, this.config.platformPoll * 1000 
					);	//end polling loop
			
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
	_accessURL = this.access_url;
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

	// setHSValue function expects to be bound by .bind() to a HomeKit Service Object Characteristic!
	setHSValue: function (level, callback) {
		var url;
		var callbackValue = 1;
		var transmitValue = level;
		var noUpdate = false; // set to true if something determines that there should be no HomeSeer update.

		
		// For Debugging
		// console.log ("** Debug ** - Called setHSValue with level %s for UUID %s", level, this.UUID);
		// console.log ("** Debug ** access_url is %s", _accessURL);
		
		if (!this.UUID) {
			var error = "*** PROGRAMMING ERROR **** - setHSValue called by something without a UUID";
			console.log ("*** PROGRAMMING ERROR **** - setHSValue called by something without a UUID");
			console.log (this);                
			callback(error);
			
		}

			// Add Any Special Handling Based on the UUID
			// Uncomment any UUID's actually used!
				switch( this.UUID)
				{
					// The following characteristics all are stored as percentages in HomeKit, but 1-99 in HomeSeer
					// So scale these values.

					case(Characteristic.Brightness.UUID ): 
					{
						transmitValue = (transmitValue == 100) ? 99 : level;
						
						setHSValue(this.HSRef, transmitValue); 
						callbackValue = level; // but call back with the value instructed by HomeKit rather than the modified 99 sent to HomeSeer
						
						this.updateValue(transmitValue); // Assume success. This gets corrected on next poll if assumption is wrong.
						// console.log ("          ** Debug ** called for Brightness update with level %s then set to transmitValue %s", level, transmitValue); 

						break;
					}
					

					case(Characteristic.LockTargetState.UUID ):
					{
						switch(level)
						{
							case 0: {transmitValue =  0;   callbackValue = 0;  break;}
							case 1: {transmitValue =  255; callbackValue = 1;  break; }
						}
						setHSValue(this.HSRef, transmitValue);
						console.log("Set TransmitValue for lock characteristic %s to %s ", this.displayName, transmitValue);
						break;
					}
	
					case(Characteristic.On.UUID ):  
					{
						// For devices such as dimmers, HomeKit sends both "on" and "brightness" when you adjust brightness.
						//  But Z-Wave only expects a brighness value. So, if the device is already on (non-Zero ZWave vallue)
						// then don't send again.
						// And Only send "on" if the device isn't already on.
						// Also, because a dimmer will set to its "last value" and that won't be known until the next poll from HomeSeer
						// Assume a last-value of about 50% to avoid too much jumping of the brightness slider.
						// HomeKit level == false means turn off, level == true means turn on.
						
						
						// transmitValue = ( (level == true) ? 255 : 0);
						// callbackValue = (( level != false) ? 1 : 0 );
						
						if (level == false) 
							{
								transmitValue = 0 ; 
								callbackValue = 0;
								setHSValue(this.HSRef, 0); // assume success and set to 0 to avoid jumping of any associated dimmer / range slider.
						}
						else // turn on!
						{
							if(getHSValue(this.HSRef) == 0)	// if it is currently off, then turn fully on.
							{
								// if it is off, turn on to full level.
								transmitValue = 255;
								setHSValue(this.HSRef, 99);
								callbackValue = 1; // and callback with a 1 meaning it was turned on
							}
							else // If it appears to be on, then send same value!
							{
								// if it is on then use current value.
								// don't use the "255" value because Z-Wave dimmer's can be ramping up/down 
								// and use of set-last-value (255)  will cause jumping of the HomeKit Dimmer slider interface
								// if a poll occurs during ramping.
								transmitValue = getHSValue(this.HSRef); // if it is already on, then just transmit its current value
								callbackValue = 1;
								// noUpdate = true; // or maybe don't transmit at all (testing this feature)
							}
						}
					
						
						break; // 
					}

					default:
					{
						console.log ("*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by setHSValue routine");
						
						var err = "*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by setHSValue routine" 
										+ characteristicObject.UUID + "  named  " + characteristicObject.displayName;
						callback(err, 0);
						return;
						break;
					}

				}
		
		if (isNaN(transmitValue)) 
			{console.log ("*** PROGRAMMING ERROR **** - Attempting to transmit non-numeric value to HomeSeer for %s with UUID %s", this.displayName, this.UUID);
			callback("Programming Error in function setHSValue. Attempt to send value to HomeSeer that is not a number");
			};
	
		 url = _accessURL + "request=controldevicebyvalue&ref=" + this.HSRef + "&value=" + transmitValue;
 
		 // For debugging
		 //console.log ("Debug - Called setHSValue has URL = %s", url);
		 
		 console.log("Sending URL %s", url);

		 promiseHTTP(url)
			.then( function(htmlString) {
					console.log(this.displayName + ': HomeSeer setHSValue function succeeded!');
					callback(null, callbackValue);
					updateCharacteristic(this);
			}.bind(this))
			.catch(function(err)
				{ 	console.log("Error attempting to update %s, with error %s", this.displayName, this.UUID, err);
				}.bind(this)
			);

	
    },


    getServices: function () {
		// this.log("---------------getServices function called --------- Debug ----------------------------");
        var services = []

        switch (this.config.type) {
			/*
			
            case "Switch": {
                var switchService = new Service.Switch();
				switchService.isPrimaryService = true;
				
				switchService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
					
                switchService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this));

                this.statusCharacteristic = switchService.getCharacteristic(Characteristic.On);
                services.push(switchService);
                break;
            }
			*/
			
			
			/*
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
            } */
			
			
			
            case "TemperatureSensor": {
                var temperatureSensorService = new Service.TemperatureSensor();
				temperatureSensorService.isPrimaryService = true;
				temperatureSensorService.displayName = "Service.TemperatureSensor";

                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature)
					.HSRef = this.config.ref;
					
				temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature)
					.HStemperatureUnit = ((this.config.temperatureUnit) ? this.config.temperatureUnit : "F" );
				
                temperatureSensorService
                    .getCharacteristic(Characteristic.CurrentTemperature).setProps({ minValue: -100 });

                services.push(temperatureSensorService);
				
				_statusObjects.push(temperatureSensorService.getCharacteristic(Characteristic.CurrentTemperature));	

                break;
            }
			
            case "CarbonMonoxideSensor": {
                var carbonMonoxideSensorService = new Service.CarbonMonoxideSensor();
                carbonMonoxideSensorService.isPrimaryService = true;
				
                carbonMonoxideSensorService
                    .getCharacteristic(Characteristic.CarbonMonoxideDetected)
					.HSRef = this.config.ref;

                services.push(carbonMonoxideSensorService);
				
				_statusObjects.push(carbonMonoxideSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected));	
				
                break;
            }
            case "CarbonDioxideSensor": {
                var carbonDioxideSensorService = new Service.CarbonDioxideSensor();
				carbonDioxideSensorService.isPrimaryService = true;
				
                carbonDioxideSensorService
                    .getCharacteristic(Characteristic.CarbonDioxideDetected)
                    .HSRef = this.config.ref;

                services.push(carbonDioxideSensorService);
				
				_statusObjects.push(carbonDioxideSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected));	

                break;
            }
            case "ContactSensor": {
                var contactSensorService = new Service.ContactSensor();
                contactSensorService.isPrimaryService = true;
				
				contactSensorService
                    .getCharacteristic(Characteristic.ContactSensorState)
                    .HSRef = this.config.ref;

                services.push(contactSensorService);

				_statusObjects.push(contactSensorService.getCharacteristic(Characteristic.ContactSensorState));	

                break;
            }
            case "MotionSensor": {
                var motionSensorService = new Service.MotionSensor();
                motionSensorService.isPrimaryService = true;
                motionSensorService.HSRef = this.config.ref;
				
                motionSensorService
                    .getCharacteristic(Characteristic.MotionDetected)
                   .HSRef = this.config.ref;

                services.push(motionSensorService);
				
				_statusObjects.push(motionSensorService.getCharacteristic(Characteristic.MotionDetected));	
				
                break;
            }
            case "LeakSensor": {
                var leakSensorService = new Service.LeakSensor();
                leakSensorService
                    .getCharacteristic(Characteristic.LeakDetected)
                    .HSRef = this.config.ref;

                services.push(leakSensorService);

				_statusObjects.push(leakSensorService.getCharacteristic(Characteristic.LeakDetected));	
				
                break;
            }
            case "OccupancySensor": {
                var occupancySensorService = new Service.OccupancySensor();
                occupancySensorService
                    .getCharacteristic(Characteristic.OccupancyDetected)
                    .HSRef = this.config.ref;

                services.push(occupancySensorService);
				
				_statusObjects.push(occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected));	
				
                break;
            }
            case "SmokeSensor": {
                var smokeSensorService = new Service.SmokeSensor();
                smokeSensorService
                    .getCharacteristic(Characteristic.SmokeDetected)
					.HSRef = this.config.ref;

                services.push(smokeSensorService);
				
				_statusObjects.push(smokeSensorService.getCharacteristic(Characteristic.SmokeDetected));	

                break;
            }
			
			/*
            case "LightSensor": {
                var lightSensorService = new Service.LightSensor();
                lightSensorService
                    .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
                    .on('get', this.getValue.bind(this))
                    .isPrimaryService = true;

                services.push(lightSensorService);

                break;
            }
			*/
			
			/*
            case "HumiditySensor": {
                var humiditySensorService = new Service.HumiditySensor();
                humiditySensorService
                    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
                    .on('get', this.getValue.bind(this))
                    .isPrimaryService = true;

                services.push(humiditySensorService);

                break;
            }
			
			*/
			

            case "Lock": {
                this.config.lockRef = this.ref;
                var lockService = new Service.LockMechanism();
				lockService.isPrimaryService = true;
				lockService.displayName = "Service.LockMechanism";
				
				lockService
                    .getCharacteristic(Characteristic.LockCurrentState)
					.HSRef = this.config.ref;
					
                lockService
                    .getCharacteristic(Characteristic.LockCurrentState)					
                    .on('get', getHSValue.bind(lockService.getCharacteristic(Characteristic.LockCurrentState)));
				

               /*  lockService
                    .getCharacteristic(Characteristic.LockTargetState)
                    .on('get', getHSValue.bind(lockService.getCharacteristic(Characteristic.LockCurrentState)));
		*/
				// Target needs to be updated to match current state after a HomeSeer change.
				/* lockService
                    .getCharacteristic(Characteristic.LockTargetState)
					.HSRef = this.config.ref; */
					
                lockService
                    .getCharacteristic(Characteristic.LockTargetState)
					.on('set', this.setHSValue.bind(lockService.getCharacteristic(Characteristic.LockTargetState)));
                    // .on('set', this.setLockTargetState.bind(this));
					
				if (this.config.unlockValue)
					 lockService.getCharacteristic(Characteristic.LockTargetState).HSunlockValue = this.config.unlockValue;
				if (this.config.lockValue)
					lockService.getCharacteristic(Characteristic.LockTargetState).HSlockValue = this.config.lockValue;
		    
				lockService.isPrimaryService = true;
		    
				services.push(lockService);
				
		    	_statusObjects.push(lockService.getCharacteristic(Characteristic.LockCurrentState));
			//  _statusObjects.push(lockService.getCharacteristic(Characteristic.LockTargetState));
								
                break;
            }
			
			
			/*
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
			*/

            case "Lightbulb": 
			default: {
				this.log("** Debug ** - Setting up bulb %s with can_dim %s", this.config.name, this.config.can_dim);
                var lightbulbService = new Service.Lightbulb();
				lightbulbService.isPrimaryService = true;
				lightbulbService.displayName = "Service.Lightbulb"
				
				lightbulbService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
				
                lightbulbService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));
                    // .on('get', this.getPowerState.bind(this));
					
				_statusObjects.push(lightbulbService.getCharacteristic(Characteristic.On));
		    
                if (this.config.can_dim == null || this.config.can_dim == true) {
					this.log("       ** Debug ** Adding a Brightness service");
					
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
						
					_statusObjects.push(lightbulbService.getCharacteristic(Characteristic.Brightness));
                }

                services.push(lightbulbService);

                break;
            }
        }
		
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
					
					_statusObjects.push(batteryService.getCharacteristic(Characteristic.BatteryLevel));
					_statusObjects.push(batteryService.getCharacteristic(Characteristic.StatusLowBattery));					
                }
				
		// And add a basic Accessory Information service		
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, "HS " + this.config.type + " ref " + this.ref);
        services.push(informationService);
		// 
		

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


function updateCharacteristicFromHSData(characteristicObject)
{
	//Debug
	// console.log("** Debug ** - Updating Characteristic %s with name %s", characteristicObject.UUID, characteristicObject.displayName)
		// character stores a 
	if (characteristicObject.HSRef)
	{
		var newValue = getHSValue(characteristicObject.HSRef);

		switch(true)
		{
			case(characteristicObject.UUID == Characteristic.StatusLowBattery.UUID):
			{
				// that.log("Battery Threshold status of battery level %s with threshold %s", newValue, characteristicObject.batteryThreshold);
				characteristicObject.updateValue((newValue < characteristicObject.batteryThreshold) ? true : false);
				break;
			}
			case(characteristicObject.UUID == Characteristic.LockCurrentState.UUID):
			{
				// Set to 0 = UnSecured, 1 - Secured, 2 = Jammed.
				console.log("** Debug ** - Attempting LockCurrentState update with value %s", newValue);
				
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	}
					case(255):	{	characteristicObject.updateValue(1);	break;	}
					default:	{	characteristicObject.updateValue(2);	break;	}
				}
				console.log("** Debug ** - Finished LockCurrentState update");

				break;
			}
			/*
			case(characteristicObject.UUID == Characteristic.LockTargetState.UUID):
			{
				// Set to 0 = UnSecured, 1 - Secured, 2 = Jammed.
				var lockState = (newValue == 0) ? 0 : 1;
				characteristicObject.updateValue(lockState);
				break;
			}
			*/
			// case(characteristicObject.UUID == Characteristic.LockTargetState.UUID):
			
			case( characteristicObject.UUID == Characteristic.CarbonDioxideDetected.UUID ):
			case( characteristicObject.UUID == Characteristic.CarbonMonoxideDetected.UUID):
			case( characteristicObject.UUID == Characteristic.ContactSensorState.UUID 	):
			case( characteristicObject.UUID == Characteristic.MotionDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.LeakDetected.UUID 		):
			case( characteristicObject.UUID == Characteristic.OccupancyDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.SmokeDetected.UUID 	):
			case( characteristicObject.UUID == Characteristic.On.UUID):
			{
				characteristicObject.updateValue( ((newValue) ? true: false) );
				break;
			}
			case(characteristicObject.UUID == Characteristic.BatteryLevel.UUID):
			{
				characteristicObject.updateValue(newValue);
				break;
			}
			case (characteristicObject.UUID == Characteristic.Brightness.UUID):
			{
					// Zwave uses 99 as its maximum. Make it appear as 100% in Homekit
				characteristicObject.updateValue( (newValue == 99) ? 100 : newValue);
				break;
			}
			case (characteristicObject.UUID == Characteristic.CurrentTemperature):
			{
				// HomeKit uses celsius, so if HS is using Fahrenheit, convert to Celsius.
				if (characteristicObject.HStemperatureUnit && (characteristicObject.HStemperatureUnit == "F")) 
					{ newValue = (newValue -32 )* (5/9);}
								
				characteristicObject.updateValue(newValue);
				break;
			}

			default:
			{
					console.log("** WARNING ** -- Possible Incorrect Value Assignment for characteristic %s set to value %s", characteristicObject.displayName, newValue);
					characteristicObject.updateValue( newValue);
			}
		}; //end switch
				
		// that.log("   %s value after update is: %s", characteristicObject.displayName, characteristicObject.value);
	} // end if
}


function updateServicesFromHSData(service)
{
	 // Received an array of service objects and then Loop over each characteristic object in a service object 
	 // and then send the characteristic object for updating
		for(var cIndex = 0; cIndex < service.characteristics.length; cIndex++)
		{
			updateCharacteristicFromHSData(service.characteristics[cIndex]);
		}		
}

function updateAccssoryFromHSData(accessory)
{
		for(var sIndex = 0; sIndex < accessory.length; sIndex++)
		{
			// console.log ("Debug #%s", sIndex);
		updateServicesFromHSData( accessory[sIndex] );
		} // end for sIndex
}

function updateAllFromHSData()
{

	for (var aIndex in _statusObjects)
	{
		updateCharacteristicFromHSData(_statusObjects[aIndex]);
	} // end for aindex
} // end function


function updateCharacteristic(characteristicObject)
{
	if (characteristicObject.HSRef == null) 
	{
		console.log("** Programming Error ** - updateCharacteristic passed characteristic object %s with displayName %s but without a HomeSeer reference HSREf ", characteristicObject.UUID, characteristicObject.displayName);
		return;
	}
	
	var url = _accessURL +  "request=getstatus&ref=" + characteristicObject.HSRef;
	console.log("** DEBUG ** -- update URL is %s", url);
	
		promiseHTTP(url)
			.then( function(htmlString) {
				// console.log("");
				// console.log("	*** Debug *** Promise htmlString %s", htmlString);
				
				var thisDevice = JSON.parse(htmlString).Devices;
				// console.log("			** Debug ** - Polled for the single device " + thisDevice);
				updateCharacteristicFromHSData(characteristicObject);
				
			}).catch(function(err)
				{
					console.log("Error attempting to update Characteristic %s, with error %s", characteristic.displayName, characteristic.UUID, err);
				}
			);
}
				

module.exports.platform = HomeSeerPlatform;
