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
		setDefaults:[]
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
			"batteryThreshold": 25,
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
			"can_dim": true,
			"uses99Percent":true,
			"onValue": 255,
			"offValue": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["onValue", "offValue", "can_dim", "uses99Percent"]
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
			"can_dim": true,
			"uses99Percent":true,
			"onValue": 255,
			"offValue": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["onValue", "offValue", "can_dim", "uses99Percent"]
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
			"binarySwitch":false
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
		setDefaults:["openValue", "closedValue", "binarySwitch"]
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
			"heatingSetpointRef": 0,
			"coolingSetpointRef": 0,
			"autoSwitchover": true,
			"humidityRef": 0,
			"humidityTargetRef": 0
		},
		mandatory: ["type", "name", "ref", "uuid_base"],
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
			"armedAwayValues": 4,
			"armedStayValues": 0,
			"armedNightValues": 1,
			"disarmedValues": 2,
			"alarmValue": 3,
			"alarmValues": 4
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
						"alarmValue",
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

var hasValidType = function(configItem)
{
	if(configItem.type === undefined || configItem.type == null) return false;

	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )
	if (index != (-1)) { return true } else { return false};
}
module.exports.hasValidType = hasValidType

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



var setMissingDefaults = function(configItem, property)
{
	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )

	if (index == (-1)) return false;
	
	if (property === undefined) // check all defaults in the setDefaults list unless a specific property was identified.
	{	
		var defaultsList = typeProperties[index].setDefaults;

		for (var thisDefault in defaultsList)
		{
			var key = defaultsList[thisDefault]
			
			if (configItem[key] === undefined)
			{
				console.log("Item %s is missing its property %s setting it to value: %s", configItem.type, defaultsList[thisDefault], typeProperties[index].Properties[ key ]);
				configItem[key] = typeProperties[index].Properties[ key ];
			}
		}
		return true;
	}
	else
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




var checkMandatoryProperties = function(configItem)
{
	var index = typeProperties.findIndex( (element, index, array) => { return(configItem.type == element.Properties.type)} )

	if (index == (-1)) return false;
	
		var mandatory = typeProperties[index].mandatory;

		for (var index in mandatory)
		{
			var key = mandatory[index]
			
			if (configItem[key] === undefined)
			{
				console.log("Item named %s of type %s is missing its mandatory property: %s", configItem.name, configItem.type, key);
				return false;
			}
		}
		return true;

	return false;
}

module.exports.checkMandatoryProperties = checkMandatoryProperties
