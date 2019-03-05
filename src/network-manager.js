const { execFile } = require("child_process");
const debug = require("debug")("app:debug");
const info = require("debug")("app:info");
const error = require("debug")("app:error");

async function nmcli(args) {
    debug("nmcli", ...args);
    return new Promise((resolve, reject) => {

        const child = execFile("nmcli", args, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else if (child.exitCode !== 0) {
                reject(new Error(`Error ${child.exitCode}: ${stderr}`));
            } else {
                resolve(stdout);
            }
        });

    });
}

let asyncWait = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = options => {
    return {
        async configure(config, connectionName = "Default") {
            info(`Configuring Network Manager SSID ${config.ssid}`);

            if (!config.ssid) {
                throw new Error("missing ssid");
            }

            let connectionExists = async () => (await nmcli(["-t", "--fields", "NAME,TYPE", "con"]))
                .split("\n")
                .map(l => {
                    let fields = l.split(":");
                    return { name: fields[0], type: fields[1] }
                })
                .some(i => i.type === "802-11-wireless" && i.name === connectionName);

            if (! await connectionExists()) {
                nmcli(["con", "add", "con-name", connectionName, "type", "wifi", "ifname", "*", "ssid", config.ssid]);

                for (let c = 0; c < 10; c++) {
                    await asyncWait(1000);
                    if (await connectionExists()) {
                        break;
                    }
                }
            }

            properties = {};
            properties["wifi.ssid"] = config.ssid;
            properties["802-11-wireless-security.psk"] = config.password;
            properties["802-11-wireless-security.key-mgmt"] = config.security || "wpa-psk";

            if (config.ip) {

                properties["ipv4.method"] = "manual";

                let ipWithMask = config.ip;
                if (ipWithMask.indexOf("/") === -1) {
                    ipWithMask += "/24";
                }
                properties["ipv4.addresses"] = ipWithMask;

                if (config.gw) {
                    properties["ipv4.gateway"] = config.gw;
                }

                properties["ipv4.dns"] = config.dns || "8.8.8.8";

            } else {
                properties["ipv4.method"] = "auto";
            }

            await nmcli([
                "con",
                "mod",
                connectionName,
                ...Object.entries(properties).reduce((a, e) => [...a, e[0], e[1]], [])
            ]);

            await nmcli([
                "con",
                "up",
                connectionName
            ]);
        }
    }
}