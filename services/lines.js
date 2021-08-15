const axios = require('axios');
const auth = process.env.SNCF_API_KEY
/**
 * Get data from specified page
 * @param {Number} number The number of the page
 * @param {Number} count Items per page
 */
function getDataFrom(number, count=25){
    return axios.get(`https://api.sncf.com/v1/coverage/sncf/lines?start_page=${number}&count=${count}`, {
        "headers": {"Authorization": auth}
    })
}

/**
 * Get the different vehicle journeys from a specified line
 * @param {String} id The ID of the line
 * @param {Number} number The number of the page
 * @param {Number} count Items per page
 */
function getVehicleJourneys(id, number, count=25){
    return axios.get(`https://api.sncf.com/v1/coverage/sncf/lines/${id}/vehicle_journeys?start_page=${number}&count=${count}`, {
        "headers": {"Authorization": auth}
    })
}

module.exports = {
    "getDataFrom": getDataFrom,
    "getVehicleJourneys": getVehicleJourneys
}