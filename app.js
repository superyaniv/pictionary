const express = require('express');
let app = express();
let http = require('http').Server(app)
let io = require('socket.io')(http)
let path = require('path')
let _ = require ('lodash')
let port = 5000



app.get('/', function(req, res) {
   res.sendFile(path.join(__dirname,'index.html'))
})
app.get('/public/js/pictionary.js', function(req, res) {
   res.sendFile(path.join(__dirname,'public/js/pictionary.js'))
})
app.get('/wordgen/:difficulty', function(req, res) {
   const difficulty = Math.min(req.params.difficulty+1,3)
   let wordlistobj = require('./wordlist.json')
   let wordlistjson = JSON.parse(JSON.stringify(wordlistobj.words))
   const filtered_set = _.filter(wordlistjson,(item)=>{return item.difficulty==difficulty})
   console.log(filtered_set)
   word = _.sample(filtered_set)
   res.json(JSON.stringify(word))
// 
})

app.get('/public/css/style.css', function(req, res) {
   res.sendFile(path.join(__dirname,'public/css/style.css'))
})
app.use('/public/img', express.static(path.join(__dirname, 'public/img')))


//--------------------- SOCKETS ---------------------------- //
//DECLARATIONS
let sequenceNumberByClient = new Map()
let users = {}
let chat_storage = []

//SOCKETS
io.on('connection',function(socket){

//--------------------- USER SOCKETS ---------------------------- //
	
		//SET A DEFAULT CLIENT NUMBER
		let chat_username = `AnonUser${sequenceNumberByClient.size+1}`
		sequenceNumberByClient.set(socket, {'socket_id': socket.id,'username':chat_username})
		//CLIENT CONNECTEED
		console.info(`Client connected [id=${socket.id}]`)

		//LET CLIENT KNOW IT'S ID
		socket.emit('pictionary_id',{'id':socket.id,'chat_username':chat_username})
		
		//BROADCAST USERS
		socket.broadcast.emit('pictionary_users',JSON.stringify([...sequenceNumberByClient.values()]))
		socket.emit('pictionary_users',JSON.stringify([...sequenceNumberByClient.values()]))
		console.table(users)
		console.table(sequenceNumberByClient)

   	//CLIENT DISCONNECT
   	socket.on('disconnect', function () {
		// let discon_user = sequenceNumberByClient.get(socket).username
        sequenceNumberByClient.delete(socket)
        console.info(`Client gone [id=${socket.id}]`)
    	// socket.emit('user_disconnect',{'discon_user':discon_user})
    })

	//CLIENT WANTS TO SET USERNAME
	socket.on('pictionary_username', function (options) {
		let username_options = JSON.parse(options)

		sequenceNumberByClient.set(socket, {'socket_id': socket.id,'username':`${username_options.username}`})
		console.log(`Client connected [id=${socket.id}] set username to ${username_options.username}`)
		console.table(sequenceNumberByClient)

		let username_set_options = {'username_set':true, 'username':username_options.username}
		socket.emit('pictionary_username',JSON.stringify(username_set_options))
		socket.broadcast.emit('pictionary_username', JSON.stringify(username_set_options))
		console.log(JSON.stringify(username_set_options))

		socket.broadcast.emit('pictionary_users',JSON.stringify(users))
		socket.emit('pictionary_users',JSON.stringify([...sequenceNumberByClient.values()]))
		console.log(`Broadcast all users: ${[...sequenceNumberByClient.values()]}`)
		
	})


//--------------------- CHAT FUNCTIONS ---------------------------- //
	socket.on('pictionary_chat', function (options) {
			let chat_options = JSON.parse(options)
			console.log(chat_options);
			chat_storage.push(chat_options)
			let chat_to_send_obj = {'chat_from':(chat_options.chat_from),'chat_text':chat_options.chat_text,'id':chat_storage.length}
			
			socket.broadcast.emit('pictionary_chat',JSON.stringify(chat_to_send_obj))
			socket.emit('pictionary_chat',JSON.stringify(chat_to_send_obj))
			console.log(JSON.stringify(chat_to_send_obj))
	})



//--------------------- DRAW SOCKET ---------------------------- //

	//MOVING MOUSE BROADCAST
	socket.on('pictionary_mousemove', function (data) {
		//BROADCAST DRAWING
		socket.broadcast.emit('pictionary_moving', data);
	})

	//CLEARSCREEN
	socket.on('pictionary_clearscreen', function (data) {
		socket.broadcast.emit('pictionary_clearscreen',data)
		socket.emit('pictionary_clearscreen',data)
	})


//--------------------- PICTIONARY ---------------------------- //

	//GOT WORD
	socket.on('pictionary_word', function (data) {
		//GOT WORD DATA
		socket.emit('pictionary_word',{'username':sequenceNumberByClient.get(socket).username,'difficulty':data.difficulty})
		socket.broadcast.emit('pictionary_word',{'username':sequenceNumberByClient.get(socket).username,'difficulty':data.difficulty})

	})

})

http.listen(port, function() {
   console.log(`Listening on ${port}`);
});