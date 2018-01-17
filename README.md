[![npm version](https://badge.fury.io/js/homebridge-homeseer-plugin-2018.svg)](https://badge.fury.io/js/homebridge-homeseer-plugin-2018)

# homebridge-homeseer-plugin


Plugin for the [homebridge](https://github.com/nfarina/homebridge) Apple iOS Homekit support application to support integration with the [Homeseer V3](http://www.homeseer.com/home-control-software.html) software

Based on and includes code from [hap-nodejs](https://github.com/KhaosT/HAP-NodeJS) and [homebridge-legacy-plugins](https://github.com/nfarina/homebridge-legacy-plugins) and [homebridge-homeseer-plugin](https://github.com/jrhubott/homebridge-homeseer).

Note: This package is a update to the 1.0.17 version of the jrhubott/homebridge-homeseer plugin. This update adds additional battery level indication information for locks and sensor devices and provides for both a % of battery and low battery status information display on the Home Application. Updates have been posted as a Pull Request to jrhubott/homebridge-homeseer. In the event these changes are accepted into the original jrhubott package, this repository will be removed or an out-of-date status indicated.


# Installation
Linux (Ubuntu/Debian based)

1. `sudo npm install homebridge -g`
2. `sudo npm install -g homebridge-homeseer-plugin-2018`

Windows

1. Follow [these](http://board.homeseer.com/showpost.php?p=1204012&postcount=250) instructions for homebridge Installation
2. Run `npm install homebridge-homeseer-plugin` from the homebridge-homeseer directory

# Usage
## Platform options

```js
"platform": "HomeSeer",             // Required
"name": "HomeSeer",                 // Required
"host": "http://yourserver",        // Required - If you did setup HomeSeer authentication, use "http://user:password@ip_address:port"
"poll" : 60                         // Optional - Default polling rate in seconds to check for changed device status
```

## All Accessories options
```js
"ref":8,                            // Required - HomeSeer Device Reference (To get it, select the HS Device - then Advanced Tab)
"type":"Lightbulb",                 // Optional - Lightbulb is the default
"name":"My Light",                  // Optional - HomeSeer device name is the default
"uuid_base":"SomeUniqueId2"         // Optional - HomeKit identifier will be derived from this parameter instead of the name. You SHOULD add this parameter to all accessories !
"poll" : 60,                        // Optional - Override default polling rate in seconds to check for changed device status
"statusUpdateCount" : 10            // Optional - Override the number of times that the device is checked for a status change after its value is updated. Checks occur every 1 second.
```
See [index.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/index.js) for full configuration information or [config.js](https://raw.githubusercontent.com/jrhubott/homebridge-homeseer/master/config/config.json) for sample configuration


#Credit
The original HomeBridge plugin that this was based on was done by Jean-Michel Joudrier and posted to the [Homeseer forums](http://board.homeseer.com/showthread.php?t=177016).

If you want to support me (does not equal development): <br>

<a href="https://www.paypal.me/rhusoft/3" target=blank><img src=http://imgur.com/gnvlm6n.jpg alt="Buy Me a Beer" height=75 width=150 align='center'></a>
