/**
 * Created by v1p3r on 26-03-2017.
 */

/**
 * Classe modelo para paises
 * @param id
 * @param name
 * @returns {{id: *, name: *}}
 * @constructor
 */
Countries = function (id,name) {
    var self = {
        id      :  id,
        name    :   name
    };
    Countries.list[id] = self;

    return self;
};

Countries.list = {};
