const { execFile } = require("child_process");
const debug = require("debug")("app:debug");

module.exports = (executable, args = []) => {
    debug(executable, ...args);
    return new Promise((resolve, reject) => {

        const child = execFile(executable, args, (error, stdout, stderr) => {
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