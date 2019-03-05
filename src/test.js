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

//setTimeout(() => console.info("EXIT"), 10000);