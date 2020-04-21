//app.js
//run the pictionary app

const express = require('express');
const path = require('path')
var io = require('socket.io').listen(app)


var app = require('http').createServer(handler)

var app = express();

app.use('/', express.static(path.join(__dirname, 'public')))

//var static = require('node-static') // for serving files

// This will make all the files in the current folder
// accessible from the web
//var fileServer = new static.Server('./')
app.use('/css', express.static(path.join(__dirname, '/css')))
app.use('/js', express.static(path.join(__dirname, '/js')))
app.use('/socket.io', express.static(path.join(__dirname, '/socket.io')))

app.use('/img', express.static(path.join(__dirname, '/img')))

app.use(express.static(path.join(__dirname,'public')))
// This is the port for our web server.
// you will need to go to http://localhost:8080 to see it

app.get('/', async (req, res) => {
      res.sendFile(path.join(__dirname + '/index.html'))
    });
// // If the URL of the socket server is opened in a browser
// function handler (request, response) {

//     request.addListener('end', function () {
//         fileServer.serve(request, response) // this will return the correct file
//     })
// }
app.listen(10080);
// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

    // Start listening for mouse move events
    socket.on('mousemove', function (data) {

        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
    socket.broadcast.emit('moving', data)
    })
})