let flashConfig = require("./flash-config.js")();

flashConfig.watch({
    name: "wifi.txt",
    format: flashConfig.text,
    callback: async config => {
        console.info(JSON.stringify(config, null, 2));
    }
});

//setTimeout(() => console.info("EXIT"), 10000);