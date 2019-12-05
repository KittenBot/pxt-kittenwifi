# kittenwifi

Extension for Kittenbot Wifi module

## NOTICE:
Make sure you have upgrade firmware of your WiFi module to v2.82 or higher.
![image](https://user-images.githubusercontent.com/3390845/58791229-669caf80-8624-11e9-81e6-0835a1ce1727.png)

## Feature

- Control wifi access from microbit
- MQTT control, subscribe publish from microbit
- RESTFul PUT/GET request to online services, like IFTTT, thingspeak and so on
- UDP communication with other microbits in LAN

----------

# WIFI V2.8+ control protocol

## Command definition

	WF CMD Argc Callback Argv...

## Recommand Callback Mapping

	WIFI_STATUS_CHANGED = 1,
	MQTT_CONN = 2,
	MQTT_DISCON = 3,
	MQTT_PUB = 4,
	MQTT_DATA = 5,
	UDP_SETUP = 6,
	UDP_DATA = 7

## SYNC command
Sync with wifi module with wifi status change callback 

	WF 1 0 1

return

	WF 2 0 1 
	WF 3 1 1 stat // wifistatus 1: other, 5: got ip
  	WF 3 1 1 5 192.168.0.123

## Wifi Join AP
Join dedicated access point with name and pass word

	WF 52 2 52 ap pass

successful join would return wifi status 5, eg:

	WF 3 1 1 5

## change wifi module hostname
Hostname for wifi module discover or name connecte or ping, need lan support

	WF 9 1 9 name

No return

## Wifi Module IP get
Get Ip address of wifi module

	WF 8 0 22

return 

	WF 3 1 22 192.168.0.111

## Mqtt callback install
please refer callback mapping

	WF 10 4 0 2 3 4 5

## MQtt set host

	WF 15 2 15 hostname clientid  

resend mqtt callback install after this command issued

## MQtt subscribe

	WF 12 2 0 topic qos

qos set to 0 or 1 for now, other value may not be implemented

expect callback 5 when someone pub on this topic

	WF 3 2 5 /hello hello world 

## MQtt pub

	WF 11 4 11 qos retain topic data

## MQtt last will message

	WF 13 4 13 topic data 1 1

Note: this command will get mqtt offline, you should hard reset module to bring it alive

WF 3 0 5 /hello 1234567890

## UDP comm start
Target ip and port (for both tx and rx)

	WF 40 3 callback 192.168.0.2 5533 3

return

	WF 40 clientNum 0

User should keep track of clientnum in the following process
### max 4 udp instance and 4 restful instance, you can use both udp and restful in the meanwhile

## UDP Data

	WF 42 4 clientnum data

## UDP send

	WF 41 1 cliennum helloworld

## Restful set host
### the restful client num is irrelevant to udp client num

	WF 20 3 callback kittenbot.cn port(80) security(0 or 1)

return 

	WF 20 clientnum 0

## Restful request

	WF 21 2 cliennum method(GET or POST) /api/xxx? 

return, the maximum return limit to 256 bytes (64byte limit in microbit rx buffer). So, make sure you have a good api server :P

	WF 23 2 clientnum code(20x or 40x) content

----------

## License

MIT

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)

```package
kittenwifi=github:Kittenbot/pxt-kittenwifi
```
