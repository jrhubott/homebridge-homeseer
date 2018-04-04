var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var Characteristic = require("hap-nodejs").Characteristic;
var Service = require("hap-nodejs").Service;

var Defaults = require("../lib/DeviceDefaults");
console.log(magenta("*Debug* Defaults: " + JSON.stringify(Defaults.typeProperties) ));


exports.isWritableUUID = function(uuid)
{
console.log(red("** Programming Error ** - called function that is not implemented"));
}

deviceInHomeSeer = function(ref)
{
	// This check has not yet been implemented!
	return true;
}

parseBoolean = function(value)
{
	if (typeof value == "boolean") return value;
	
	if (value === 0) return false;
	if (value === 1) return true;
	
	if (typeof value == "string")
	{
		switch(value.toLowerCase())
		{
			case("0"):
			case("true"):
			{
				return true;
				break;
			}
			case("1"):
			case("false"):
			{
				return false;
				break;
			}
			default:
			{
				var error = red("Boolean true/false expected but value: ") + cyan(value) + red(" Is not a Valid boolean")
				throw new TypeError(error);
			}
		} 
	}
}

supportedType = function(type)
{
	switch(type)
	{
		case "Switch":
		case "Outlet":
		case "TemperatureSensor":
		case "CarbonMonoxideSensor":
		case "CarbonDioxideSensor":
		case "ContactSensor":
		case "MotionSensor":
		case "LeakSensor":
		case "OccupancySensor":
		case "SmokeSensor":
		case "LightSensor": 
		case "HumiditySensor": 
		case "Lock":
		case "Fan":
		case "Lightbulb": 
		case "GarageDoorOpener":
		case "WindowCovering":
		case "Thermostat":
		case "SecuritySystem":
		case "Valve":
		{
			return true;
			break;
		}
		default:
		{
			return false;
			break
		}
	}
}
exports.supportedType = supportedType;

isValidProperty = function (property)
{
	switch(property)
	{
		case "type":
		case "ref":
		case "name":
		case "uuid_base":
		case "controlRef":
		case "stateRef":
		// case "setPointRef":
		case "temperatureUnit":
		case "batteryRef":
		case "obstructionRef":
		case "onValue":
		case "offValue":
		case "can_dim":
		case "eventGroup":
		case "eventName":
		case "offEventGroup":
		case "offEventName":
		case "temperatureUnit":
		case "batteryThreshold":
		case "uses99Percent":
		case "humidityRef":
		case "humidityTargetRef":
		case "armStayValue":
		case "armAwayValue":
		case "armNightValue":
		case "disarmValue":
		case "armedAwayValues":
		case "armedStayValues":
		case "armedNightValues":
		case "disarmedValues":
		case "alarmValue":
		case "alarmValues":
		case "openValue":	// to open a Window Covering
		case "closedValue": // To close a Window Covering
		case "binarySwitch":
		case "openValve": // HomeSeer value to open valve
		case "closeValve": // HomeSeer value to close valve
		case "useTimer": // Use Valve Timers
		case "heatingSetpointRef":
		case "coolingSetpointRef":
		case "autoSwitchover":		// Binary - Does thermostat support auto-switchover?
		case "valveType":
		case "doorSensorRef":
		case "minTime":
							
		{
			return true;
			break;
		}
		case "onValues":
		case "stateOffValues":
		case "stateHeatValues":
		case "stateCoolValues":
		case "stateAutoValues":
		case "controlOffValue":
		case "controlHeatValue":
		case "controlCoolValue":
		case "controlAutoValue":
		{
			error =  chalk.magenta.bold(
					"* Warning * - config.json parameter error for device name: \"" + config.accessories[i].name
					+ "\", config.json parameter: \"" + thisItem[property] + "\" is not a valid parameter in Accessory entry number: " + (i+1)
					+ ". This parameter was used in 'old' plugin, but is no longer used and is ignored." );
				console.log(error);
				
				return true;
				break;

		}
		default:
		{
				error =  chalk.magenta.bold(
					"* Warning * - config.json parameter error for device name: \"" + config.accessories[i].name 
					+ "\", config.json parameter: \"" + thisItem[property] + "\" is not a valid parameter in Accessory entry number: " + (i+1));
				throw new SyntaxError(error);	
		}
	}
}



var alreadyUsedUUIDbase;
var usedUUIDs = [];
alreadyUsedUUIDbase = function(uuid_base)
{
	if( usedUUIDs.indexOf(uuid_base) == -1 )
	{
		usedUUIDs.push(uuid_base);
	}
	else return true;
}
exports.alreadyUsedUUIDbase = alreadyUsedUUIDbase;

