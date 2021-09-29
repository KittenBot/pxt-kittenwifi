// tests go here; this will not be compiled when this package is used as a library
kittenwifi.on_wifi_connected(function () {
    basic.showIcon(IconNames.Yes)
})
input.onButtonPressed(Button.A, function () {
    kittenwifi.mqtt_sethost("iot.kittenbot.cn", "node01")
})
input.onButtonPressed(Button.AB, function () {
    kittenwifi.mqtt_publish_basic("/topicName", "message")
})
input.onButtonPressed(Button.B, function () {
    kittenwifi.mqtt_subscribe_basic("/topicName")
})
kittenwifi.on_mqtt_topic_data(function (topic, data) {
    basic.showString("" + topic + ":" + data)
})
kittenwifi.wifi_init(SerialPin.P2, SerialPin.P12)
kittenwifi.wifi_join("rrouter", "password")
