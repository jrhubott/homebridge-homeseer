
// Still under development!!
var exports = module.exports;
var chalk = require("chalk");
var Characteristic = require("hap-nodejs").Characteristic;
var Service = require("hap-nodejs").Service;

exports.isWritableUUID = function(uuid)
{
console.log(chalk.red.bold("** Programming Error ** - called function that is not implemented"));
}

deviceInHomeSeer = function(ref)
{
	// This check has not yet been implemented!
	return true;
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
checkConfig = function(config)
{
	var error = [];
	
	try 
	{ 
		this.log(chalk.green.bold("Checking Configuration Data"));
		// Check if the number of HomeKit Accessories to be created is greater than 100. 100 is the maximum number of
		// devices that a HomeKit bridge is allowed to support!
		var numEvents = 0;
		var numAccessories = 0;
		if (config.accessories) numAccessories = config.accessories.length;
		if (config.events) numEvents = config.events.length;
		if ((numEvents + numAccessories) > 100)
		{
			error = chalk.bold.red("Too many accessories and events in config.json file. Bridge maximum is 100. You have specified: " + (config.accessories.length + config.events.length));
			throw new SyntaxError(error);
		}
		
		// Check that the device "type" field in the config.json file is one of the allowed types.
		
		for (var i in config.accessories)
		{
			this.log("Checking configuration for item type: %s,   name: %s. ", config.accessories[i].type, config.accessories[i].name);
			if((config.accessories[i].type) && (!supportedType(config.accessories[i].type)) )
			{
				error =  chalk.red.bold(
					"config.json settings error for device name: " + config.accessories[i].name 
					+" Incorrect device type: " + config.accessories[i].type);
				throw new SyntaxError(error);
			}
		
		//	Make sure the specified HomeSeer device references are all numbers
			if(isNaN(config.accessories[i].ref))
			{
				error =  chalk.red.bold(
					"config.json error for device name: " + config.accessories[i].name 
					+ " ref value is not a number for ref: " 
					+ config.accessories[i].ref);
				throw new SyntaxError(error);
			}
					//	Make sure the specified HomeSeer device references are all numbers
			if((config.accessories[i].batteryRef != null) && (isNaN(config.accessories[i].batteryRef)))
			{
				error =  chalk.red.bold(
					"config.json error for device name: " + config.accessories[i].name 
					+ " batteryRef value is not a number for associated HomeSeer ref: " 
					+ config.accessories[i].ref);
				throw new SyntaxError(error);
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
				error =  chalk.red.bold(
						"config.json error for device name: " + config.accessories[i].name 
						+ " Device base_uuid already used for base_uuid: " 
						+ config.accessories[i].uuid_base);

				throw new SyntaxError(error);
			}
			if((config.accessories[i].can_dim != null) && (typeof(config.accessories[i].can_dim) == "string"))
			{
				switch(config.accessories[i].can_dim.toLowerCase())
				{
					case("0"):
					case("true"):
					{
						config.accessories[i].can_dim = true;
						break;
					}
					case("1"):
					case("false"):
					{
						config.accessories[i].can_dim = false;
						break;
					}
					default:
					{
						var error = chalk.red.bold('HomeBridge config.json file error - Incorrect can_dim setting. Must be one of "true" or "false" You have setting of: "' 
								+ config.accessories[i].can_dim + '" for device with name ' + config.accessories[i].name
								+', and HomeSeer reference of: ' + config.accessories[i].ref)
						throw new SyntaxError(error);
					}
				} 
			} 
		}		
		return true;
	 }
	catch(err)
	{
			this.log(chalk.bold.red("--------------------------------------------------------------------------------"));
			this.log(chalk.bold.red("** Format error in your config.json file. Fix it to continue."));
			this.log(chalk.bold.red(err));
			this.log(chalk.bold.red("--------------------------------------------------------------------------------"));
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

