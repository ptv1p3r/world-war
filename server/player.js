/**
 * Created by v1p3r on 26-03-2017.
 */

/**
 * Classe para jogador
 * @param id
 * @param name
 * @returns {{name: *, id: *, number: string, x: number, y: number, local: number}}
 * @constructor
 */
Player = function (id) {
    var self = {
        id              : id    ,
        name            : ''    ,
        email           : ''    ,
        password        : ''    ,
        number          : 0     ,
        x               : 0     ,
        y               : 0     ,
        user            : ''    ,
        lastlogin       : 0.00  ,
        countryid       : 0     ,
        balance         : 0.00  ,
        gpspositionsid  : 0
    };
    Player.list[id] = self;

    return self;
};
Player.list = {};