var config;
checkConfig = function(config, allHSDevices)
{
	var error = [];
	
	try 
	{ 
		this.log(green("Checking Configuration Data"));
		// Check if the number of HomeKit Accessories to be created is greater than 100. 100 is the maximum number of
		// devices that a HomeKit bridge is allowed to support!
		var numEvents = 0;
		var numAccessories = 0;
		if (config.accessories) numAccessories = config.accessories.length;
		if (config.events) numEvents = config.events.length;
		if ((numEvents + numAccessories) > 100)
		{
			error = bold("Too many accessories and events in config.json file. Bridge maximum is 100. You have specified: " + (config.accessories.length + config.events.length));
			throw new SyntaxError(error);
		}
		
		// Check that the device "type" field in the config.json file is one of the allowed types.
		
		for (var i in config.accessories)
		{
			
			// Find the HomeSeer device corresponding to the current config.accessories item.
			let findRef = config.accessories[i].ref || 0;
			let deviceIndex = allHSDevices.findIndex( (element, index, array)=> {return (element.ref == findRef)} );
			if (deviceIndex != -1) 
				{ 
					var CurrentHomeSeerDevice = allHSDevices[deviceIndex] 
				}
			
			// Name the unnamed!
			if (config.accessories[i].name === undefined)
			{
				config.accessories[i].name = CurrentHomeSeerDevice.name;
			}
			
			this.log(green("Checking config.json configuration data for accessory named: ") + cyan(config.accessories[i].name)
					+ green(", with initial data: ") + cyan(JSON.stringify(config.accessories[i]) ));
					
			if (Defaults.hasValidType(config.accessories[i]))
			{
				console.log(green("The accessory has a valid type"));
			}
			else
			{
				error =  chalk.red.bold(
					"config.json settings error for device name: " + config.accessories[i].name 
					+" Incorrect device type: " + config.accessories[i].type);
				throw new SyntaxError(error);
			}
				
			
/*			
			if((config.accessories[i].type) && (!supportedType(config.accessories[i].type)) )
			{
				error =  chalk.red.bold(
					"config.json settings error for device name: " + config.accessories[i].name 
					+" Incorrect device type: " + config.accessories[i].type);
				throw new SyntaxError(error);
			}
*/			

			// Check that the config.json entry only specifies valid properties - no typos!
			// This could be further improved by also checking based on the "type" of the item to make sure
			// user has specified proper parameters for a given type.
			var thisItem = Object.getOwnPropertyNames(config.accessories[i]);
			for(var property in thisItem)
			{
			// console.log(chalk.magenta.bold("Type of thisItem: " + typeof thisItem + ", with property: " + thisItem[property] + " of type " + typeof thisItem[property]));
			isValidProperty(thisItem[property]);
			}
			
			
			// Any type-specific checking is performed here!
			
			switch(config.accessories[i].type)
			{
				case ("Thermostat"):
				case ("TemperatureSensor"):
				{
					// If not defined, make it Fahrenheit
					if((config.accessories[i].temperatureUnit === undefined) || (config.accessories[i].temperatureUnit == null))
					{
						config.accessories[i].temperatureUnit = "F";
					}
					else
					{
						config.accessories[i].temperatureUnit = config.accessories[i].temperatureUnit.toUpperCase();
						switch (config.accessories[i].temperatureUnit)
						{
							case "C":
							case "F":
							{
								break;
							}
							default:
							{
							var error =   red("HomeBridge config.json file error - ")
										+ cyan("Incorrect temperatureUnit setting.")
										+ red('Must be one of "C" or "F" You have setting of: "')
										+ cyan(config.accessories[i].temperatureUnit) 
										+ red('" for device with name ') 
										+ cyan(config.accessories[i].name)
										+ red(", and HomeSeer reference of: ") 
										+ cyan(config.accessories[i].ref)
								throw new SyntaxError(error);
							}
						}
					}
					break;
				}

				case ("SecuritySystem"):
				{
					config.accessories[i].armStayValue 		= 	(config.accessories[i].armStayValue	 === undefined)	? 0 : (config.accessories[i].armStayValue);
					config.accessories[i].armAwayValue 		=  	(config.accessories[i].armAwayValue	 === undefined)	? 1 : (config.accessories[i].armAwayValue);
					config.accessories[i].armNightValue 	= 	(config.accessories[i].armNightValue === undefined)	? 2 : (config.accessories[i].armNightValue);
					config.accessories[i].disarmValue 		= 	(config.accessories[i].disarmValue	 === undefined)	? 3 : (config.accessories[i].disarmValue);
					config.accessories[i].alarmValue 		= 	(config.accessories[i].alarmValue	 === undefined)	? 4 : (config.accessories[i].alarmValue);

					config.accessories[i].armedStayValues 	= 	(config.accessories[i].armedStayValues 	=== undefined) 	? [config.accessories[i].armStayValue]  : (config.accessories[i].armedStayValues);
					config.accessories[i].armedAwayValues 	= 	(config.accessories[i].armedAwayValues 	=== undefined) 	? [config.accessories[i].armAwayValue]  : (config.accessories[i].armedAwayValues);
					config.accessories[i].armedNightValues 	= 	(config.accessories[i].armedNightValues === undefined)	? [config.accessories[i].armNightValue] : (config.accessories[i].armedNightValues);
					config.accessories[i].disarmedValues 	= 	(config.accessories[i].disarmedValues 	=== undefined)  ? [config.accessories[i].disarmValue]   : (config.accessories[i].disarmedValues);
					config.accessories[i].alarmValues 		= 	(config.accessories[i].alarmValues 		=== undefined) 	? [config.accessories[i].alarmValue]    : (config.accessories[i].alarmValues);
					break;
				}
				
				case ("WindowCovering"):
				{
					config.accessories[i].openValue 		= 	(config.accessories[i].openValue === undefined) 	? 255 	: config.accessories[i].openValue;
					config.accessories[i].closedValue 		=  	(config.accessories[i].closedValue === undefined) 	? 0 	: config.accessories[i].closedValue;
					config.accessories[i].binarySwitch		=  	(config.accessories[i].binarySwitch === undefined) 	? false	: config.accessories[i].binarySwitch;

					if(config.accessories[i].device_type_string == "Z-Wave Switch Binary")
						{ config.accessories[i].binarySwitch = true; }
					else 
						{ config.accessories[i].binarySwitch = false; };

					if(config.accessories[i].binarySwitch != null)
					{
						config.accessories[i].binarySwitch = parseBoolean(config.accessories[i].binarySwitch) 	
					} 
					
					break
				}	
				case ("Valve"):
				{
					config.accessories[i].openValve 		= 	(config.accessories[i].openValve === undefined) 	? 255 	: config.accessories[i].openValve;
					config.accessories[i].closeValve 		=  	(config.accessories[i].closeValve === undefined) 	? 0 	: config.accessories[i].closeValve;
					config.accessories[i].valveType			=  	(config.accessories[i].valveType === undefined) 	? 0 	: config.accessories[i].valveType;
					config.accessories[i].minTime			=  	(config.accessories[i].minTime === undefined) 		? 30 	: config.accessories[i].minTime;
					config.accessories[i].useTimer			=  	(config.accessories[i].useTimer === undefined) 		? false : config.accessories[i].useTimer;
					break;
				}
				case ("Switch"):
				case ("Outlet"):
				{
					config.accessories[i].onValue 		= 	(config.accessories[i].onValue === undefined) 	? 255 	: config.accessories[i].onValue;
					config.accessories[i].offValue 		= 	(config.accessories[i].offValue === undefined) 	? 0 	: config.accessories[i].offValue;

					break;
				}
				
				case ("Lightbulb"):
				case ("Fan"):
				{
					// console.log(cyan("*Debugging: Entering Lightbulb / Fan case"));

					config.accessories[i].onValue 		= 	(config.accessories[i].onValue === undefined) 	? 255 	: config.accessories[i].onValue;
					config.accessories[i].offValue 		= 	(config.accessories[i].offValue === undefined) 	? 0 	: config.accessories[i].offValue;
					
					// if can_dim is undefined, set it to 'true' unless its a Z-Wave Binary Switch.
					if (config.accessories[i].can_dim === undefined)
						{
							config.accessories[i].can_dim = true; // default to true unless you know its a Z-Wave Binary Switch
							if ( CurrentHomeSeerDevice.device_type_string && (CurrentHomeSeerDevice.device_type_string == "Z-Wave Switch Binary"))
							{
								config.accessories[i].can_dim = false;
							}
						}
						else
						{
							config.accessories[i].can_dim = parseBoolean(config.accessories[i].can_dim)
						}
					// If its a dimmable type, then also check if it only uses the 1-99 % range (i.e., is it a Z-Wave device)
					if (config.accessories[i].can_dim == true) 
					{
						
						if ( (CurrentHomeSeerDevice.device_type_string.indexOf("Z-Wave") != -1) && (CurrentHomeSeerDevice.device_type_string != "Z-Wave Switch Multilevel"))
						{
							console.log(chalk.magenta.bold("* Warning * - Check can_dim setting for device named: " + config.accessories[i].name + ", and HomeSeer reference: " + config.accessories[i].ref ));
							console.log(chalk.magenta.bold("HomeSeer reports model type: " + CurrentHomeSeerDevice.device_type_string + ", which typically does not provide variable level adjustment."));
						}
						//Z-Wave uses a scale of 1-99 percent, so set a flag to indicate its Z-Wave
						//and use it in later code to adjust percentages.
						if(config.accessories[i].uses99Percent === undefined)
						{	
							if (CurrentHomeSeerDevice.device_type_string.indexOf("Z-Wave") != -1) 
							{
								config.accessories[i].uses99Percent = true;
							}	
							else config.accessories[i].uses99Percent = false;
						}
					}
					break;
				}	// End bulb / fan case	

			} // end switch.
			
			
			//	Make sure the specified HomeSeer device references are all numbers
			if(isNaN(config.accessories[i].ref))
			{
				error =  chalk.red.bold(
					"config.json error for device name: " + config.accessories[i].name 
					+ " ref value is not a number for ref: " 
					+ config.accessories[i].ref);
				throw new TypeError(error);
			}
					//	Make sure the specified HomeSeer device references are all numbers
			if((config.accessories[i].batteryRef != null) && (isNaN(config.accessories[i].batteryRef)))
			{
				error =  chalk.red.bold(
					"config.json error for device name: " + config.accessories[i].name 
					+ " batteryRef value is not a number for associated HomeSeer ref: " 
					+ config.accessories[i].ref);
				throw new TypeError(error);
			}
			// Next line is currently not implemented. 
			// deviceInHomeSeer function test always returns "true"	
			if(!deviceInHomeSeer(config.accessories[i].ref))
			{
				error =  chalk.red.bold(
					"config.json error for device name: " + config.accessories[i].name 
					+ " Device reference not found in HomeSeer. Reference: " 
					+ config.accessories[i].ref);
				throw new SyntaxError(error);
			}

			// If the user has not specified a .uuid_base, create one.
			if(!config.accessories[i].uuid_base) 
				{
					config.accessories[i].uuid_base = "Ref" + config.accessories[i].ref;
				}
			
			// Make sure that each uuid_base is used only once!
			if(alreadyUsedUUIDbase(config.accessories[i].uuid_base))
			{
				error =  red(
						"config.json error for device name: " + config.accessories[i].name 
						+ " Device base_uuid already used for base_uuid: " 
						+ config.accessories[i].uuid_base);

				throw new SyntaxError(error);
			}


			

			
			this.log(magenta("Checked config.json entry for accessory entry: ") + cyan(i+1) + magenta(" is: \n\t") + cyan(JSON.stringify(config.accessories[i]) ));	
		}	

		return true;
	}
	catch(err)
	{
			this.log(red("--------------------------------------------------------------------------------"));
			this.log(red("** Format error in your config.json file. Fix it to continue."));
			this.log(red(err));
			this.log(red("--------------------------------------------------------------------------------"));
		throw err;
		return false;
	} 
}
exports.checkConfig = checkConfig;


isValidUUID = function(uuid)
{
	switch(uuid)
	{
		// UUIDs for Services
		case( Service.AccessoryInformation.UUID ):  
		case( Service.AirPurifier.UUID ):  
		case( Service.AirQualitySensor.UUID ):  
		case( Service.BatterycaseService.UUID ):  
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

		// UUIDs for Characteristics
		case( Characteristic.Active.UUID ):  
		case( Characteristic.AdministratorOnlyAccess.UUID ):  
		case( Characteristic.AirParticulateDensity.UUID ):  
		case( Characteristic.AirParticulateSize.UUID ):  
		case( Characteristic.AirQuality.UUID ):  
		case( Characteristic.AudioFeedback.UUID ):  
		case( Characteristic.BatteryLevel.UUID ):  
		case( Characteristic.Brightness.UUID ):  
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
		case( Characteristic.CurrentTemperature.UUID ):  
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
		case( Characteristic.OccupancyDetected.UUID ):  
		case( Characteristic.On.UUID ):  
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
		{
			return true;
		}
		default:
		{
			return false;
		}

	} // endswitch
} // end isValidUUID
exports.isValidUUID = isValidUUID;

