var exports = module.exports;

module.exports.typeProperties =
[
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
	{
		"type": "TemperatureSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25,
		"temperatureUnit":"F"
	},
	{
		"type": "CarbonMonoxideSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "CarbonDioxideSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "ContactSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "MotionSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "LeakSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "OccupancySensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "SmokeSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "LightSensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "HumiditySensor",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25
	},
	{
		"type": "Lock",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25,
		"doorSensorRef":0
	},
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
	{
		"type": "GarageDoorOpener",
		"name":null,
		"ref": 0,
		"uuid_base": 0,
		"batteryRef": 0,
		"batteryThreshold": 25,
		"obstructionRef": 0

	},
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
	}
]
