'use strict';

// The uuid_base parameter is valid for all events and accessories. 
// If you set this parameter to some unique identifier, the HomeKit accessory ID will be based on uuid_base instead of the accessory name.
// It is then easier to change the accessory name without messing the HomeKit database.
// 


//var Service = require("../api").homebridge.hap.Service;
//var Characteristic = require("../api").homebridge.hap.Characteristic;
var request = require("request");
var pollingtoevent = require("polling-to-event");
var promiseHTTP = require("request-promise-native");

// var isValidUUID = require("./lib/UUIDcheck");

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
			updateEmitter = pollingtoevent(
				function (done) {
					that.log ("************************");
					// Now do the poll
							httpRequest(_allStatusUrl, 'GET', function (error, response, body) {
							if (error) {
								this.log("** Warning ** - Polling HomeSeer Failed");
								// callback(error, 0);
							}
							else {

								_currentHSDeviceStatus = JSON.parse(body).Devices;
								this.log("Device Data for %s HomeSeer devices retrieved from HomeSeer ",  _currentHSDeviceStatus.length);
							}
							}.bind(this)); // end of the HTTP Request
					done(null, null);
					}.bind(this), {interval: this.config.platformPoll * 1000 }
					);	//end polling-to-event function
			

			updateEmitter.on("poll",
				function() { 
				//	that.log("----------- Debug: Entered function accessoriesUpdate.on -----------");
				// Now Create an array where the HomeSeer Value is tied to the array index location. e.g., ref 101's value is at location 101.
					for (var index in _currentHSDeviceStatus)
					{
					// Update List of all HS Values
						_HSValues[_currentHSDeviceStatus[index].ref] = _currentHSDeviceStatus[index].value;
					} //endfor
				
					// Then scan each device characteristic and update it.
					// that.log("calling updateCharacteristicsFromHSData");
					// that.log("that.foundAccessories is defined? " + that.foundAccessories);
					updateAllFromHSData();
				} // end function HSDevices
			);
			// this.log("------------------ Debug ------------------");
			// this.log(foundAccessories);
			// this.log ("----------------------");
			
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
		var callbackValue = 1;
		var transmitValue = level;
		var noUpdate = false; // set to true if something determines that there should be no HomeSeer update.

		
		// For Debugging
		console.log ("** Debug ** - Called setHSValue with level %s for UUID %s", level, this.UUID);
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
					//  case(Service.AccessoryInformation.UUID ):  
					//  case(Service.AirPurifier.UUID ):  
					//  case(Service.AirQualitySensor.UUID ):  
					//  case(Service.BatteryService.UUID ):  
					//  case(Service.CameraRTPStreamManagement.UUID ):  
					//  case(Service.CarbonDioxideSensor.UUID ):  
					//  case(Service.CarbonMonoxideSensor.UUID ):  
					//  case(Service.ContactSensor.UUID ):  
					//  case(Service.Door.UUID ):  
					//  case(Service.Doorbell.UUID ):  
					//  case(Service.Fan.UUID ):  
					//  case(Service.Fanv2.UUID ):  
					//  case(Service.FilterMaintenance.UUID ):  
					//  case(Service.Faucet.UUID ):  
					//  case(Service.GarageDoorOpener.UUID ):  
					//  case(Service.HeaterCooler.UUID ):  
					//  case(Service.HumidifierDehumidifier.UUID ):  
					//  case(Service.HumiditySensor.UUID ):  
					//  case(Service.IrrigationSystem.UUID ):  
					//  case(Service.LeakSensor.UUID ):  
					//  case(Service.LightSensor.UUID ):  
					//  case(Service.Lightbulb.UUID ):  
					//  case(Service.LockManagement.UUID ):  
					//  case(Service.LockMechanism.UUID ):  
					//  case(Service.Microphone.UUID ):  
					//  case(Service.MotionSensor.UUID ):  
					//  case(Service.OccupancySensor.UUID ):  
					//  case(Service.Outlet.UUID ):  
					//  case(Service.SecuritySystem.UUID ):  
					//  case(Service.ServiceLabel.UUID ):  
					//  case(Service.Slat.UUID ):  
					//  case(Service.SmokeSensor.UUID ):  
					//  case(Service.Speaker.UUID ):  
					//  case(Service.StatelessProgrammableSwitch.UUID ):  
					//  case(Service.Switch.UUID ):  
					//  case(Service.TemperatureSensor.UUID ):  
					//  case(Service.Thermostat.UUID ):  
					//  case(Service.Valve.UUID ):  
					//  case(Service.Window.UUID ):  
					//  case(Service.WindowCovering.UUID ):  

					//  case(Characteristic.Active.UUID ):  
					//  case(Characteristic.AdministratorOnlyAccess.UUID ):  
					//  case(Characteristic.AirParticulateDensity.UUID ):  
					//  case(Characteristic.AirParticulateSize.UUID ):  
					//  case(Characteristic.AirQuality.UUID ):  
					//  case(Characteristic.AudioFeedback.UUID ):  
					// 	READ-Only, Don't Set: case(Characteristic.BatteryLevel.UUID ):  
					
					// The following characteristics all are stored as percentages in HomeKit, but 1-99 in HomeSeer
					// So scale these values.
					case(Characteristic.RotationSpeed.UUID ):  
					case(Characteristic.Brightness.UUID ): 
					{
						transmitValue = (transmitValue == 100) ? 99 : level;
						
						setHSValue(this.HSRef, transmitValue); 
						
						this.updateValue(transmitValue); // Assume success. This gets corrected on next poll if assumption is wrong.
						console.log ("          ** Debug ** called for Brightness update with level %s then set to transmitValue %s", level, transmitValue); 

						break;
					}
					
					//  case(Characteristic.CarbonDioxideDetected.UUID ):  
					//  case(Characteristic.CarbonDioxideLevel.UUID ):  
					//  case(Characteristic.CarbonDioxidePeakLevel.UUID ):  
					//  case(Characteristic.CarbonMonoxideDetected.UUID ):  
					//  case(Characteristic.CarbonMonoxideLevel.UUID ):  
					//  case(Characteristic.CarbonMonoxidePeakLevel.UUID ):  
					//  case(Characteristic.ChargingState.UUID ):  
					//  case(Characteristic.ColorTemperature.UUID ):  
					//  case(Characteristic.ContactSensorState.UUID ):  
					//  case(Characteristic.CoolingThresholdTemperature.UUID ):  
					//  case(Characteristic.CurrentAirPurifierState.UUID ):  
					//  case(Characteristic.CurrentAmbientLightLevel.UUID ):  
					//  case(Characteristic.CurrentDoorState.UUID ):  
					//  case(Characteristic.CurrentFanState.UUID ):  
					//  case(Characteristic.CurrentHeaterCoolerState.UUID ):  
					//  case(Characteristic.CurrentHeatingCoolingState.UUID ):  
					//  case(Characteristic.CurrentHorizontalTiltAngle.UUID ):  
					//  case(Characteristic.CurrentHumidifierDehumidifierState.UUID ):  
					//  case(Characteristic.CurrentPosition.UUID ):  
					//  case(Characteristic.CurrentRelativeHumidity.UUID ):  
					//  case(Characteristic.CurrentSlatState.UUID ):  
					//  case(Characteristic.CurrentTemperature.UUID ):  
					//  case(Characteristic.CurrentTiltAngle.UUID ):  
					//  case(Characteristic.CurrentVerticalTiltAngle.UUID ):  
					//  case(Characteristic.DigitalZoom.UUID ):  
					//  case(Characteristic.FilterChangeIndication.UUID ):  
					//  case(Characteristic.FilterLifeLevel.UUID ):  
					//  case(Characteristic.FirmwareRevision.UUID ):  
					//  case(Characteristic.HardwareRevision.UUID ):  
					//  case(Characteristic.HeatingThresholdTemperature.UUID ):  
					//  case(Characteristic.HoldPosition.UUID ):  
					//  case(Characteristic.Hue.UUID ):  
					//  case(Characteristic.Identify.UUID ):  
					//  case(Characteristic.ImageMirroring.UUID ):  
					//  case(Characteristic.ImageRotation.UUID ):  
					//  case(Characteristic.InUse.UUID ):  
					//  case(Characteristic.IsConfigured.UUID ):  
					//  case(Characteristic.LeakDetected.UUID ):  
					//  case(Characteristic.LockControlPoint.UUID ):  
					//  case(Characteristic.LockCurrentState.UUID ):  
					//  case(Characteristic.LockLastKnownAction.UUID ):  
					//  case(Characteristic.LockManagementAutoSecurityTimeout.UUID ):  
					//  case(Characteristic.LockPhysicalControls.UUID ):  
					case(Characteristic.LockTargetState.UUID ):
					{
						switch(level)
						{
							case 0: {transmitValue =  0;   callbackValue = 0;  break;}
							case 1: {transmitValue =  255; callbackValue = 1;  break; }
						}
						console.log("Set TransmitValue for lock characteristic %s to %s ", this.displayName, transmitValue);
						break;
					}
					//  case(Characteristic.Logs.UUID ):  
					//  case(Characteristic.Manufacturer.UUID ):  
					//  case(Characteristic.Model.UUID ):  
					//  case(Characteristic.MotionDetected.UUID ):  
					//  case(Characteristic.Mute.UUID ):  
					//  case(Characteristic.Name.UUID ):  
					//  case(Characteristic.NightVision.UUID ):  
					//  case(Characteristic.NitrogenDioxideDensity.UUID ):  
					//  case(Characteristic.ObstructionDetected.UUID ):  
					//  case(Characteristic.OccupancyDetected.UUID ):  
					case(Characteristic.On.UUID ):  
					{
						// For devices such as dimmers, HomeKit sends both "on" and "brighness" when you adjust brightness.
						//  But Z-Wave only expects a brighness value. So, if the device is already on (non-Zero ZWave vallue)
						// then don't send again.
						// And Only send "on" if the device isn't already on.
						// Also, because a dimmer will set to its "last value" and that won't be known until the next poll from HomeSeer
						// Assume a last-value of about 50% to avoid too much jumping of the brightness slider.
						// HomeKit level == false means turn off, level == true means turn on.
						
						// transmitValue = ( (level == true) ? 255 : 0);
						
						
						
						if (level == false) 
							{
								transmitValue = 0 ; 
								callbackValue = 0;
								setHSValue(this.HSRef, 0); // assume success and set to 0 to avoid jumping of any associated dimmer / range slider.
						}
						else
						{
							if(getHSValue(this.HSRef) == 0)	
							{
								// if it is off, turn on to full level.
								transmitValue = 99;
								setHSValue(this.HSRef, 99);
								callbackValue = 1;
							}
							else
							{
								// if it is on then use current value.
								// don't use the "255" value because Z-Wave dimmer's can be ramping up/down 
								// and use of set-last-value (255)  will cause jumping of the HomeKit Dimmer slider interface
								// if a poll occurs during ramping.
								transmitValue = getHSValue(this.HSRef);
								callbackValue = 1;
							}
						}
						
						
						break;
					}
					//  case(Characteristic.OpticalZoom.UUID ):  
					//  case(Characteristic.OutletInUse.UUID ):  
					//  case(Characteristic.OzoneDensity.UUID ):  
					//  case(Characteristic.PairSetup.UUID ):  
					//  case(Characteristic.PairVerify.UUID ):  
					//  case(Characteristic.PairingFeatures.UUID ):  
					//  case(Characteristic.PairingPairings.UUID ):  
					//  case(Characteristic.PM10Density.UUID ):  
					//  case(Characteristic.PM2_5Density.UUID ):  
					//  case(Characteristic.PositionState.UUID ):  
					//  case(Characteristic.ProgramMode.UUID ):  
					//  case(Characteristic.ProgrammableSwitchEvent.UUID ):  
					//  case(Characteristic.RelativeHumidityDehumidifierThreshold.UUID ):  
					//  case(Characteristic.RelativeHumidityHumidifierThreshold.UUID ):  
					//  case(Characteristic.RemainingDuration.UUID ):  
					//  case(Characteristic.ResetFilterIndication.UUID ):  
					//  case(Characteristic.RotationDirection.UUID ):  

					//  case(Characteristic.Saturation.UUID ):  
					//  case(Characteristic.SecuritySystemAlarmType.UUID ):  
					//  case(Characteristic.SecuritySystemCurrentState.UUID ):  
					//case(Characteristic.SecuritySystemTargetState.UUID ):  
					//  case(Characteristic.SelectedRTPStreamConfiguration.UUID ):  
					//  case(Characteristic.SerialNumber.UUID ):  
					//  case(Characteristic.ServiceLabelIndex.UUID ):  
					//  case(Characteristic.ServiceLabelNamespace.UUID ):  
					//  case(Characteristic.SetDuration.UUID ):  
					//  case(Characteristic.SetupEndpoints.UUID ):  
					//  case(Characteristic.SlatType.UUID ):  
					//  case(Characteristic.SmokeDetected.UUID ):  
					//  case(Characteristic.StatusActive.UUID ):  
					//  case(Characteristic.StatusFault.UUID ):  
					//  case(Characteristic.StatusJammed.UUID ):  
					//  case(Characteristic.StatusLowBattery.UUID ):  
					//  case(Characteristic.StatusTampered.UUID ):  
					//  case(Characteristic.StreamingStatus.UUID ):  
					//  case(Characteristic.SulphurDioxideDensity.UUID ):  
					//  case(Characteristic.SupportedAudioStreamConfiguration.UUID ):  
					//  case(Characteristic.SupportedRTPConfiguration.UUID ):  
					//  case(Characteristic.SupportedVideoStreamConfiguration.UUID ):  
					//  case(Characteristic.SwingMode.UUID ):  
					//  case(Characteristic.TargetAirPurifierState.UUID ):  
					//  case(Characteristic.TargetAirQuality.UUID ):  
					/* case(Characteristic.TargetDoorState.UUID ):  
					{
						break;
					} */
					//  case(Characteristic.TargetFanState.UUID ):  
					//  case(Characteristic.TargetHeaterCoolerState.UUID ):  
					/* case(Characteristic.TargetHeatingCoolingState.UUID ):  
					{
						break;
					} */
					//  case(Characteristic.TargetHorizontalTiltAngle.UUID ):  
					//  case(Characteristic.TargetHumidifierDehumidifierState.UUID ):  
					/* case(Characteristic.TargetPosition.UUID ):  
					{
						break;
					} */
					//  case(Characteristic.TargetRelativeHumidity.UUID ):  
					//  case(Characteristic.TargetSlatState.UUID ):  
					/* case(Characteristic.TargetTemperature.UUID ): 
					{
						break;
					}*/
					//  case(Characteristic.TargetTiltAngle.UUID ):  
					//  case(Characteristic.TargetVerticalTiltAngle.UUID ):  
					//  case(Characteristic.TemperatureDisplayUnits.UUID ):  
					//  case(Characteristic.ValveType.UUID ):  
					//  case(Characteristic.Version.UUID ):  
					//  case(Characteristic.VOCDensity.UUID ):  
					//  case(Characteristic.Volume.UUID ):  
					//  case(Characteristic.WaterLevel.UUID ):  
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
			{console.log ("*** PROGRAMMING ERROR **** - Service or Characteristic UUID not handled by setHSValue routine");
			callback("Programming Error in function setHSValue. Attempt to send value to HomeSeer that is not a number");
			};
	
		 url = _accessURL + "request=controldevicebyvalue&ref=" + this.HSRef + "&value=" + transmitValue;
 
		 // For debugging
		 console.log ("Debug - Called setHSValue has URL = %s", url);


        httpRequest(url, 'GET', function (error, response, body) {
            if (error) {
                console.log(this.name + ': HomeSeer setHSValue function failed: %s', error.message);
                callback(error);
            }
            else {
                console.log(this.name + ': HomeSeer setHSValue function succeeded!');
                callback(null, callbackValue);
            }
        }.bind(this));
		
		// Need to confirm this is a characteristic.
		updateCharacteristic(this);
		
