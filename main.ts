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
    const CMD_REST_RET = 23;
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
    
    export enum NtpTimeType {
        s1970 = 0,
        SS = 1,
        MM = 2,
        HH = 3,
    }

    const PortSerial = [
        [SerialPin.P8, SerialPin.P0],
        [SerialPin.P12, SerialPin.P1],
        [SerialPin.P13, SerialPin.P2],
        [SerialPin.P15, SerialPin.P14]
    ]

    export enum SerialPorts {
        PORT1 = 0,
        PORT2 = 1,
        PORT3 = 2,
        PORT4 = 3
    }

    export enum HeaderType {
        Header = 0,
        ContentType = 1,
        UserAgent = 2
    }

    type EvtStr = (data: string) => void;
    type EvtAct = () => void;
    type EvtNum = (data: number) => void;
    type EvtDict = (topic: string, data: string) => void;


    let v: string;
    // no map support for ts over microbit
    let ipAddr: string = '';

    let mqttCbCnt = 0;
    let mqttCb: EvtStr[] = [null, null, null, null, null, null, null, null];
    let mqttCbKey: string[] = ['', '', '', '', '', '', '', ''];
    let mqttCbTopicData: EvtDict = null;
    
    let wifiCmd = 0;

    let wifiConn: EvtAct = null;
    let wifiDisconn: EvtAct = null;

    // no multi udp or restful instance support for microbit
    let udpRxEvt: EvtStr = null;
    let restRxEvt: (code:number, data:string) => void = null;

    function trim(t: string): string {
        if (t.charAt(t.length - 1) == ' ') {
            t = t.substr(0, t.length - 1)
        }
        return t;
    }

    function seekNext(space: boolean = true): string {
        for (let i = 0; i < v.length; i++) {
            if ((space && v.charAt(i) == ' ') || v.charAt(i) == '\r' || v.charAt(i) == '\n') {
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
            let stat = parseInt(seekNext())
            if (stat == 5) {
                serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
                ipAddr = seekNext()
                if (wifiConn) wifiConn()
            } else {
                ipAddr = ''
                if (wifiDisconn) wifiDisconn()
            }
        } else if (Callback.MQTT_DATA == cb) {
            let topic: string = seekNext()
            let data = trim(seekNext(false));
            for (let i = 0; i < 5; i++) {
                let cmp = mqttCbKey[i].compare(topic)
                if (cmp == 0) {
                    mqttCb[i](data)
                    break;
                }
            }
            if (mqttCbTopicData) {
                mqttCbTopicData(topic, data)
            }
        } else if (Callback.MQTT_CONN == cb) {
            // resubscribe?
            for (let i = 0; i < mqttCbCnt; i++) {
                serial.writeString("WF 12 2 1 " + mqttCbKey[i] + ' 0\n')
                basic.pause(300)
            }
        }
    }

    serial.onDataReceived('\n', function () {
        v = serial.readString()
        let argv: string[] = []
        if (v.charAt(0) == 'W' && v.charAt(1) == 'F') {
            v = v.substr(3, v.length - 3) + ' '
            let cmd = parseInt(seekNext())
            let argc = parseInt(seekNext())
            let cb = parseInt(seekNext())
            //  todo: is there an async way to handle response value?
            if (cmd == CMD_RESP_CB) {
                parseCallback(cb)
            } else if (cmd == CMD_SOCK_DATA) {
                let data = trim(seekNext(false));
                if (udpRxEvt) udpRxEvt(data)
            } else if (cmd == CMD_REST_RET) {
                let code = parseInt(seekNext())
                if (restRxEvt){
                    restRxEvt(code, v)
                }
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
    export function wifi_init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(
            tx,
            rx,
            BaudRate.BaudRate115200
        )
        basic.pause(500)
        serial.setRxBufferSize(192)
        serial.setTxBufferSize(64)
        serial.readString()
        serial.writeString('\n\n')
        basic.pause(1000)
        serial.writeString("WF 1 0 1\n") // sync command to add wifi status callback
        basic.pause(1000)
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(1000)
    }

    //% blockId=wifi_init_pw block="Wifi init powerbrick|Port %port"
    //% weight=100
    //% blockGap=50
    export function wifi_init_pw(port: SerialPorts): void {
        wifi_init(PortSerial[port][1], PortSerial[port][0]) // tx, rx
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
     * On wifi connected
     * @param handler Wifi connected callback
    */
    //% blockId=on_wifi_connected block="on Wifi Connected"
    //% weight=94
    export function on_wifi_connected(handler: () => void): void {
        wifiConn = handler;
    }

    /**
     * On wifi disconnected
     * @param handler Wifi disconnected callback
    */
    //% blockId=on_wifi_disconnected block="on Wifi Disconnected"
    //% weight=92
    export function on_wifi_disconnected(handler: () => void): void {
        wifiDisconn = handler;
    }

    //% blockId=wifi_addr block="Wifi IP Address"
    //% weight=91
    //% blockGap=50
    export function wifi_addr(): string {
        return ipAddr;
    }


    /**
     * Set MQTT set host
     * @param host Mqtt server ip or address; eg: kittenbot.cn
     * @param clientid Mqtt client id; eg: node01
    */
    //% blockId=mqtt_sethost block="MQTT Set Host%host clientID%clientid"
    //% weight=90
    export function mqtt_sethost(host: string, clientid: string): void {
        let cmd: string = 'WF 15 2 15 ' + host + ' ' + clientid + '\n'
        serial.writeString(cmd)
        basic.pause(1000)
        // reset mqtt handler
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(500)
    }

    /**
     * Set MQTT set host with port
     * @param host Mqtt server ip or address; eg: kittenbot.cn
     * @param clientid Mqtt client id; eg: node01
     * @param port host port; eg: 1883
    */
    //% blockId=mqtt_sethost_port block="MQTT Set Host%host port%port clientID%clientid"
    //% weight=90
    //% advanced=true
    export function mqtt_sethost_port(host: string, port: number, clientid: string): void {
        let cmd: string = 'WF 15 3 15 ' + host + ' ' + clientid + ' ' + port + '\n'
        serial.writeString(cmd)
        basic.pause(1000)
        // reset mqtt handler
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(500)
    }

    /**
     * Set MQTT set host auth
     * @param host Mqtt server ip or address; eg: kittenbot.cn
     * @param clientid Mqtt client id; eg: node01
    */
    //% advanced=true
    //% blockId=mqtt_sethost_auth block="MQTT Set Host %host clientID %clientid|user %username pass %pass"
    //% weight=90
    export function mqtt_sethost_auth(host: string, clientid: string, username: string, pass: string): void {
        let cmd: string = 'WF 15 4 15 ' + host + ' ' + clientid + ' ' + username + ' ' + pass + '\n'
        serial.writeString(cmd)
        basic.pause(1000)
        // reset mqtt handler
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(500)
    }

    /**
     * Set MQTT set host auth with port
     * @param host Mqtt server ip or address; eg: kittenbot.cn
     * @param clientid Mqtt client id; eg: node01
     * @param port host port; eg: 1883
    */
    //% advanced=true
    //% blockId=mqtt_sethost_auth_port block="MQTT Set Host %host|port %port|clientID %clientid|user %username|pass %pass"
    //% weight=90
    export function mqtt_sethost_auth_port(host: string, port: number, clientid: string, username: string, pass: string): void {
        let cmd: string = 'WF 15 5 15 ' + host + ' ' + clientid + ' ' + port + ' ' + username + ' ' + pass + '\n'
        serial.writeString(cmd)
        basic.pause(1000)
        // reset mqtt handler
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(500)
    }

    /**
     * Set MQTT publish something to topic
     * @param topic Mqtt topic; eg: /hello
     * @param data Mqtt topic data; eg: Helloworld
     * @param qos Qos; eg: 1
     * @param retain Retain; eg: 0
    */
    //% blockId=mqtt_publish block="MQTT publish %topic|Data %data||Qos %qos Retain %retain"
    //% weight=86
    //% advanced=true
    export function mqtt_publish(topic: string, data: string, qos?: number, retain?: number): void {
        qos = qos ? 1:0;
        retain = retain ? 1 : 0;
        let cmd: string = `WF 11 4 11 ${qos} ${retain} ` + topic + ' ' + data + '\n'
        serial.writeString(cmd)
        basic.pause(200) // limit user pub rate
    }

    //% blockId=mqtt_publish_basic block="MQTT publish %topic|Data %data"
    //% weight=86
    export function mqtt_publish_basic(topic: string, data: string): void {
        mqtt_publish(topic, data, 1, 0);
    }

    /**
     * Set MQTT subscribe
     * @param topic Mqtt topic; eg: /hello
     * @param qos QOS; eg: 0
    */
    //% blockId=mqtt_subscribe block="MQTT Subscribe %topic||Qos %qos"
    //% weight=84
    //% advanced=true
    export function mqtt_subscribe(topic: string, qos?: number): void {
        serial.writeString(`WF 12 2 ${qos} ` + topic + ' 0\n')
        basic.pause(500)
    }

    //% blockId=mqtt_subscribe_basic block="MQTT Subscribe %topic"
    //% weight=84
    export function mqtt_subscribe_basic(topic: string): void {
        mqtt_subscribe(topic, 1);
    }

    /**
     * On MQTT subscribe data callback install
     * @param topic Mqtt topic; eg: /hello
     * @param handler Mqtt topic data callback;
    */
    //% blockId=on_mqtt_data block="on Mqtt topic|%topic"
    //% weight=82
    export function on_mqtt_data(topic: string, handler: (data: string) => void): void {
        // todo: push may null global definition
        // mqttCb.push(handler)
        // mqttCbKey.push(topic)
        if (mqttCbCnt >= 10) return;
        mqttCb[mqttCbCnt] = handler;
        mqttCbKey[mqttCbCnt] = topic;
        mqttCbCnt++;
    }

    /**
     * On MQTT got any topic and data
     * @param handler Mqtt topic data callback;
    */
    //% blockId=on_mqtt_topic_data block="on Mqtt "
    //% weight=81
    //% blockGap=50 draggableParameters=reporter
    export function on_mqtt_topic_data(handler: (topic: string, data: string) => void): void {
        // todo: push may null global definition
        // mqttCb.push(handler)
        // mqttCbKey.push(topic)
        mqttCbTopicData = handler;
    }
    
    //% blockId=ntp_get block="Ntp Get %type"
    //% weight=78
    //% advanced=true
    export function ntp_get(type: NtpTimeType): void {
        serial.writeString("WF 7\n")
        
        
    }


    /**
     * UDP communication
     * @param addr Remote ip; eg: 192.168.0.100
     * @param port UDP port; eg: 1234
    */
    //% blockId=udp_comm block="start UDP Communication ip|%addr port|%port"
    //% weight=80
    export function udp_comm(addr: string, port: number): void {
        serial.writeString("WF 40 3 40 " + addr + ' ' + port + ' 3\n')
        basic.pause(500)
    }

    /**
     * UDP Send
     * @param data UDP data; eg: hello
    */
    //% blockId=udp_send block="UDP Send %data"
    //% weight=78
    export function udp_send(data: string): void {
        serial.writeString("WF 41 1 0 " + data + '\n')
    }

    /**
     * on UDP data
     * @param addr Remote ip; eg: 192.168.0.100
    */
    //% blockId=udp_ondata block="on UDP data"
    //% weight=76
    //% blockGap=50 draggableParameters=reporter
    export function udp_ondata(handler: (udpData: string) => void): void {
        udpRxEvt = handler;
    }

    /**
     * Set Restful host
     * @param host Host domain name; eg: kittenbot.cn
     * @param port Host port; eg: 80
    */
    //% blockId=rest_host block="Rest Host %host port %port||secure %secure"
    //% weight=70
    //% advanced=true
    export function rest_host(host: string, port: number, secure?: number): void {
        // todo: support https connection?
        secure = secure ? 1 : 0;
        serial.writeString("WF 20 3 20 " + host + " " + port + ` ${secure}\n`)
    }


    //% blockId=rest_header block="Rest Header Type%hd %header"
    //% weight=68
    //% advanced=true
    export function rest_header(hd:HeaderType, header: string): void {
        serial.writeString("WF 22 2 0 "+hd+" "+ header + "\n")
    }

    /**
     * Restful request
     * @param method Method in request; eg: GET, POST, PUT
     * @param api API link; eg: /api/test?apple=1
    */
    //% blockId=rest_request block="Rest REQ %method api|%api"
    //% weight=68
    //% advanced=true
    export function rest_request(method: string, api: string): void {
        serial.writeString("WF 21 2 0 " + method + " " + api + "\n")
    }


    /**
     * Restful request return
    */
    //% blockId=rest_ret block="Rest Return"
    //% weight=66
    //% advanced=true draggableParameters=reporter
    export function rest_ret(handler: (code: number, restData: string) => void): void {
        restRxEvt = handler;
    }
}
