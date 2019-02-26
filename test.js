let flashConfig = require("./flash-config.js")();

flashConfig.read("wifi.txt", flashConfig.translateText, config => {
    console.info(config);
});

//setTimeout(() => console.info("EXIT"), 10000);