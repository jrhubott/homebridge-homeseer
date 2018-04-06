var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

var exports = module.exports;

var typeProperties =
[
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
	
	{
		Properties: 
		{
			"type": "TemperatureSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25,
			"temperatureUnit":"F"
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:["temperatureUnit"]
	},
	
	{
		Properties: 
		{
			"type": "CarbonMonoxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "CarbonDioxideSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "ContactSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "MotionSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "LeakSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "OccupancySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "SmokeSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "LightSensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
	{
		Properties: 
		{
			"type": "HumiditySensor",
			"name":null,
			"ref": 0,
			"uuid_base": 0,
			"batteryRef": 0,
			"batteryThreshold": 25
		},
		
		mandatory: ["type", "name", "ref", "uuid_base"],
		
		setDefaults:[]
	},
	
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
		
		setDefaults:[	"valveType",
						"openValve",
						"closeValve",
						"useTimer"
					]
	}
]

module.exports.typeProperties = typeProperties

/////////////////////////////////////////////////////////////

var hasValidType = function(configItem)
{
	if(configItem.type === undefined || configItem.type == null) return false;

	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )
	if (index != (-1)) { return true } else { return false};
}
module.exports.hasValidType = hasValidType


/////////////////////////////////////////////////////////////

var hasValidProperties = function(configItem)
{
	if(configItem.type === undefined || configItem.type == null) return false;

	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )

	if (index == (-1)) return false;
	var validPropertiesList = typeProperties[index].Properties;

	for (var property in configItem)
	{
		if (validPropertiesList.hasOwnProperty(property) == false) { return false; }
	}
	return true;
}

module.exports.hasValidProperties = hasValidProperties

/////////////////////////////////////////////////////////////

var setMissingDefaults = function(configItem, property)
{
	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )

	if (index == (-1)) return false;
	
	// If function variable 'property' is undefined, then set all the default listed in the type's setDefaults array.
	// Else, just set the default for the specific property that was specified.
	if (property === undefined) // check all defaults in the setDefaults list unless a specific property was identified.
	{	
		var defaultsList = typeProperties[index].setDefaults;

		for (var thisDefault in defaultsList)
		{
			var key = defaultsList[thisDefault]
			
			if (configItem[key] === undefined)
			{
				console.log("Item type: %s, named: %s :Adding property %s with value: %s", cyan(configItem.type), cyan(configItem.name), cyan(defaultsList[thisDefault]), cyan(typeProperties[index].Properties[ key ]));
				configItem[key] = typeProperties[index].Properties[ key ];
			}
		}
		
		// Set a battery threshold if the batteryRef is defined but the threshold isn't.
		if ((configItem.batteryRef != undefined) && (configItem.batteryThreshold === undefined) )
		{
			configItem.batteryThreshold = typeProperties[index].Properties["batteryThreshold"];
		}
		return true;
	}
	else // If a specific 'property' was named in the function call, just set its' default value.
	{
		if( typeProperties[index].Properties[property] != undefined)
		{
			if (configItem[property] === undefined)
			{
			configItem[property] = typeProperties[index].Properties[property];
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
	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )

	if (index == (-1)) return false;
	
		var mandatory = typeProperties[index].mandatory;

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
