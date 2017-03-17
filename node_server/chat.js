/**
 *
 * Plugin : Apex chat
 * Version: 1.0.0
 *
 * Author : isabolic99
 * Mail   : sabolic.ivan@gmail.com
 * Twitter: @isabolic99
 */

(function() {
    const express = require('express');
    const http = require('http');
    const socketio = require('socket.io');
    const winston = require('winston');
    const mkdirp = require('mkdirp');

    const server_port = 5050;
    //const server_ip_address = '10.73.222.109';
    const server_ip_address = 'playground';


    var app       = express();
    var server    = http.createServer(app);
    var io        = socketio(server, { serveClient: false });


    var wiLogger = new(winston.Logger)({
        transports: [
            new(winston.transports.File)({
                name: 'info-file',
                filename: 'logs/filelog-info.log',
                level: 'info'
            }),
            new(winston.transports.File)({
                name: 'error-file',
                filename: 'logs/filelog-error.log',
                level: 'error'
            })
        ]
    });

    mkdirp("logs", function(err) {
      if (err) {
          wiLogger.log("info","err creating log folder " + err);
      }
    });

    server.listen(server_port, server_ip_address, function () {
      console.log( "Listening on " + server_ip_address + ", server_port " + server_port);
    });

    io.on("connection", function (socket) {
      wiLogger.log("info","connected to socket...");

      socket.room = "room-" + Math.round(new Date().getTime()/1000);;
      socket.join(socket.room);

      socket.emit("ROOM.NAME", socket.room);
      wiLogger.log("info","emit room name..." + socket.room);


      var emit = function(emitCmd, data){
        wiLogger.log("info","emitCmd : " + emitCmd);
        wiLogger.log("info","data : " + JSON.stringify(data));
        wiLogger.log("info","socket.room : " + socket.room);
        if (socket.room){
            socket.in(socket.room).broadcast.emit(emitCmd, data);
        } else {
            socket.broadcast.emit(emitCmd, data);
        }
      }

      socket.on("NEW.MESSAGE", function (data) {
        wiLogger.log("info","new message... " + data);

        emit("NEW.MESSAGE", {
          username: socket.username,
          message: data
        });

      });

      socket.on("SET.ROOM", function(room) {
        wiLogger.log("info", "added to room..." + room);

        if(socket.room !== undefined){
          socket.leave(socket.room);
        }

        socket.room = room;
        socket.join(room);

        if (socket.username !== undefined){
          emit("USER.JOINED", {
            username: socket.username
          });
        }
      });

      socket.on("PUBLIC", function() {
        wiLogger.log("info", "public.." + room);

        if(socket.room !== undefined){
          socket.leave(socket.room);
          socket.room = undefined;
        }

        if (socket.username !== undefined){
          emit("USER.JOINED", {
            username: socket.username
          });
        }
      });


      socket.on("ADD.USER", function (username) {
        wiLogger.log("info", "add user " + username);
        socket.username = username;
        emit("USER.JOINED", {
          username: socket.username
        });
      });

      socket.on("TYPING", function () {
        wiLogger.log("info", socket.username + " is typing...");

        emit("TYPING", {
          username: socket.username
        });
      });

      socket.on("STOP.TYPING", function () {
        emit("STOP.TYPING", {
          username: socket.username
        });
      });

      socket.on("disconnect", function () {
        emit("USER.LEFT", {
          username: socket.username
        });
      });
    });
})();
