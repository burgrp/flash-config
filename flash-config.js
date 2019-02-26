const fs = require("fs");
const pro = require("util").promisify;

module.exports = config => {

    let checkedFiles = [];

    let mountsStr;
    let mountsLines = [];

    function checkMounts() {

        function scheduleNextCheck() {
            setTimeout(checkMounts, 1000);
        }

        async function checkFile(path, checked) {
            let fileName = (path === "/"? "": path) + "/" + checked.name;

            console.info("checking", fileName);
            try {
                let str = (await pro(fs.readFile)(fileName)).toString();
                console.info(str);
            } catch {
                // fall through
            }
        }

        fs.readFile("/proc/self/mounts", (err, data) => {
            console.info("checking...");
            if (!err) {
                let newMountsStr = data.toString();
                if (newMountsStr !== mountsStr) {

                    let newMountsLines = newMountsStr.split("\n").filter(l => l);

                    let added = newMountsLines.filter(n => !mountsLines.some(l => l === n));

                    let promises = [];

                    added.forEach(line => {
                        if (line.startsWith("/dev/")) {
                            let path = line.split(" ")[1];

                            checkedFiles.forEach(checked => {
                                promises.push(checkFile(path, checked));
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
        read(name, cb) {
            checkedFiles.push({ name, cb });
        }
    }
}