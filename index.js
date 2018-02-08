'use strict';

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
//              "can_dim":true,                 // Optional - true is the default - false for a non dimmable lightbulb
//              "uuid_base":"SomeUniqueId2"     // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
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
//            },
//            {
//              "ref":34,                       // Required - HomeSeer Device Reference for your sensor (Here it's the same device as the SmokeSensor above)
//              "type":"CarbonMonoxideSensor",  // Required for a carbon monoxide sensor
//              "name":"Kichen CO detector",    // Optional - HomeSeer device name is the default
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//            },
//            {
//              "ref":210,                      // Required - HomeSeer Device Reference of a Lock
//              "type":"Lock",                  // Required for a Lock
//              "batteryRef":35,                // Optional - HomeSeer device reference for the sensor battery level
//              "batteryThreshold":15,          // Optional - If sensor battery level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//            },
//            {
//              "ref":115,                      // Required - HomeSeer Device Reference for a device holding battery level (0-100)
//              "type":"Battery",               // Required for a Battery
//              "name":"Roomba battery",        // Optional - HomeSeer device name is the default
//              "batteryThreshold":15           // Optional - If the level is below this value, the HomeKit LowBattery characteristic is set to 1. Default is 10
//            },
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
// - Lock                   (unsecured, secured, jammed options)



var promiseHTTP = require("request-promise-native");

var Accessory, Service, Characteristic, UUIDGen;

