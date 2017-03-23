var tools = require('./server/initServer');
var serverDateStart, serverDateNow, serverDateEnd;

// Setup do servidor
var app = tools.initServer();
var serv  = require("http").Server(app);
serv.listen(2000); // liga o servidor em determinada porta

serverDateNow=serverDateStart = new Date();

console.log(serverDateStart + ' ->World@War Public Server pré-alpha Started...');

var SOCKET_LIST = {}; // lista de ligacoes
var PLAYERS_LIST = {}; // lista de jogadores
var playerCount = 0;

var Player = function (id,name) {
    var self = {
        name : name,
        id : id,
        number : "" + Math.floor(10 * Math.random()),
        x : 0,
        y : 0,
        local : 0
    }
    return self;
}

var io  = require('socket.io') (serv,{});
io.sockets.on('connection', function (socket) {

    socket.id = Math.random() ;//Math.floor(10 * Math.random()) ;
    socket.ip = socket.handshake.address; // guarda ip

    SOCKET_LIST[socket.id] = socket; // guarda ligacao na lista

    socket.on('disconnect', function () { // automatico nao necessita de mensagem do cliente
        delete SOCKET_LIST[socket.id]; // elimina a socket
        delete PLAYERS_LIST[socket.id]; // elimina o player

        if (playerCount != 0) {
            playerCount = playerCount -1;
        }

        console.log('player deleted' + ' id: ' + socket.id);
    })

    socket.on("newPlayer", function (data) {
        var playerExists = false;

        for (var i in PLAYERS_LIST){
            var player = PLAYERS_LIST[i];
            if ( player.name == data.name) {
                playerExists = true;
            }
        }

        if (!playerExists) {
            var player = Player(socket.id); // cria novo player
            player.name = data.name;
            player.local = data.local;

            PLAYERS_LIST[socket.id] = player;
            playerCount++;

            socket.emit('playerStatus',{
                login       : true,
                id          : socket.id,
                name        : player.name,
                playerCount : playerCount,
                local       : player.local
            });

            console.log("Player: " + player.name + " added!");
        } else {
            socket.emit('playerStatus',{
                login : false
            });

            //console.log("Player: " + player.name + " exists!");
        }

    });

    console.log('new socket connection' + ' id: ' + socket.id + " ip: " + socket.ip);

});

var add_minutes =  function (dt, minutes) {
    return new Date(dt.getTime() + minutes*60000);
}


/**
 * Ciclo de loop a cada 60 segundos (1 minuto)
 */
setInterval(function () {

    //serverDateNow = add_minutes(serverDateNow,1);
        var pack = [];

        for (var i in PLAYERS_LIST) {
            var player = PLAYERS_LIST[i];
            pack.push({
                id : player.id,
                name : player.name,
                local : player.local
            });
        }

        for (var i in SOCKET_LIST){
            var socket = SOCKET_LIST[i];
            socket.emit('serverStatus',{
                playerCount : playerCount,
                timestamp : new Date()
            });
            //socket.emit('players',pack);
        }
},60 * 1000); //60s //40ms 1000/25

