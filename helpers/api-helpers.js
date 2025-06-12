const axios = require('axios');
const _ = require('lodash');
const auth0 = require('auth0');

exports.checkAppMetadata = (event, api) => {
    if (!_.get(event.user.app_metadata, 'hubspot', false)) return true;
    if (!_.get(event.user.app_metadata, 'hubspot.hubSpotContactCreated', false)) return true;
    if (!_.get(event.user.app_metadata, 'hubspot.hubSpotContactId', false)) return true;
    if (_.get(event.user.app_metadata, 'hubspot.hubSpotContactId') === 0) return false;
}

exports.updateMetadata = (what, where, newInfo, event, api) => {
    const options = {
        method: 'POST',
        url: `https://${_.get(event.secrets, 'AUTH_DOMAIN')}/oauth/token`,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: _.get(event.secrets, 'CLIENT_ID'),
            client_secret: _.get(event.secrets, 'CLIENT_SECRET'),
            audience: `https://${_.get(event.secrets, 'AUTH_DOMAIN')}/api/v2/`
        })
    };

    axios(options).then((response) => {

        const auth0ApiOptions = {
            token: _.get(response.data, 'access_token'),
            domain: `${_.get(event.secrets, 'AUTH_DOMAIN')}`
        };

        useAuth0ManagementAPIforUpdateUser(what, where, newInfo, event, api, auth0ApiOptions);

    }).catch((error) => {
        console.error('GET API V2 TOKEN: Something went wrong!\n' + error);
    });

}

const useAuth0ManagementAPIforUpdateUser = (what, where, newInfo, event, api, auth0ApiOptions) => {
    const ManagementClient = auth0.ManagementClient;
    const management = new ManagementClient(auth0ApiOptions);

    const params = { id: _.get(event, 'user.user_id') };

    let metadata = where === 'app_metadata' ? _.get(event, 'user.app_metadata') : _.get(event, 'user.user_metadata');
    _.set(metadata, what, newInfo);

    if (where === 'app_metadata')
        management.updateAppMetadata(
            params,
            metadata,
            function (err, user) {
                if (err) console.error('AUTH0 Management API: Something went wrong!\n' + err);
                else console.log(`UPDATE APP_METADATA: app_metadata (${what}) updated for user ${_.get(user, 'email')}`);
            }
        );
    else
        management.updateUserMetadata(
            params,
            metadata,
            function (err, user) {
                if (err) console.error('AUTH0 Management API: Something went wrong!\n' + err);
                else console.log(`UPDATE USER_METADATA: user_metadata (${what}) updated for user ${_.get(user, 'email')}`);
            }
        );
}
