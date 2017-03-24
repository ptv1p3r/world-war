var tools = require('./server/initServer');
var serverDateStart, serverDateNow;
var SOCKET_LIST = {}; // lista de ligacoes
var playerCount = 0;

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
        name        : '',
        nickname    : '',
        id          : id,
        number      : "" + Math.floor(10 * Math.random()),
        x           : 0,
        y           : 0,
        local       : "",
        bank        : 0.00,
        influence   : 0
    };
    Player.list[id] = self;
    return self;
}

var USERS = {
    //username:password
    "viper":"123",
    "slyer":"123",
    "bob":"1",
    "obo":"1"
};

// Estrutura de PLAYER
Player.list = {};
Player.onConnect = function(socket,data){
    var player = Player(socket.id);
    playerCount++;
    player.name = data.username;
    player.local = "40.0#175.0";
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
            local       : player.local,
            bank        : player.bank,
            influence   : player.influence
        });
    }
    return pack;
};

// Setup do servidor
var app = tools.initServer();
var serv  = require("http").Server(app);
serv.listen(2000); // liga o servidor em determinada porta

serverDateNow=serverDateStart = new Date();
console.log(serverDateStart + ' ->World@War Public Server pré-alpha Started...');

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
    setTimeout(function(){
        cb(USERS[data.username] === data.password);
    },10);
};

var isUsernameTaken = function(data,cb){
    setTimeout(function(){
        cb(USERS[data.username]);
    },10);
};

var addUser = function(data,cb){
    setTimeout(function(){
        USERS[data.username] = data.password;
        cb();
    },10);
};

var add_minutes =  function (dt, minutes) {
    return new Date(dt.getTime() + minutes*60000);
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

