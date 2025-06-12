const _ = require('lodash');

const components = require('./helpers/multi-loader').components();
const componentsNames = _.keys(components);

componentsNames.forEach(component => {
    exports[component] = components[component];
});

