/*
Riven
load dependency
"kittenwifi": "file:../pxt-kittenwifi"
*/

//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace kittenwifi {
    const CMD_SYNC = 1;
    const CMD_RESP_V = 2;
    const CMD_RESP_CB = 3;
    const CMD_WIFISTATUS = 4;
    const CMD_WIFIINFO = 8;
    const CMD_SETHOSTNAME = 9;
    const CMD_MQTT_SETUP = 10;
    const CMD_MQTT_PUB = 11;
    const CMD_MQTT_SUB = 12;
    const CMD_MQTT_SETHOST = 15;
    const CMD_REST_SETUP = 20;
    const CMD_REST_REQ = 21;
    const CMD_SOCK_SETUP = 40;
    const CMD_SOCK_SEND = 41;
    const CMD_SOCK_DATA = 42;
    const CMD_WIFI_SELECT = 52;

    export enum Callback {
        WIFI_STATUS_CHANGED = 1,
        MQTT_CONN = 2,
        MQTT_DISCON = 3,
        MQTT_PUB = 4,
        MQTT_DATA = 5,
        UDP_SETUP = 6,
        UDP_DATA = 7
    }
    type EvtStr = (data: string) => void;
    type EvtNum = (data: number) => void;

    let v: string;
    // no map support for ts over microbit
    let mqttCbCnt = 0;
    let mqttCb: EvtStr[] = [null, null, null, null, null, null, null, null];
    let mqttCbKey: string[] = ['', '', '', '', '', '', '' ,''];
    let wifiStatusChanged: EvtNum;

    function seekNext(): string {
        for (let i = 0; i < v.length; i++) {
            if (v.charAt(i) == ' ' || v.charAt(i) == '\r' || v.charAt(i) == '\n') {
                let ret = v.substr(0, i)
                v = v.substr(i + 1, v.length - i)
                return ret;
            }
        }

        return '';
    }

    /* // no tostring for integer
    function sendCmd(cmdType: number, argc: number, cb: number, extra: string){
        serial.writeString()
    }
    */

    function parseCallback(cb: number) {
        if (Callback.WIFI_STATUS_CHANGED == cb) {
            wifiStatusChanged(parseInt(seekNext()))
        } else if (Callback.MQTT_DATA == cb) {
            let topic: string = seekNext()
            let data: string = seekNext()
            for (let i = 0; i < 5; i++) {
                let cmp = mqttCbKey[i].compare(topic)
                if (cmp == 0) {
                    mqttCb[i](data)
                    break;
                }
            }
        }
    }

    serial.onDataReceived('\n', function () {
        v = serial.readString()
        let argv: string[] = []
        if (v.charAt(0) == 'W' && v.charAt(1) == 'F') {
            v = v.substr(3, v.length - 3)+' '
            let cmd = parseInt(seekNext())
            let argc = parseInt(seekNext())
            let cb = parseInt(seekNext())

            //  todo: is there an async way to handle response value?
            if (cmd == CMD_RESP_CB) {
                parseCallback(cb)
            }

        }
    })

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
        basic.pause(500)
        serial.readString()
        serial.writeString('\n\n')
        basic.pause(1000)
        serial.writeString("WF 1 0 1\n") // sync command to add wifi status callback
        basic.pause(1000)
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(1000)
    }

    //% blockId=wifi_join block="Wifi Join Aceess Point|%ap Password|%pass"
    //% weight=98
    export function wifi_join(ap: string, pass: string): void {
        let cmd: string = 'WF 52 2 52 ' + ap + ' ' + pass + '\n'
        serial.writeString(cmd)
        basic.pause(500) // it may took longer to finshed the ap join process
    }

    /**
     * Change wifi modules's name
     * @param name New name for wifi; eg: Wifi007
    */
    //% blockId=wifi_changename block="Wifi ChangeName %name"
    //% weight=96
    export function wifi_changename(name: string): void {
        let cmd: string = 'WF 9 1 9 ' + name + '\n'
        serial.writeString(cmd)
        basic.pause(500)
    }

    /**
     * On wifi status changed
     * @param handler Mqtt topic data callback;
    */
    //% blockId=on_wifi_status block="on Wifi changed"
    //% weight=94
    //% blockGap=50
    export function on_wifi_status(handler: (status: number) => void): void {
        wifiStatusChanged = handler;
    }


    /**
     * Set MQTT set host
     * @param host Mqtt server ip or address; eg: kittenbot.cn
     * @param clientid Mqtt client id; eg: node01
    */
    //% blockId=mqtt_sethost block="MQTT Set Host|%host clientID|%clientid"
    //% weight=90
    export function mqtt_sethost(host: string, clientid: string): void {
        let cmd: string = 'WF 15 2 15 ' + host + ' ' + clientid + '\n'
        serial.writeString(cmd)
        basic.pause(500)
    }

    /**
     * Set MQTT publish something to topic
     * @param topic Mqtt topic; eg: /topic
     * @param data Mqtt topic data; eg: Helloworld
    */
    //% blockId=mqtt_publish block="MQTT publish|%topic|Data %data"
    //% weight=86
    export function mqtt_publish(topic: string, data: string): void {
        let cmd: string = 'WF 11 5 11 ' + topic + ' ' + data + ' '+ data.length + ' 0 0\n'
        serial.writeString(cmd)
        basic.pause(200) // limit user pub rate
    }

    /**
     * Set MQTT subscribe
     * @param topic Mqtt topic; eg: /topic
    */
    //% blockId=mqtt_subscribe block="MQTT Subscribe %topic"
    //% weight=84
    export function mqtt_subscribe(topic: string): void {
        serial.writeString("WF 12 2 0 " + topic + ' 0\n')
        basic.pause(500)
    }

    /**
     * On MQTT subscribe data callback install
     * @param topic Mqtt topic; eg: /topic
     * @param handler Mqtt topic data callback;
    */
    //% blockId=on_mqtt_data block="on Mqtt topic|%topic"
    //% weight=82
    //% blockGap=50
    export function on_mqtt_data(topic: string, handler: (data: string) => void): void {
        // todo: push may null global definition
        // mqttCb.push(handler)
        // mqttCbKey.push(topic)
        if (mqttCbCnt>=10) return;
        mqttCb[mqttCbCnt] = handler;
        mqttCbKey[mqttCbCnt] = topic;
        mqttCbCnt++;
    }

    /**
     * UDP communication
     * @param addr Remote ip; eg: 192.168.0.100
     * @param port UDP port; eg: 1234
    */
    //% blockId=udp_comm block="start UDP Communication |%port"
    //% weight=80
    export function udp_comm(addr: string, port: number): void {
        serial.writeString("WF 40 3 6 " + addr + ' ' + port + ' 3\n')
        basic.pause(500)
    }

    /**
     * UDP Send
     * @param addr Remote ip; eg: 192.168.0.100
     * @param port UDP port; eg: 1234
     * @param data UDP data; eg: hello
    */
    //% blockId=udp_send block="UDP Send %data"
    //% weight=78
    export function udp_send( addr: string, data: string): void {

    }

    /**
     * on UDP data
     * @param addr Remote ip; eg: 192.168.0.100
    */
    //% blockId=udp_ondata block="on UDP %addr data"
    //% weight=76
    //% blockGap=50
    export function udp_ondata(addr: string ,handler: (data: string) => void): void {

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
