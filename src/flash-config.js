const fs = require("fs");
const pro = require("util").promisify;
const exec = require("./exec.js");
const debug = require("debug")("app:debug");
const info = require("debug")("app:info");
const error = require("debug")("app:error");

module.exports = options => {

    let watchedFiles = [];

    let mountsStr;
    let mountsLines = [];

    function readText(str) {
        return str
            .split("\n")
            .map(l => l.trim()).filter(l => !l.startsWith("#"))
            .map(l => (/(?<key>.[^\s]+)\s+(?<value>.*)/.exec(l) || {}).groups)
            .filter(e => e)
            .reduce((o, e) => {
                o[e.key] = e.value;
                return o;
            }, {});
    }

    function readJson(str) {
        return JSON.parse(str);
    }

    function checkMounts() {

        function scheduleNextCheck() {
            setTimeout(checkMounts, 1000);
        }

        async function checkFile(path, watchedFile) {
            let prefix = (path === "/" ? "" : path) + "/";
            let configFileName = prefix + watchedFile.name;
            let errorFileName = prefix + "failed-" + watchedFile.name + (watchedFile.name.endsWith(".txt") ? "" : ".txt");

            debug(`Checking configuration ${configFileName}`);
            try {

                let str = (await pro(fs.readFile)(configFileName)).toString();

                try {
                    await pro(fs.unlink)(errorFileName);
                } catch {
                    // fall through
                }

                try {

                    info(`Configuring by ${configFileName}`);
                    let value = (watchedFile.format || (l => l))(str);
                    await watchedFile.callback(value, watchedFile, configFileName);
                    await pro(fs.rename)(configFileName, prefix + "done-" + watchedFile.name);

                } catch (e) {

                    let message = `Error configuring by ${configFileName}: ${e.message || e}`;
                    error(message);
                    await pro(fs.writeFile)(errorFileName, message);

                }

                await exec("sync");

            } catch {
                // fall through
            }
        }

        fs.readFile("/proc/self/mounts", (err, data) => {
            if (!err) {
                let newMountsStr = data.toString();
                if (newMountsStr !== mountsStr) {

                    let newMountsLines = newMountsStr.split("\n").filter(l => l);

                    let added = newMountsLines.filter(n => !mountsLines.some(l => l === n));

                    let promises = [];

                    added.forEach(line => {
                        if (line.startsWith("/dev/")) {
                            let path = line.split(" ")[1];

                            watchedFiles.forEach(watchedFile => {
                                promises.push(checkFile(path, watchedFile));
                            })
                        }
                    });

                    mountsStr = newMountsStr;
                    mountsLines = newMountsLines;

                    Promise.all(promises).finally(scheduleNextCheck);

                } else {
                    scheduleNextCheck();
                }
            } else {
                scheduleNextCheck();
            }
        });
    }

    return {
        watch(options) {
            watchedFiles.push(options);
            return this;
        },

        start: checkMounts,

        text: readText,
        json: readJson
    }
}