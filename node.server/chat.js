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
    const ip = require("ip");
    const pjson = require('./package.json');

    const server_port = pjson.port;
    const server_ip_address = pjson.server || ip.address();


    let app = express();
    let server = http.createServer(app);
    let io = socketio(server, { serveClient: false });
    let users = [];


    let wiLogger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)(),
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

    app.use("/public", express.static("public"));

    mkdirp("logs", (err) => {
        if (err) {
            wiLogger.log("info", "err creating log folder " + err);
        }
    });

    server.listen(server_port, server_ip_address, () => {
        console.log("Listening on " + server_ip_address + ", server_port " + server_port);
    });

    io.on("connection", (socket) => {
        let emit = (emitCmd, data, socketId) => {
            wiLogger.log("info", "emitCmd : " + emitCmd);
            wiLogger.log("info", "data : " + JSON.stringify(data));
            wiLogger.log("info", "socket.room : " + socket.room);

            if (socketId !== undefined) {
                wiLogger.log("info", "socketId : " + socketId);
                if (socket.room !== undefined) {
                    socket.in(socket.room).broadcast.to(socketId).emit(emitCmd, data);
                } else {
                    io.to(socketId).emit(emitCmd, data);
                }
            } else {

                if (socket.room !== undefined) {
                    socket.in(socket.room).broadcast.emit(emitCmd, data);
                } else {
                    socket.broadcast.emit(emitCmd, data);
                }
            }
        }

        wiLogger.log("info", "connected to socket...");

        socket.room = "room-" + Math.round(new Date().getTime() / 1000);
        socket.join(socket.room);

        socket.emit("room.name", socket.room);
        wiLogger.log("info", "emit room name..." + socket.room);

        socket.on("new.message", (data) => {
            wiLogger.log("info", "new message... " + data);

            emit("new.message", {
                username: socket.username,
                message: data
            });
        });

        socket.on("set.room", (data) => {
            if (data.room === null || data.room === undefined) {
                return;
            }

            if (socket.room !== undefined) {
                wiLogger.log("info", "leaving room..." + socket.room);
                socket.leave(socket.room);
                socket.room = undefined;
            }

            if (data.username !== null || data.username !== undefined) {
                wiLogger.log("info", "add user " + data.username);
                socket.username = data.username;

                emit("user.list", {
                    users: users
                }, socket.id);

                users.push(data.username);
            }

            socket.join(data.room);
            socket.room = data.room;
            wiLogger.log("info", "added to room..." + socket.room);

            if (socket.username !== undefined) {
                emit("user.joined", {
                    username: socket.username
                });
            }

        });

        socket.on("public", (data) => {
            wiLogger.log("info", "public....");

            if (socket.room !== undefined) {
                socket.leave(socket.room);
                socket.room = undefined;
            }

            if (data.username !== null && data.username !== undefined) {
                wiLogger.log("info", "add user to public chat " + data.username);
                socket.username = data.username;

                emit("user.list", {
                    users: users
                }, socket.id);

                users.push(data.username);
            }

            if (socket.username !== undefined) {
                emit("user.joined", {
                    username: socket.username
                });
            }
        });

        socket.on("add.user", (data) => {

            if (data.username === null || data.username === undefined) {
                return;
            }

            wiLogger.log("info", "add user " + data.username);
            socket.username = data.username;
            users.push(data.username);

            emit("user.joined", {
                username: socket.username
            });

        });

        socket.on("typing", () => {
            wiLogger.log("info", socket.username + " is typing...");

            if (socket.username !== undefined) {
                emit("typing", {
                    username: socket.username
                });
            }
        });

        socket.on("stop.typing", () => {

            if (socket.username !== undefined) {
                emit("stop.typing", {
                    username: socket.username
                });
            }
        });

        socket.on("disconnect", () => {
            if (socket.username !== undefined) {
                users = users.filter((i) => {
                    return !(i === socket.username);
                });

                emit("user.left", {
                    username: socket.username
                });
            }
        });
    });
})();
