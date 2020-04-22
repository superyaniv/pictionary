const express = require('express')
const app = express()
const http = require('http').Server(app)
const https = require('https')
const io = require('socket.io')(http)
const path = require('path')
const _ = require ('lodash')
const http_port = 5000
const https_port = 5443
const fs = require('fs')

	// // REQUIRE HTTPS
	// function requireHTTPS(req, res, next) {
	// 	  // The 'x-forwarded-proto' check is for Heroku
	// 	  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
	// 	    return res.redirect('https://' + req.get('host') + req.url);
	// 	  }
	// 	  next();
	// }
	// // COMMENT OUT IF NOT ON SERVER
	// app.use(requireHTTPS);


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
let chat_storage = []

//SOCKETS
io.on('connection',function(socket){

//--------------------- CONNECTION SOCKET ---------------------------- //
	
		//SET A DEFAULT CLIENT NUMBER
		let chat_username = `AnonUser${sequenceNumberByClient.size+1}`
		sequenceNumberByClient.set(socket, {'socket_id': socket.id,'username':chat_username})
		
		//CLIENT CONNECTED AND LET IT KNOW IT'S ID
		socket.emit('pictionary_id',{'id':socket.id,'chat_username':chat_username})
		console.info(`Client connected [id=${socket.id}]`)

		//BROADCAST USERS TO EVERYONE (INCLUDING USER CONNECTING)
		socket.broadcast.emit('pictionary_users',JSON.stringify([...sequenceNumberByClient.values()]))
		socket.emit('pictionary_users',JSON.stringify([...sequenceNumberByClient.values()]))
		console.table(sequenceNumberByClient)

//--------------------- CHAT FUNCTIONS ---------------------------- //
	//CLIENT WANTS TO SET USERNAME
	socket.on('pictionary_username', function (options) {
		let username_options = JSON.parse(options)

		//SET USERNAME IN MAP
		sequenceNumberByClient.set(socket, {'socket_id': socket.id,'username':`${username_options.username}`})
		console.log(`Client connected [id=${socket.id}] set username to ${username_options.username}`)

		//SEND SET USERNAME BACK TO USER
		let username_set_options = {'username_set':true, 'username':username_options.username}
		socket.emit('pictionary_username',JSON.stringify(username_set_options))

		//BROADCAST ALL USERS
		let all_users = JSON.stringify([...sequenceNumberByClient.values()])
		socket.broadcast.emit('pictionary_users',all_users)
		socket.emit('pictionary_users',all_users)
		console.log(`Broadcast all users: ${all_users}`)
		
	})

	socket.on('pictionary_chat', function (options) {
			let chat_options = JSON.parse(options)
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

//--------------------- DISCONNECT ---------------------------- //
   	//CLIENT DISCONNECT
   	socket.on('disconnect', function () {
		let discon_user = sequenceNumberByClient.get(socket).username
        sequenceNumberByClient.delete(socket)
        console.info(`Client gone [id=${socket.id}]`)
    	socket.emit('pictionary_user_disconnect',{'discon_user':discon_user})
    })

})
//CERTS - PRIVATE KEYS
	


http.listen(http_port, function() {
   console.log(`Listening on ${http_port}`);
})

if(fs.existsSync('keys/privkey2.pem')){
	const privateKey = fs.readFileSync('keys/privkey2.pem', 'utf8')
		const certificate = fs.readFileSync('keys/cert2.pem', 'utf8')
		const ca = fs.readFileSync('keys/fullchain2.pem', 'utf8')

		const credentials = {
			key: privateKey,
			cert: certificate,
			ca: ca
		};

	const httpsServer = https.createServer(credentials, app);

	httpsServer.listen(https_port, () => {
		console.log(`HTTPS Server running on port ${https_port}`);
	})
}
