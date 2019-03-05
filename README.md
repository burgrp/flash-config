# flash-config
Configuration of headless devices by flash disk (or any mountable disk) with Network-Manager support.

This library allows UI-less devices (usually a Raspberry Pi, Orange Pi etc...) to be easily configured just by inserting USB flash disk or SD card to port. The library watches device mounts and when it finds the desired configuration file, a user code is called.

To give user a feedback about operation result, the library either:
- renames configuration file by inserting `done-` prefix if operation succeeded.
- creates new file with `failed-` prefix if the user callback thrown an exception. The file contains error message of that exception.

The generic configuration API is very simple:
```js
const flashConfig = require("flash-config").flashConfig();

flashConfig.watch({
    name: "config.json",
    format: flashConfig.json,
    callback: async config => {
        console.info("I got my configuration:", config);
    }
});
```

Because most common task is to configure WiFi connection, there is a built-in support to configure Network-Manager.

```js
const flashConfig = require("flash-config").flashConfig();
const networkManager = require("flash-config").networkManager();

flashConfig.watch({
    name: "wifi.txt",
    format: flashConfig.text,
    callback: async config => {
        await networkManager.configure(config, "TEST");
        console.info(`BINGO, connection to ${config.ssid} configured!`);
    }
});
```

Check [example.js](https://github.com/burgrp/flash-config/blob/master/src/example.js) for complete code.

Note the `format` property of watch parameter. This is a reference to converter function, which takes file content as string and returns a js value. There are two built-in converters:

**json** which is just `JSON.parse`

**text** which consumes key-value map with # comments, e.g.:

wifi.txt:
```
# this is an example of WiFi configuration
ssid MySweetHome
password abcd1234

# ip and gw is optional, if missing we use DHCP
ip 10.1.0.15
gw 10.1.0.2
```

The library uses `debug` module for logging. To get full log, set environment variable `DEBUG=*`.

### Command line usage
You can use the library directly from command line to configure WiFi:
```
npm install -g flash-config
flash-config wifi.txt
```