'use strict'
var globals = require("../index.js")
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

var exports = module.exports;

// typeProperites is an array used to check if a user has specified the correct configuration
// parameters in their config.json file. For each type, there are three sub-arrays, "Properties", "mandatory" and "setDefaults".
// The "Properties" sub-array list every valid property for a given type.
// The "mandatory" sub-array, list the names of the properties that 'must' be in config.json array by the time the function hasMandatoryProperties()
// is called. However, some of these 'mandatory' properties may have been filled-in by the "checkConfig()" function in HOmeSeerUtilities.js
// the 'setDefaults' array identifies properties for which the program will automatically set a default if it hasn't been provided by the user.
 
var typeProperties =
{
	"Switch":
	{
		Properties: 
		{
			"type": "Switch",	// Mandatory - User selected.
			"name":null,		// Automatically set to the Homeseer room name + device name if not user-specified
			"ref": 0,			// Mandatory  - User selected. Generally set to the reference # of the primary HomeSeer device for the given "type"
			"uuid_base": 0,		// Optional - Usually autoatically set to "Ref" + the reference #
			"batteryRef": 0,	// Optional. Identifies the related 'battery' device, if any. Plugin can automatically determine this for Z-Wave devices.
			"batteryThreshold": 25, // Optional - User can select the battery threshold, if desired.
			"onValue": 255,		// Optional. User RARELY needs to set this. Generally, only set if your device turns on using a value other than 255.
			"offValue": 0		// Optional. User RARELY needs to set this. Generally, only set if your device turns off using a value other than 0.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"Outlet":
	{
		Properties:  // See description of parameters for "Switch" type.
		{
			"type": "Outlet",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"onValue": 255,
			"offValue": 0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"TemperatureSensor":
	{
		Properties:  // For 'type', 'name', 'ref', 'uuid_base', 'batteryRef', 'batteryThreshold' description, See "Switch" type.
		{
			"type": "TemperatureSensor",
			"name":null,
			"ref": 0,					// Mandatory - Set to Reference of the 'main' TemperatureSensor HomeSeer device.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F",		// Optional. Temperature Unit used by HomeSeer. Choices are "F" or "C".
			"tamperRef":0				// Optional. Set to the tamper alarm device, if any.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["temperatureUnit"]
	},
	
	"CarbonMonoxideSensor":
	{
		Properties:   // For parameter descriptions, see "TemperatureSensor" type, above.
		{
			"type": "CarbonMonoxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"CarbonDioxideSensor":
	{
		Properties:      // For parameter descriptions, see "TemperatureSensor" type, above.
		{
			"type": "CarbonDioxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"ContactSensor":
	{
		Properties:      // For parameter descriptions, see "TemperatureSensor" type, above.
		{
			"type": "ContactSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"MotionSensor":     // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "MotionSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"LeakSensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "LeakSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"OccupancySensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "OccupancySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"SmokeSensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "SmokeSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"LightSensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "LightSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"HumiditySensor":   // For parameter descriptions, see "TemperatureSensor" type, above.
	{
		Properties: 
		{
			"type": "HumiditySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"Lock":
	{
		Properties: 
		{
			"type": "Lock",
			"name":null,
			"ref": 0,			// Mandatory. Main reference for the lock device.
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 33,
			"doorSensorRef":0	// Optional. Set to ref # of contact sensor indicating if door is open or closed. As of iOS 11.3, and plugion 2.3.12, doesn't do anything.
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"Fan":
	{
		Properties: 
		{
			"type": "Fan",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"can_dim": true,			// Code in HomeSeerUtilities.js will set this if it is undefined in config.json.
			"uses99Percent":true,  	   	// Code in HomeSeerUtilities.js will set this if it is undefined in config.json.
			"onValue": 255,
			"offValue": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"Lightbulb":
	{
		Properties: 
		{
			"type": "Lightbulb",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"can_dim": true,   			// Code in HomeSeerUtilities.js will set this if it is undefined in config.json.
			"uses99Percent":true,    	// Code in HomeSeerUtilities.js will set this if it is undefined in config.json.
			"onValue": 255,
			"offValue": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["onValue", "offValue"]
	},
	
	"GarageDoorOpener":
	{
		Properties: 
		{
			"type": "GarageDoorOpener",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"obstructionRef": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	"WindowCovering":
	{
		Properties: 
		{
			"type": "WindowCovering",
			"name": null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"openValue": 255,
			"closedValue": 0,
			"binarySwitch":false,   // Code in HomeSeerUtilities.js will set this if it is undefined.
			"obstructionRef":0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["openValue", "closedValue"]
	},
	
	"Thermostat":
	{
		Properties: 
		{
			"type": "Thermostat",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F",
			"controlRef": 0,
			"stateRef": 0,
			"heatingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
			"coolingSetpointRef": 0,	// Either "heatingSetpointRef" or "coolingSetpointRef" must be set (usually both are!)
			"autoSwitchover": true,
			"humidityRef": 0,			// optional
			"humidityTargetRef": 0		// optional
		},
		mandatory: ["type", "name", "ref", "uuid_base", "controlRef", "stateRef"],
		
		setDefaults:["temperatureUnit", "autoSwitchover"]
	},
	
	"SecuritySystem":
	{
		Properties: 
		{
			"type": "SecuritySystem",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			
			"armStayValue": 0,
			"armAwayValue": 1,
			"armNightValue": 2,
			"disarmValue": 3,
			
			"armedStayValues": [0],
			"armedAwayValues": [1],
			"armedNightValues": [2],
			"disarmedValues": [3],
			"alarmValues": [4]
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[	"armStayValue",
						"armAwayValue",
						"armNightValue",
						"disarmValue",
						"armedAwayValues",
						"armedStayValues",
						"armedNightValues",
						"disarmedValues",
						"alarmValues"
					]
	},
	
	"Valve":
	{
		Properties: 
		{
			"type": "Valve",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"valveType": 0,
			"openValve": 255,
			"closeValve": 0,
			"useTimer": false,
			"minTime": 30
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[	"valveType", "openValve", "closeValve",	"useTimer" ]
	}
}

module.exports.typeProperties = typeProperties

/////////////////////////////////////////////////////////////

var hasValidType = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;

	return ( typeProperties.hasOwnProperty(configItem.type))
}
module.exports.hasValidType = hasValidType


/////////////////////////////////////////////////////////////


var hasValidProperties = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;
	if( (typeProperties[configItem.type] === undefined) || (typeProperties[configItem.type] == null) ) return false;

	var validPropertiesList = typeProperties[configItem.type].Properties;

	for (var property in configItem)
	{
		if (validPropertiesList.hasOwnProperty(property) == false) 
			{ 
				var error = red("\nconfig.json error: property: ") +cyan(property) 
					+ red(" is not a valid property for item named: " ) + cyan(configItem.name) 
					+ red(" of type: ") + cyan(configItem.type)
					+ red(". \nValid Properties for this type are: ")
					+ cyan (Object.getOwnPropertyNames(typeProperties[configItem.type].Properties) +"." )	
					
				throw new SyntaxError(error);
				return false; 
			}
	}
	return true;
}

module.exports.hasValidProperties = hasValidProperties

/////////////////////////////////////////////////////////////

var setMissingDefaults = function(configItem, property)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;
	if( (typeProperties[configItem.type] === undefined) || (typeProperties[configItem.type] == null) ) return false;
	
	// If function variable 'property' is undefined, then set all the default listed in the type's setDefaults array.
	// Else, just set the default for the specific property that was specified.
	if (property === undefined) // check all defaults in the setDefaults list unless a specific property was identified.
	{	
		var defaultsList = typeProperties[configItem.type].setDefaults;

		for (var thisDefault in defaultsList)
		{
			var key = defaultsList[thisDefault]
			
			if (configItem[key] === undefined)
			{
				console.log("Item type: %s, named: %s :Adding property %s with value: %s", cyan(configItem.type), cyan(configItem.name), cyan(defaultsList[thisDefault]), cyan(typeProperties[configItem.type].Properties[ key ]));
				configItem[key] = typeProperties[configItem.type].Properties[ key ];
			}
		}
		
		// Set a battery threshold if the batteryRef is defined but the threshold isn't.
		if ((configItem.batteryRef != undefined) && (configItem.batteryThreshold === undefined) )
		{
			configItem.batteryThreshold = typeProperties[configItem.type].Properties["batteryThreshold"];
		}
		return true;
	}
	else // If a specific 'property' was named in the function call, just set its' default value.
	{
		if( typeProperties[configItem.type].Properties[property] != undefined)
		{
			if (configItem[property] === undefined)
			{
			configItem[property] = typeProperties[configItem.type].Properties[property];
			return true;
			}
		}
	}
	return false;
}

module.exports.setMissingDefaults = setMissingDefaults


/////////////////////////////////////////////////////////////

var hasMandatoryProperties = function(configItem)
{
	if( (configItem.type === undefined) || (configItem.type == null)) return false;
	if( (typeProperties[configItem.type] === undefined) || (typeProperties[configItem.type] == null) ) return false;
	
		var mandatory = typeProperties[configItem.type].mandatory;

		for (var index in mandatory)
		{
			var key = mandatory[index]
			
			if (configItem[key] === undefined)
			{
				console.log("Item named %s of type %s is missing its mandatory property: %s", cyan(configItem.name), cyan(configItem.type), cyan(key));
				return false;
			}
		}
		return true;

	return false;
}

module.exports.hasMandatoryProperties = hasMandatoryProperties