var _allAccessories = [];
var _globalHSRefs = [];
	_globalHSRefs.pushUnique = function(item) { if (this.indexOf(item) == -1) this.push(item); }
	
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
        var refList = [];
		
		// Make devices for each HomeSeer event in the config.json file
        if (this.config.events) {
            this.log("Creating HomeSeer events. Caution currently untested.");
            for (var i = 0; i < this.config.events.length; i++) {
                var event = new HomeSeerEvent(that.log, that.config, that.config.events[i]);
                foundAccessories.push(event);
            }
        }

		// Then make a device for each "regular" HomeSeer device.
        this.log("Fetching HomeSeer devices.");

        for (var i = 0; i < this.config.accessories.length; i++) {

			refList.push(this.config.accessories[i].ref);
			
			//Gather all HS References For polling. Refernces in _globalHSRefs can include references that do not
			// create a new HomeKit device such as batteries
			_globalHSRefs.pushUnique(this.config.accessories[i].ref);
			
			if(this.config.accessories[i].batteryRef) _globalHSRefs.pushUnique(this.config.accessories[i].batteryRef);

        }
		
		//For New Polling Method to poll all devices at once
		_globalHSRefs.sort();
		_allStatusUrl = this.config["host"] + "/JSON?request=getstatus&ref=" + _globalHSRefs.concat();
		
		this.log("Global Status URL is " + _allStatusUrl);
		
        var url = this.config["host"] + "/JSON?request=getstatus&ref=" + refList.concat();
		
	// ********************************	
		
		promiseHTTP(url).then( function(body) {
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

			updateEmitter = setInterval( function () 
					{
					// Now do the poll
						promiseHTTP(_allStatusUrl)
							.then( function(htmlString) 
									{
										_currentHSDeviceStatus = JSON.parse(htmlString).Devices;
										that.log("Polled HomeSeer: Retrieved values for %s HomeSeer devices.",  _currentHSDeviceStatus.length);
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
					);	//end setInterval function for polling loop
			
			callback(foundAccessories);
            
        }.bind(this))
		.catch (function(err) 
			{ 
			this.log('HomeSeer status function failed: %s', error.message); 
			callback(foundAccessories)
			});


    }
}

function HomeSeerAccessory(log, platformConfig, accessoryConfig, status) {
    this.log = log;
    this.config = accessoryConfig;
    this.ref = status.ref;
    this.name = status.name
    this.model = status.device_type_string;

    this.access_url = platformConfig["host"] + "/JSON?";
	_accessURL = this.access_url;
    this.control_url = this.access_url + "request=controldevicebyvalue&ref=" + this.ref + "&value=";
    this.status_url = this.access_url + "request=getstatus&ref=" + this.ref;

    if (this.config.name)
        this.name = this.config.name;

    if (this.config.uuid_base)
        this.uuid_base = this.config.uuid_base;

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
		
		// Uncomment for Debugging
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
					case(Characteristic.Brightness.UUID ): 
					{
						// Maximum ZWave value is 99 so covert 100% to 99!
						transmitValue = (transmitValue == 100) ? 99 : level;
						
						setHSValue(this.HSRef, transmitValue); 
						callbackValue = level; // but call back with the value instructed by HomeKit rather than the modified 99 sent to HomeSeer
						
						// this.updateValue(transmitValue); // Assume success. This gets corrected on next poll if assumption is wrong.
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
						// setHSValue(this.HSRef, transmitValue); ** Don't assume success for the lock. Wait for a poll!
						console.log("Set TransmitValue for lock characteristic %s to %s ", this.displayName, transmitValue);
						break;
					}
	
					case(Characteristic.On.UUID ):  
					{
						// For devices such as dimmers, HomeKit sends both "on" and "brightness" when you adjust brightness.
						// But Z-Wave only expects a brighness value if light is already on. So, if the device is already on (non-Zero ZWave value)
						// then don't send again.
						// HomeKit level == false means turn off, level == true means turn on.
						
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
			
            case "Switch": {
                var switchService = new Service.Switch();
				switchService.isPrimaryService = true;
				
				switchService
					.getCharacteristic(Characteristic.On)
					.HSRef = this.config.ref;
					
                switchService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setHSValue.bind(switchService.getCharacteristic(Characteristic.On)));
				_statusObjects.push(switchService.getCharacteristic(Characteristic.On));

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
                    .on('set', this.setHSValue.bind(outletService.getCharacteristic(Characteristic.On)));

				_statusObjects.push(outletService.getCharacteristic(Characteristic.On));
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
					.HStemperatureUnit = ((this.config.temperatureUnit) ? this.config.temperatureUnit : "F" );

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
                    .getCharacteristic(Characteristic.LockTargetState)
						.HSRef = this.config.ref;
						
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
				_statusObjects.push(lockService.getCharacteristic(Characteristic.LockTargetState));
								
                break;
            }
			
			
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
			
		promiseHTTP(url)
			.then( function(htmlString) {
					console.log(this.name + ': launchEvent function succeeded!');
					callback(null);
			}.bind(this))
			.catch(function(err)
				{ 	console.log(this.name + ': launchEvent function failed: %s', err);
					callback(err);
				}.bind(this)
			);
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
	
	// This performs the update to the HomeKit value from data received from HomeSeer
	//Debug
	// console.log("** Debug ** - Updating Characteristic %s with name %s", characteristicObject.UUID, characteristicObject.displayName)

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
				// console.log("** Debug ** - Attempting LockCurrentState update with received HS value %s", newValue);
				
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	} // Locked
					case(255):	{	characteristicObject.updateValue(1);	break;	} // unlocked
					default:	{	characteristicObject.updateValue(2);	break;	} // unknown
				}
				break;
			}
			case (characteristicObject.UUID == Characteristic.LockTargetState.UUID):
			{
				switch(newValue)
				{
					case(0):	{	characteristicObject.updateValue(0);	break;	} // Locked
					case(255):	{	characteristicObject.updateValue(1);	break;	} // unlocked
					default:	{ 	console.log("ERROR - Unexpected Lock Target State Value %s", newValue); break;}
				}
				break;
			}
			
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
			case (characteristicObject.UUID == Characteristic.CurrentTemperature.UUID):
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
		
		// Uncomment for debugging
		// console.log("** Debug ** -   %s value after update is: %s", characteristicObject.displayName, characteristicObject.value);
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
