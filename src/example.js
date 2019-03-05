const index = require("./index.js");

const flashConfig = index.flashConfig();
const networkManager = index.networkManager();

flashConfig.watch({
    name: "wifi.txt",
    format: flashConfig.text,
    callback: async config => {
        await networkManager.configure(config, "TEST");
        console.info(`BINGO, connection to ${config.ssid} configured!`);
    }
});

flashConfig.watch({
    name: "config.json",
    format: flashConfig.json,
    callback: async config => {
        console.info("I got my configuration:", config);
    }
});
