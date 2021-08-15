const axios = require('axios');
const auth = process.env.SNCF_API_KEY_2
/**
 * Get data from specified page
 * @param {Number} number The number of the page
 */
function getDataFrom(number){
    return axios.get(`https://api.sncf.com/v1/coverage/sncf/vehicle_journeys?start_page=${number}`, {
        "headers": {"Authorization": auth}
    })
}

/**
 * Get metadata from all train stations
 * @returns {Object} Parameters "pages" and "items"
 */
async function getPagination(){
    let data = null;
    try {
        data = await getDataFrom(0);
        return data.data.pagination
    } catch (error) {
        return error
    }
}

module.exports = {
    "getPagination": getPagination,
    "getDataFrom": getDataFrom
}