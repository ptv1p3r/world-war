const crypto = require('crypto');
const secret = 'world@war';
var tools = require('./server/initServer');
var serverDateStart, serverDateNow;
var SOCKET_LIST = {}; // lista de ligacoes
var playerCount = 0;

var fs = require("fs");
var file = "./server/w@w.db";
var exists = fs.existsSync(file);

if(!exists) {
    console.log("Creating DB file.");
    fs.openSync(file, "w");
}

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

// 40ms = 1000/25
// 60s  = 60 * 1000
var CYCLE_TIME = 1000/25;      // tempo em milisegundos para cada ciclo de loop

/**
 * Classe para jogador
 * @param id
 * @param name
 * @returns {{name: *, id: *, number: string, x: number, y: number, local: number}}
 * @constructor
 */
var Player = function (id) {
    var self = {
        id          : id    ,
        name        : ''    ,
        email       : ''    ,
        password    : ''    ,
        number      : 0     ,
        x           : 0     ,
        y           : 0     ,
        user        : ''    ,
        lastLogin   : 0.00  ,
        countryId   : 0     ,
        balance     : 0.00
    };
    Player.list[id] = self;

    return self;
}

Player.list = {};

Player.onConnect = function(socket,data){
    var player = Player(socket.id); // novo jogador
    db.serialize(function() {
        db.all("SELECT playerId, playerName, playerEmail, playerPassword, playerUser, playerLastLogin, countryId AS playerCountryId, playerBalance FROM Player WHERE playerUser LIKE '" + data.username + "'", function(err, row) {
            player.number      = row[0].playerId        ;
            player.name        = row[0].playerName      ;
            player.email       = row[0].playerEmail     ;
            player.password    = row[0].playerPassword  ;
            player.x           = 0                      ;
            player.y           = 0                      ;
            player.user        = row[0].playerUser      ;
            player.lastLogin   = row[0].playerLastLogin ;
            player.countryId   = row[0].playerCountryId ;
            player.balance     = row[0].playerBalance   ;
        });
    });
    playerCount++;
};
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
};

Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        //player.update();
        pack.push({
            id          : player.id,
            name        : player.name,
            user        : player.user,
            balance     : player.balance,
        });
    }
    return pack;
};

/*
try {

} catch (err) {
    console.log('crypto support is disabled!');
}
*/

// Setup do servidor
var app = tools.initServer();
var serv  = require("http").Server(app);
serv.listen(2000); // liga o servidor em determinada porta

serverDateNow=serverDateStart = new Date();
console.log(serverDateStart + ' ->World@War Public Server pré-alpha Started...');

/**
 * Metodo responsavel pela ligacao de socket
 */
var io  = require('socket.io') (serv,{});
io.sockets.on('connection', function (socket) {

    socket.id = Math.random() ;//Math.floor(10 * Math.random()) ;
    socket.ip = socket.handshake.address; // guarda ip

    SOCKET_LIST[socket.id] = socket; // guarda ligacao na lista

    socket.on('signIn',function(data){
        isValidPassword(data,function(res){
            if(res){
                Player.onConnect(socket,data);
                socket.emit('signInResponse',{success:true});

                console.log("Player: " + data.username + " added!");
            } else {
                socket.emit('signInResponse',{success:false});
            }
        });
    });

    socket.on('signUp',function(data){
        isUsernameTaken(data,function(res){
            if(res){
                socket.emit('signUpResponse',{success:false});
            } else {
                addUser(data,function(){
                    socket.emit('signUpResponse',{success:true});
                });
            }
        });
    });

    /**
     * Metodo automatico que valida o disconect do socket pelo cliente
     */
    socket.on('disconnect', function () { // automatico nao necessita de mensagem do cliente
        delete SOCKET_LIST[socket.id]; // elimina a socket
        Player.onDisconnect(socket); // elimina o player

        if (playerCount != 0) {
            playerCount = playerCount -1;
        }

        console.log('player deleted' + ' id: ' + socket.id);
    })

    /*
    socket.on("newPlayer", function (data) {
        if (!playerExists) {
            var player = Player(socket.id); // cria novo player
            player.name = data.name;

            switch (data.local){
                case '1':
                    player.local = "40.0#175.0"; //EU
                    //player.local = "-10.0#120.0"; //BR
                    //player.local = "40.0#80.0"; //USA
                    break;
                case '2':
                    player.local = "20.0#175.0"; //AF
                    break;
                case '3':
                    player.local = "-26.0#311.0"; //AU
                    break;
            }

            //PLAYERS_LIST[socket.id] = player;
            //playerCount++;

            socket.emit('newPlayerResponse',{
                login       : true,
                id          : socket.id,
                name        : player.name,
                playerCount : playerCount,
                local       : player.local
            });

            var pack = [];
            for (var i in PLAYERS_LIST){
                var player = PLAYERS_LIST[i];
                pack.push({
                    id : player.id,
                    name : player.name,
                    local : player.local
                });
            }

            socket.emit('playersList',pack);

        }

    });
*/
    console.log('new socket connection' + ' id: ' + socket.id + " ip: " + socket.ip);

});


var isValidPassword = function(data,cb){
    const hash = crypto.createHmac('sha256', secret)
        .update(data.password)
        .digest('hex');

    db.serialize(function() {
        db.all("SELECT playerPassword FROM Player WHERE playerUser LIKE '" + data.username + "'", function(err, row) {
            if(row.length > 0){
                if (hash == row[0].playerPassword){
                    cb(true);
                }
            } else {
                cb(false);
            }
        });
    });
   // db.close();
};

var isUsernameTaken = function(data,cb){
    db.serialize(function() {
        db.all("SELECT playerId AS id FROM Player WHERE playerUser LIKE '" + data.username + "'", function(err, row) {
            if(row.length > 0){
                cb(true);
            } else {
                cb(false);
            }
        });
    });
    //db.close();
};

var addUser = function(data,cb){
    const hash = crypto.createHmac('sha256', secret)
        .update(data.password)
        .digest('hex');

    db.serialize(function() {
        db.run("INSERT INTO Player(playerName, playerEmail, playerPassword, playerUser) VALUES ('f','f','" + hash + "','" + data.username + "')");
    });
    //db.close();
    cb();
};

/**
 * Ciclo de loop
 */
setInterval(function () {
    var pack = {
        player:Player.update()
    };

    for (var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('serverStatus',{
            playerCount : playerCount,
            timestamp : new Date()
        });
        socket.emit('playersList',pack);
    }
}, CYCLE_TIME);

