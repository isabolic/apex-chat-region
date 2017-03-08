var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, { serveClient: false });
var server_port = 5050;
var server_ip_address = '192.168.70.104';

server.listen(server_port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", server_port " + server_port );
});


// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var bounds = {};

io.on('connection', function (socket) {
  var addedUser = false;
  console.log("connected...");


  /**
   ** @description - socket event for chat
   **/
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    console.log("message" + data);
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  /**
   ** @description - socket event for new user
   **/
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    ++numUsers;
    addedUser = true;

    socket.emit('login', {
      numUsers: numUsers,
          allUsers:usernames
    });

    usernames[username] = username;

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

  });

  /**
   ** @description - socket event for typing
   **/
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
    console.log("typing...");
  });

  /**
   ** @description - socket event stop typing
   **/
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
    console.log("stop typing...");
  });

  /**
   ** @description - socket event user disconnecting
   **/
  socket.on('disconnect', function () {
    console.log("disconnect");
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});