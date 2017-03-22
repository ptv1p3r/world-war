var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

var serv  = require("http").Server(app);

app.get('/',function (req, res) {
    res.sendFile(__dirname + 'public/index.html');
});

serv.listen(2000); // liga o servidor em determinada porta
console.log('World@War Public Server pré-alpha Started...');

var SOCKET_LIST = {}; // lista de ligacoes
var PLAYERS_LIST = {}; // lista de jogadores
var playerCount = 0;

var Player = function (id,name) {
    var self = {
        name : name,
        id : id,
        number : "" + Math.floor(10 * Math.random()),
        x : 0,
        y : 0
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

    console.log('new socket connection' + ' id: ' + socket.id + " ip: " + socket.ip);

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

            PLAYERS_LIST[socket.id] = player;
            playerCount++;

            socket.emit('playerStatus',{
                login   : true,
                id      : socket.id,
                name    : player.name
            });

            console.log("Player: " + player.name + " added!");
        } else {
            socket.emit('playerStatus',{
                login : false
            });

            console.log("Player: " + player.name + " exists!");
        }

    });

});

setInterval(function () {

        for (var i in SOCKET_LIST) {
            var socket = SOCKET_LIST[i];
            socket.emit('playersCount',{
                total : playerCount
            });
        }

},1000/25); //40ms

