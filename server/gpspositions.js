/**
 * Created by v1p3r on 26-03-2017.
 */

/**
 * Classe modelo para posicoes de gps
 * @param id
 * @param name
 * @param lat
 * @param lon
 * @param countryId
 * @returns {{id: *, name: *, lat: *, lon: *, countryid: *}}
 * @constructor
 */
GpsPositions = function (id,name,lat,lon,countryId) {
    var self = {
        id          : id,
        name        : name,
        lat         : lat,
        lon         : lon,
        countryid   : countryId
    };
    GpsPositions.list[id] = self;

    return self;
};

GpsPositions.list = {};
