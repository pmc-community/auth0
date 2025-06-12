const hubspot = require('@hubspot/api-client');
const { updateMetadata } = require('./api-helpers');
const _ = require('lodash');

exports.executeHSAPI = (whatApi, whatOp, event, api, apiBody) => {
    if (whatApi === 'contacts') return executeHSContactsApi(whatOp, event, api, apiBody);
    if (whatApi === 'tickets') return executeHSTicketsApi(whatOp, event, api, apiBody);
}

executeHSContactsApi = (whatOp, event, api, apiBody) => {
    if (whatOp === 'create') return createHSContact(event, api, apiBody);
}

executeHSTicketsApi = (whatOp, event, api, apiBody) => {
    if (whatOp === 'create') return createHSTicket(event, api, apiBody);
}

createHSTicket = (event, api, apiBody) => {
    const privateAppToken = _.get(event.secrets, 'HUBSPOT_PRIVATE_APP_TOKEN');
    const hubspotClient = new hubspot.Client({ "accessToken": privateAppToken });

    const properties = apiBody;

    const SimplePublicObjectInput = { properties };

    hubspotClient.crm.tickets.basicApi
        .create(SimplePublicObjectInput)
        .then((results) => {
            const nTicketId = parseInt(_.get(results, 'id'));
            console.log(`HS-INTEGRATION: New ticket created (${_.get(event.user, 'email')} Ticket ID ${nTicketId})`);
        })
        .catch((err) => {
            console.log(`HS-INTEGRATION: HubSpot response ${_.get(err, 'code')} Something went wrong when creating ticket! (${_.get(event.user, 'email')})`);
        })
}

createHSContact = (event, api, apiBody) => {
    const privateAppToken = _.get(event.secrets, 'HUBSPOT_PRIVATE_APP_TOKEN');
    const hubspotClient = new hubspot.Client({ "accessToken": privateAppToken });

    // 'properties' is reserved name for this variable
    const properties = apiBody;

    // SimplePublicObjectInput is only transforming the object from object to newObject = {properties: object}
    // because this the way in which HubSpot api wants the request body
    const SimplePublicObjectInput = { properties };

    hubspotClient.crm.contacts.basicApi
        .create(SimplePublicObjectInput)
        .then((results) => {
            const newContactId = parseInt(_.get(results, 'id'));
            console.log(`HS-INTEGRATION: New Contact added in HubSpot (${_.get(event.user, 'email')} Contact ID ${newContactId})`);
            updateMetadata(
                'hubspot',
                'app_metadata',
                {
                    hubSpotContactCreated: true,
                    hubSpotContactId: newContactId
                },
                event,
                api
            );
        })
        .catch((err) => {
            if (_.get(err, 'code') === 409) {
                console.log(`HS-INTEGRATION: The contact is already in HubSpot (${_.get(event.user, 'email')} ${_.get(err.body, 'message')})`);
                updateMetadata(
                    'hubspot',
                    'app_metadata',
                    {
                        hubSpotContactCreated: true,
                        hubSpotContactId: _.parseInt(_.trim(_.replace(_.get(err.body, 'message'), 'Contact already exists. Existing ID:', '')))
                    },
                    event,
                    api
                );
            }
            else {
                console.log(`HS-INTEGRATION: HubSpot response ${_.get(err, 'code')} Something went wrong! (${_.get(event.user, 'email')} ${_.get(err.body, 'message')})`);
                updateMetadata(
                    'hubspot',
                    'app_metadata',
                    {
                        hubSpotContactCreated: false,
                        hubSpotContactId: 0
                    },
                    event,
                    api
                );
            }
        })
}