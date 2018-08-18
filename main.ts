/*
Riven
load dependency
"kittenwifi": "file:../pxt-kittenwifi"
*/


//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace kittenwifi {

    /**
     * Wifi connection io init
     * @param tx Tx pin; eg: SerialPin.P1
     * @param rx Rx pin; eg: SerialPin.P2
    */
    //% blockId=wifi_init block="Wifi init|Tx pin %tx|Rx pin %rx"
    //% weight=100
    //% blockGap=50
    export function wifi_init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(
            tx,
            rx,
            BaudRate.BaudRate115200
        )
    }

    //% blockId=wifi_join block="Wifi Join Aceess Point|%ap Password|%pass"
    //% weight=98
    export function wifi_join(ap: string, pass: string): void {

    }

    /**
     * Change wifi modules's name
     * @param name New name for wifi; eg: Wifi007
    */
    //% blockId=wifi_changename block="Wifi ChangeName %name"
    //% weight=96
    //% blockGap=50
    export function wifi_changename(name: string): void {

    }

    /**
     * Set MQTT set host
     * @param host Mqtt server ip or address; eg: kittenbot.cn
     * @param clientid Mqtt client id; eg: node01
    */
    //% blockId=mqtt_sethost block="MQTT Set Host|%host clientID|%clientid"
    //% weight=90
    export function mqtt_sethost(host: string, clientid: string): void {

    }

    /**
     * Set MQTT publish something to topic
     * @param topic Mqtt topic; eg: /topic
     * @param data Mqtt topic data; eg: Helloworld
    */
    //% blockId=mqtt_publish block="MQTT publish|%topic|Data %data"
    //% weight=86
    export function mqtt_publish(topic: string, data: string): void {

    }


    /**
     * Set MQTT subscribe topic
     * @param topic Mqtt topic; eg: /topic
     * @param handler Mqtt topic data callback;
    */
    //% blockId=mqtt_subscribe block="MQTT subscribe|%topic"
    //% weight=84
    //% blockGap=50
    export function mqtt_subscribe(topic: string, handler: (data: string) => void): void {

    }

    /**
     * UDP communication
     * @param port UDP port; eg: 1234
    */
    //% blockId=udp_comm block="UDP Communication|%port"
    //% weight=80
    export function udp_comm(port: number): void {

    }

    /**
     * UDP Send
     * @param addr Remote ip; eg: 192.168.0.100
     * @param port UDP port; eg: 1234
     * @param data UDP data; eg: hello
    */
    //% blockId=udp_send block="UDP Send %addr port|%port |%data"
    //% weight=78
    export function udp_send(addr: string, port: number, data: string): void {

    }

    //% blockId=udp_ondata block="on UDP data"
    //% weight=76
    //% blockGap=50
    export function udp_ondata(handler: (data: string) => void): void {

    }

    /**
     * Set Restful host
     * @param host Host domain name; eg: kittenbot.cn
    */
    //% blockId=rest_host block="Rest Host %host"
    //% weight=70
    export function rest_host(host: string): void {

    }

    /**
     * Restful POST
     * @param api API link; eg: /api/test
     * @param content Content to send; eg: a=100
    */
    //% blockId=rest_post block="Rest Post %api content|%content"
    //% weight=68
    export function rest_post(api: string, content: string): void {

    }

    /**
     * Restful Get
     * @param api API link; eg: /api/something
    */
    //% blockId=rest_get block="Rest Get %api"
    //% weight=66
    export function rest_get(api: string, handler: (data: string) => void): void {

    }


}
