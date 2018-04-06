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
// parameters in their config.json file.
var typeProperties =
{
	"Switch":
	{
		Properties: 
		{
			"type": "Switch",
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
	
	"Outlet":
	{
		Properties: 
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
		Properties: 
		{
			"type": "TemperatureSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F",
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:["temperatureUnit"]
	},
	
	"CarbonMonoxideSensor":
	{
		Properties: 
		{
			"type": "CarbonMonoxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"CarbonDioxideSensor":
	{
		Properties: 
		{
			"type": "CarbonDioxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"ContactSensor":
	{
		Properties: 
		{
			"type": "ContactSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"tamperRef":0
		},
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"MotionSensor":
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
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"LeakSensor":
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
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"OccupancySensor":
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
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"SmokeSensor":
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
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"LightSensor":
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
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"HumiditySensor":
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
		
		mandatory: ["type", "name", "ref", "uuid_base", "tamperRef"],
		
		setDefaults:[]
	},
	
	"Lock":
	{
		Properties: 
		{
			"type": "Lock",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 33,
			"doorSensorRef":0
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
			"binarySwitch":false   // Code in HomeSeerUtilities.js will set this if it is undefined.
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





