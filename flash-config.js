const fs = require("fs");
const pro = require("util").promisify;
const debug = require("debug")("app:debug"); 
const info = require("debug")("app:info");
const error = require("debug")("app:error");

module.exports = config => {

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
            let fileName = (path === "/" ? "" : path) + "/" + watchedFile.name;

            debug(`Checking configuration ${fileName}`);
            try {
                let str = (await pro(fs.readFile)(fileName)).toString();
                try {
                    info(`Configuring by ${fileName}`);
                    let value = (watchedFile.format || (l => l))(str);
                    await watchedFile.callback(value, watchedFile, fileName);
                } catch (e) {
                    error(`Error configuring by ${fileName}: ${e.message || e}`)
                }
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

    checkMounts();

    return {
        watch(options) {
            watchedFiles.push(options);
        },

        text: readText,
        json: readJson
    }
}