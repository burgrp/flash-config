#!/usr/bin/env node

const index = require("./index.js");

const flashConfig = index.flashConfig();
const networkManager = index.networkManager();

console.info("Watching for wifi.txt on all new mounts...");

flashConfig.watch({
    name: "wifi.txt",
    format: flashConfig.text,
    callback: async config => {
        console.info(`Connecting to ${config.ssid}...`);
        try {
            await networkManager.configure(config, "TEST");
            console.info(`Successfully connected to ${config.ssid}`);
        } catch (e) {
            console.error(`Error connecting to: ${config.ssid}: ${e.message || e}`);
            throw e;
        }
    }
});

