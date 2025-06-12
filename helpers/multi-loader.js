const glob = require("glob");

exports.components = () => {
    let allOfThem = {};
    glob.sync(`${require('path').resolve(__dirname, '..')}/actions/*.js`).forEach((file) => {
        allOfThem = { ...allOfThem, ...require(file) };
    });
    return allOfThem;
}