// 		updateEmitter.emit("poll");
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
		
		var returnValue = getHSValue(this.HSRef); 
		
		//The following switch statement "massages" the returnValue based on the service or Characteristic type.
				switch( this.UUID)
				{
					case( Service.AccessoryInformation.UUID ):  
					case( Service.AirPurifier.UUID ):  
					case( Service.AirQualitySensor.UUID ):  
					case( Service.BatteryService.UUID ):  
					case( Service.CameraRTPStreamManagement.UUID ):  
					case( Service.CarbonDioxideSensor.UUID ):  
					case( Service.CarbonMonoxideSensor.UUID ):  
					case( Service.ContactSensor.UUID ):  
					case( Service.Door.UUID ):  
					case( Service.Doorbell.UUID ):  
					case( Service.Fan.UUID ):  
					case( Service.Fanv2.UUID ):  
					case( Service.FilterMaintenance.UUID ):  
					case( Service.Faucet.UUID ):  
					case( Service.GarageDoorOpener.UUID ):  
					case( Service.HeaterCooler.UUID ):  
					case( Service.HumidifierDehumidifier.UUID ):  
					case( Service.HumiditySensor.UUID ):  
					case( Service.IrrigationSystem.UUID ):  
					case( Service.LeakSensor.UUID ):  
					case( Service.LightSensor.UUID ):  
					case( Service.Lightbulb.UUID ): 
					case( Service.LockManagement.UUID ):  
					case( Service.LockMechanism.UUID ):  
					case( Service.Microphone.UUID ):  
					case( Service.MotionSensor.UUID ):  
					case( Service.OccupancySensor.UUID ):  
					case( Service.Outlet.UUID ):  
					case( Service.SecuritySystem.UUID ):  
					case( Service.ServiceLabel.UUID ):  
					case( Service.Slat.UUID ):  
					case( Service.SmokeSensor.UUID ):  
					case( Service.Speaker.UUID ):  
					case( Service.StatelessProgrammableSwitch.UUID ):  
					case( Service.Switch.UUID ):  
					case( Service.TemperatureSensor.UUID ):  
					case( Service.Thermostat.UUID ):  
					case( Service.Valve.UUID ):  
					case( Service.Window.UUID ):  
					case( Service.WindowCovering.UUID ):  
					case( Characteristic.Active.UUID ):  
					case( Characteristic.AdministratorOnlyAccess.UUID ):  
					case( Characteristic.AirParticulateDensity.UUID ):  
					case( Characteristic.AirParticulateSize.UUID ):  
					case( Characteristic.AirQuality.UUID ):  
					case( Characteristic.AudioFeedback.UUID ):
					{
						returnValue = -1;
						break;
					}
						
					case( Characteristic.BatteryLevel.UUID ):  
					{
						returnValue = getHSValue(this.HSRef);
						break;
					}
					// Next grouping is for characteristics using a percentage.
					case( Characteristic.Brightness.UUID ): 
					{
						// Z-wave uses 99 as its maximum. Make that show as 100% on Home interface.
						returnValue = (getHSValue(this.HSRef) == 99) ? 100 : getHSValue(this.HSRef);
						break;
					}
					
					case( Characteristic.CarbonDioxideDetected.UUID ):  
					case( Characteristic.CarbonDioxideLevel.UUID ):  
					case( Characteristic.CarbonDioxidePeakLevel.UUID ):  
					case( Characteristic.CarbonMonoxideDetected.UUID ):  
					case( Characteristic.CarbonMonoxideLevel.UUID ):  
					case( Characteristic.CarbonMonoxidePeakLevel.UUID ):  
					case( Characteristic.ChargingState.UUID ):  
					case( Characteristic.ColorTemperature.UUID ):  
					case( Characteristic.ContactSensorState.UUID ):  
					case( Characteristic.CoolingThresholdTemperature.UUID ):  
					case( Characteristic.CurrentAirPurifierState.UUID ):  
					case( Characteristic.CurrentAmbientLightLevel.UUID ):  
					case( Characteristic.CurrentDoorState.UUID ):  
					case( Characteristic.CurrentFanState.UUID ):  
					case( Characteristic.CurrentHeaterCoolerState.UUID ):  
					case( Characteristic.CurrentHeatingCoolingState.UUID ):  
					case( Characteristic.CurrentHorizontalTiltAngle.UUID ):  
					case( Characteristic.CurrentHumidifierDehumidifierState.UUID ):  
					case( Characteristic.CurrentPosition.UUID ):  
					case( Characteristic.CurrentRelativeHumidity.UUID ):  
					case( Characteristic.CurrentSlatState.UUID ):  
					{
						returnValue = -1;
						break;
					}
					case( Characteristic.CurrentTemperature.UUID ):  
					{
						// HomeKit uses celsius, so convert Fahrenheit to Celsius.
						if (this.HStemperatureUnit && (this.HStemperatureUnit == "F")) returnValue = (ReturnValue -32 )* (5/9);
						break;
					}
					case( Characteristic.CurrentTiltAngle.UUID ):  
					case( Characteristic.CurrentVerticalTiltAngle.UUID ):  
					case( Characteristic.DigitalZoom.UUID ):  
					case( Characteristic.FilterChangeIndication.UUID ):  
					case( Characteristic.FilterLifeLevel.UUID ):  
					case( Characteristic.FirmwareRevision.UUID ):  
					case( Characteristic.HardwareRevision.UUID ):  
					case( Characteristic.HeatingThresholdTemperature.UUID ):  
					case( Characteristic.HoldPosition.UUID ):  
					case( Characteristic.Hue.UUID ):  
					case( Characteristic.Identify.UUID ):  
					case( Characteristic.ImageMirroring.UUID ):  
					case( Characteristic.ImageRotation.UUID ):  
					case( Characteristic.InUse.UUID ):  
					case( Characteristic.IsConfigured.UUID ):  
					case( Characteristic.LeakDetected.UUID ):  
					case( Characteristic.LockControlPoint.UUID ):  
					case( Characteristic.LockCurrentState.UUID ):  
					case( Characteristic.LockLastKnownAction.UUID ):  
					case( Characteristic.LockManagementAutoSecurityTimeout.UUID ):  
					case( Characteristic.LockPhysicalControls.UUID ):  
					case( Characteristic.LockTargetState.UUID ):  
					case( Characteristic.Logs.UUID ):  
					case( Characteristic.Manufacturer.UUID ):  
					case( Characteristic.Model.UUID ):  
					case( Characteristic.MotionDetected.UUID ):  
					case( Characteristic.Mute.UUID ):  
					case( Characteristic.Name.UUID ):  
					case( Characteristic.NightVision.UUID ):  
					case( Characteristic.NitrogenDioxideDensity.UUID ):  
					case( Characteristic.ObstructionDetected.UUID ):  
					
					{
						returnValue = -1;
						break;
					}
						
						
					// The following items all use a binary state.
					case( Characteristic.OccupancyDetected.UUID ):  
					case( Characteristic.On.UUID ):
					{
						returnValue = (getHSValue(this.HSRef) != 0) ? true : false;
						break;
					}						
					case( Characteristic.OpticalZoom.UUID ):  
					case( Characteristic.OutletInUse.UUID ):  
					case( Characteristic.OzoneDensity.UUID ):  
					case( Characteristic.PairSetup.UUID ):  
					case( Characteristic.PairVerify.UUID ):  
					case( Characteristic.PairingFeatures.UUID ):  
					case( Characteristic.PairingPairings.UUID ):  
					case( Characteristic.PM10Density.UUID ):  
					case( Characteristic.PM2_5Density.UUID ):  
					case( Characteristic.PositionState.UUID ):  
					case( Characteristic.ProgramMode.UUID ):  
					case( Characteristic.ProgrammableSwitchEvent.UUID ):  
					case( Characteristic.RelativeHumidityDehumidifierThreshold.UUID ):  
					case( Characteristic.RelativeHumidityHumidifierThreshold.UUID ):  
					case( Characteristic.RemainingDuration.UUID ):  
					case( Characteristic.ResetFilterIndication.UUID ):  
					case( Characteristic.RotationDirection.UUID ):  
					case( Characteristic.RotationSpeed.UUID ):  
					case( Characteristic.Saturation.UUID ):  
					case( Characteristic.SecuritySystemAlarmType.UUID ):  
					case( Characteristic.SecuritySystemCurrentState.UUID ):  
					case( Characteristic.SecuritySystemTargetState.UUID ):  
					case( Characteristic.SelectedRTPStreamConfiguration.UUID ):  
					case( Characteristic.SerialNumber.UUID ):  
					case( Characteristic.ServiceLabelIndex.UUID ):  
					case( Characteristic.ServiceLabelNamespace.UUID ):  
					case( Characteristic.SetDuration.UUID ):  
					case( Characteristic.SetupEndpoints.UUID ):  
					case( Characteristic.SlatType.UUID ):  
					case( Characteristic.SmokeDetected.UUID ):  
					case( Characteristic.StatusActive.UUID ):  
					case( Characteristic.StatusFault.UUID ):  
					case( Characteristic.StatusJammed.UUID ):  
					case( Characteristic.StatusLowBattery.UUID ):  
					case( Characteristic.StatusTampered.UUID ):  
					case( Characteristic.StreamingStatus.UUID ):  
					case( Characteristic.SulphurDioxideDensity.UUID ):  
					case( Characteristic.SupportedAudioStreamConfiguration.UUID ):  
					case( Characteristic.SupportedRTPConfiguration.UUID ):  
					case( Characteristic.SupportedVideoStreamConfiguration.UUID ):  
					case( Characteristic.SwingMode.UUID ):  
					case( Characteristic.TargetAirPurifierState.UUID ):  
					case( Characteristic.TargetAirQuality.UUID ):  
					case( Characteristic.TargetDoorState.UUID ):  
					case( Characteristic.TargetFanState.UUID ):  
					case( Characteristic.TargetHeaterCoolerState.UUID ):  
					case( Characteristic.TargetHeatingCoolingState.UUID ):  
					case( Characteristic.TargetHorizontalTiltAngle.UUID ):  
					case( Characteristic.TargetHumidifierDehumidifierState.UUID ):  
					case( Characteristic.TargetPosition.UUID ):  
					case( Characteristic.TargetRelativeHumidity.UUID ):  
					case( Characteristic.TargetSlatState.UUID ):  
					case( Characteristic.TargetTemperature.UUID ):  
					case( Characteristic.TargetTiltAngle.UUID ):  
					case( Characteristic.TargetVerticalTiltAngle.UUID ):  
					case( Characteristic.TemperatureDisplayUnits.UUID ):  
					case( Characteristic.ValveType.UUID ):  
					case( Characteristic.Version.UUID ):  
					case( Characteristic.VOCDensity.UUID ):  
					case( Characteristic.Volume.UUID ):  
					case( Characteristic.WaterLevel.UUID ):  
					default:
					{
						returnValue = -1;
						this.log ("*** PROGRAMMING ERROR **** -  UUID not handled:" + this.UUID);
					}

				}		
		
	
		if(returnValue != -1) 
			callback(null, returnValue)
		else {
			this.log("getValue failed for object UUID: " + this.UUID);
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

        switch (this.config.type) {

            /*
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
			*/
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
			
			/*
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
			
			*/
			
			/*
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
			/*
			
			/*
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
			*/
			
			
			/*
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
			*/ 
			
			
			/*
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
			*/
			
			
			/*
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
                    .on('set', this.setHSValue.bind(lightbulbService.getCharacteristic(Characteristic.On)));
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
				
				// For an alternate status update
				_statusObjects.push(lightbulbService.getCharacteristic(Characteristic.On));
				_statusObjects.push(lightbulbService.getCharacteristic(Characteristic.Brightness));
				
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

function pollForUpdate(characteristic)
{
}


function updateCharacteristicFromHSData(characteristicObject)
{
	//Debug
	console.log("** Debug ** - Updating Characteristic %s with name %s", characteristicObject.UUID, characteristicObject.displayName)
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
					case(0):
					{
					characteristicObject.updateValue(0);
						break;
					}
					case(255):
					{
						characteristicObject.updateValue(1);
						break;
					}
					default:
					{
						characteristicObject.updateValue(2)
						break;
					}
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
	}
	
	var url = _accessURL +  "request=getstatus&ref=" + characteristicObject.HSRef;
	console.log("** DEBUG ** -- update URL is %s", url);
	
		promiseHTTP(url)
			.then( function(htmlString) {
				console.log("");
				console.log("	*** Debug *** Promise htmlString %s", htmlString);
				
				var thisDevice = JSON.parse(htmlString).Devices;
				console.log("");
				console.log("			** Debug ** - Polled for the single device " + thisDevice);
				updateCharacteristicFromHSData(characteristicObject);
				
			}).catch(function(err)
				{
					console.log("Error attempting to update Characteristic %s, with error %s", characteristic.displayName, characteristic.UUID, err);
				}
			);
}

					

module.exports.platform = HomeSeerPlatform;
