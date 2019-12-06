'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var Characteristic = require("hap-nodejs").Characteristic;
var Service = require("hap-nodejs").Service;

var checkDefaults = require("../lib/DeviceDefaults");

var globals = require("../index.js")


var deviceInHomeSeer = function(ref)
{
	// This check has not yet been implemented!
	return true;
}

var parseBoolean = function(value)
{
	if (typeof value == "boolean") return value;
	
	if (value === 0) return false;
	if (value === 1) return true;
	
	if (typeof value == "string")
	{
		switch(value.toLowerCase())
		{
			case("1"):
			case("true"):
			{
				return true;
				break;
			}
			case("0"):
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

var alreadyUsedUUIDbase;
var usedUUIDs = [];

var alreadyUsedUUIDbase = function(uuid_base)
{
	if( usedUUIDs.indexOf(uuid_base) == -1 )
	{
		usedUUIDs.push(uuid_base);
	}
	else return true;
}
exports.alreadyUsedUUIDbase = alreadyUsedUUIDbase;

var config;
var checkConfig = function(config, allHSDevices)
{
	var error = [];
	
	try 
	{ 
		this.log(green("Checking Configuration Data"));
		// Check if the number of HomeKit Accessories to be created is greater than 100. 100 is the maximum number of
		// devices that a HomeKit bridge is allowed to support!
	
		
		for (var i in config.accessories)
		{
			// This is used for reporting changes at the close of the for loop.
			var initialData = JSON.stringify(config.accessories[i]) ;

			//	Make sure the specified HomeSeer device references are all numbers
			
			if (config.accessories[i].ref === undefined)
			{
				error =  red("config.json error for device of type: ")
					+ cyan(config.accessories[i].type)
					+ red(" missing mandatory ")
					+ cyan("'ref'")
					+ red(" property. Specified properties are: "
					+ cyan( JSON.stringify(config.accessories[i] ))) 
				throw new SyntaxError(error);
			}
			if( isNaN(config.accessories[i].ref))
			{
				error =  red("config.json error for device name: ")
					+ cyan(config.accessories[i].name)
					+ red(" ref value is not a number for ref: ") 
					+ cyan(config.accessories[i].ref);
				throw new TypeError(error);
			}
			
			// Find the HomeSeer device corresponding to the current config.accessories[i] item.
			let findRef = config.accessories[i].ref || 0;
			let deviceIndex = allHSDevices.findIndex( (element, index, array)=> {return (element.ref == findRef)} );
			if (deviceIndex != -1) 
				{ 
					var CurrentHomeSeerDevice = allHSDevices[deviceIndex] 
				}
				else
				{
					error = red("Fatal error. Device with reference: " ) + cyan(findRef) 
							+ red(" not in HomeSeer. Correct and try again")
					throw new SyntaxError(error);
				}
				
			
			// Name the unnamed!
			if (config.accessories[i].name === undefined)
			{
				config.accessories[i].name = CurrentHomeSeerDevice.location.slice(0,20) + "." + CurrentHomeSeerDevice.name;
			}
						
			// If the user has not specified a .uuid_base, create one.
			if(!config.accessories[i].uuid_base) 
				{
					config.accessories[i].uuid_base = "Ref" + config.accessories[i].ref;
				}
			
			// Make sure that each uuid_base is used only once!
			if(alreadyUsedUUIDbase(config.accessories[i].uuid_base))
			{
				error =  red("ERROR: config.json error for device name: ")
						+ cyan(config.accessories[i].name) 
						+ red(", of type: ")
						+ cyan(config.accessories[i].type)
						+ red(" Device base_uuid already used for base_uuid: ")
						+ cyan(config.accessories[i].uuid_base)
						+ red(". If you have intentionally used the same HomeSeer reference for more than one device, you need to manually set the 'uuid_base' values in config.json for these devices. Don't use the label 'Ref' followed by a number, but any other non-duplicate value should work!");

				throw new SyntaxError(error);
			}			
			
			//////////////////   Battery Checking ////////////
			
			// console.log(magenta("*Debug* - Found Batteries: " + findBattery(config.accessories[i].ref) ));
			
			var deviceBattery = findBattery(config.accessories[i].ref);
			if (deviceBattery)
			{
				if (config.accessories[i].batteryRef === undefined ||  config.accessories[i].batteryRef == null) 
				{
					this.log(yellow("Device Reference #: ") + cyan(config.accessories[i].ref)
					+ yellow(" identifies as a battery operated device, but no battery was specified. Adding a battery reference: ") + cyan(deviceBattery));
					config.accessories[i].batteryRef = deviceBattery;
				}
				else
				{
					if (config.accessories[i].batteryRef != deviceBattery) 
					{
						this.log(
								red("Wrong battery Specified for device Reference #: ") 
								+ cyan(config.accessories[i].ref)
								+ red(" You specified reference: ") 
								+ cyan(config.accessories[i].batteryRef) 
								+ red(" but correct device reference appears to be: ") 
								+ cyan(deviceBattery)
								+ red(". Fixing error."));
								
						config.accessories[i].batteryRef = deviceBattery;
					}	
				}

				if ((deviceBattery == false) && (config.accessories[i].batteryRef)  )
				{
					this.log(yellow("You specified battery reference: "+ config.accessories[i].batteryRef + " for device Reference #: " + config.accessories[i].ref 
					+ " but device does not seem to be battery operated. Check config.json file and fix if this is an error."));
				}	
			}
			
			//////////////////////////////////////////
			

			// If type is undefined, default based on Z-Wave type or if all else fails, to a lightbulb!
			if (config.accessories[i].type === undefined) 
			{
				switch(CurrentHomeSeerDevice.device_type_string)
				{
					//insteon devices
					case "Insteon Dual-Band SwitchLinc Dimmer":
					{
						config.accessories[i].type = "Lightbulb";
						config.accessories[i].uses99Percent = true;
						config.accessories[i].onValue = 100;
						break;
					}

					case "Insteon Outdoor ApplianceLinc":
					case "Insteon Dual-band Outdoor Module":
					case "Insteon Dual-Band SwitchLinc On/Off":
					{
						config.accessories[i].type = "Switch";
						config.accessories[i].onValue = 100;
						break;
					}

					case "Appliance Module":
					case "Lamp Module":
					case "Z-Wave Switch Binary":
					{
						config.accessories[i].type = "Switch";
						break;
					}
					case "Z-Wave Temperature":
					{
						config.accessories[i].type = "TemperatureSensor";
						break;
					}
					case "Z-Wave Water Leak Alarm":
					{
						config.accessories[i].type = "LeakSensor";
						break;
					}
					case "Z-Wave Door Lock":
					{
						config.accessories[i].type = "Lock";
						break;
					}					
					case "Z-Wave Switch Multilevel":
					case "Z-Wave Binary Light Switch":
					case "Z-Wave Switch Multilevel Light":
					case "Z-Wave Light Dimmer":
					default: 
					{
						config.accessories[i].type = "Lightbulb";
						break
					}
				}
				this.log(magenta("*Warning* - Device specified in config.json with undefined 'type' property. Defaulting to type " +  config.accessories[i].type
					+".\nIn future versions of HomeSeer plugin, failure to specify the device 'type' will trigger error and halt program."))
				
			}


			// Has a valid type been specified?		
			if (checkDefaults.hasValidType(config.accessories[i]) == false)
			{
				error = 	red("config.json settings error for device name: ") 
						+ 	cyan(config.accessories[i].name) 
						+ 	red(", Incorrect device type: ") + cyan(config.accessories[i].type);
				throw new SyntaxError(error);
			}
				
			// Check that the config.json entry only specifies valid properties - no typos!
			checkDefaults.hasValidProperties(config.accessories[i]); // This will throw an error if properties are incorrect!
			/*
			if( checkDefaults.hasValidProperties(config.accessories[i]) == false)
			{ 
				error = red("config.json settings error for device name: ") + cyan(config.accessories[i].name) 
								+ red(": Invalid Properties")
				throw new SyntaxError(error)
			}; */
			
			// Make sure it has its mandatory properties
			if( checkDefaults.hasMandatoryProperties(config.accessories[i]) == false)
			{ 
				error = red("config.json settings error for device name: ") + cyan(config.accessories[i].name) 
								+ red(": is missing a mandatory property.")
				throw new SyntaxError(error)
			};

			// check the remaining properties and fill in default values for any
			// that need to be there but haven't been specified.
			checkDefaults.setMissingDefaults(config.accessories[i])
			
			
			// Any Additional type-specific checking is performed here!
			switch(config.accessories[i].type)
			{
				case ("Thermostat"):
				case ("TemperatureSensor"):
				{
					// Validate that the temperatureUnit setting is "F" or "C".
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
					
					break;
				}

				case ("Window"):
				case ("WindowCovering"):
				{
					
					if(CurrentHomeSeerDevice.device_type_string == "Z-Wave Switch Binary")
						{ config.accessories[i].binarySwitch = true; }

					
					if(config.accessories[i].binarySwitch != null)
					{
						config.accessories[i].binarySwitch = parseBoolean(config.accessories[i].binarySwitch) 	
					} 
					break
				}	
				
				case ("Valve"):
				{
					if (config.accessories[i].useTimer)
					{
						checkDefaults.setMissingDefaults(config.accessories[i], "minTime");
					}
					break;
				}
				
				case ("Lightbulb"):
				case ("Fan"):
				{
					// if can_dim is undefined, set it to 'true' unless its a Z-Wave Binary Switch.
					if (config.accessories[i].can_dim === undefined)
						{
							config.accessories[i].can_dim = true; // default to true unless you know its a Z-Wave Binary Switch
							if ( CurrentHomeSeerDevice.device_type_string && ((CurrentHomeSeerDevice.device_type_string == "Z-Wave Switch Binary") || (CurrentHomeSeerDevice.device_type_string == "Z-Wave Switch") || (CurrentHomeSeerDevice.device_type_string.search("Binary") != (-1) ) ))
							{
								config.accessories[i].can_dim = false;
							}
						}
						else
						{
							config.accessories[i].can_dim = parseBoolean(config.accessories[i].can_dim)
						}
						// this.log(magenta("*Debug* for: " + config.accessories[i].name + ", can_dim = " + config.accessories[i].can_dim));
					// If its a dimmable type, then also check if it only uses the 1-99 % range (i.e., is it a Z-Wave device)
					if (config.accessories[i].can_dim == true) 
					{
						
						if ( CurrentHomeSeerDevice.device_type_string.toLowerCase().indexOf("multilevel") == (-1) )
						{
							this.log(
									magenta( "* Warning * - Check can_dim setting for device named: ") + cyan(config.accessories[i].name) 
									+ magenta(", and HomeSeer reference: ") + cyan(config.accessories[i].ref) 
									+ magenta(". HomeSeer reports model type: ") + cyan(CurrentHomeSeerDevice.device_type_string)
									+ magenta(", which typically does not provide variable level adjustment.")
									);

						}
						//Z-Wave uses a scale of 1-99 percent, so set a flag to indicate its Z-Wave
						//and use it in later code to adjust percentages.
						if(config.accessories[i].uses99Percent === undefined)
						{	
							if (CurrentHomeSeerDevice.device_type_string.toLowerCase().indexOf("z-wave") != -1) 
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
			if((config.accessories[i].batteryRef != null) && (isNaN(config.accessories[i].batteryRef)))
			{
				error =  red( "config.json error for device name: ") 
						+ cyan(config.accessories[i].name)
						+ red(" batteryRef value is not a number for associated HomeSeer ref: " )
						+ cyan(config.accessories[i].ref);
				throw new TypeError(error);
			}

			var finalData = JSON.stringify(config.accessories[i])
			initialData
			this.log("Config.json property information updated from: " + cyan(initialData) + " to: " + cyan( finalData));	
		}	

		return true;
	}
	catch(err)
	{
		throw err;
		return false;
	} 
}
exports.checkConfig = checkConfig;


var isValidUUID = function(uuid)
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
// Find Batteries

function findBattery(findRef)
{
	try
	{
		var returnValue = 0;
				
		// first find the index of the HomeSeer device having the reference findRef
		var deviceIndex = globals.allHSDevices.findIndex( (element, index, array)=> {return (element.ref == findRef)} );
		if (deviceIndex == -1) return (0);
		
		var thisDevice = globals.allHSDevices[deviceIndex]; // this is the HomeSeer data for the device being checked!
		if ((thisDevice.associated_devices == undefined) || (thisDevice.associated_devices == null) || (thisDevice.associated_devices.length == 0)) return (0);
		if ((thisDevice.device_type_string == undefined) || (thisDevice.device_type_string == null)) return (0);

		
		// The associated device should be a root device. Get it! ...
		var rootDevice = globals.allHSDevices[ globals.allHSDevices.findIndex( (element, index, array)=> {return (element.ref == thisDevice.associated_devices)} )];
		
		
		if(rootDevice.device_type_string.indexOf("Battery") != (-1)) return (rootDevice.ref);
		
		if(rootDevice.device_type_string.indexOf("Root Device") != (-1)) // if true, we found the root device. Check all its elements for a battery
		{
			// console.log(green("Found a Root Device with associated devices: " + rootDevice.associated_devices));
			
			// does the found device have associated devices?
			if (rootDevice.associated_devices != null)
			{
				for (var j in rootDevice.associated_devices)
				{
					var checkDeviceIndex = globals.allHSDevices.findIndex( (element, index, array)=> {return (element.ref == rootDevice.associated_devices[j])} )
					if (checkDeviceIndex != -1)
					{
						var candidateDevice = globals.allHSDevices[checkDeviceIndex]
						if (candidateDevice.device_type_string.indexOf("Battery") != -1)
						{
							// console.log(red("Found a Battery reference: " + candidateDevice.ref + " for device reference " + findRef));
							return (candidateDevice.ref);
						}
					}
				}
			}
		}	
		return (0);
	}
	catch(err)
	{
		console.log(yellow("Warning - Error Executing Find Battery Function for device with HomeSeer reference: " + findRef));
		console.log(yellow("Find Battery function may not function for non-Z-Wave devices. Manually specify your battery! " ));
		console.log(yellow("Error: " + err));
		return(0);
	}
}

