const express = require('express')
const app = express()
const path = require('path')
const _ = require ('lodash')
const fs = require('fs')
const ioServer = require('socket.io')
var io = new ioServer()

if(fs.existsSync('keys/privkey2.pem')){
	const https_port = 5443
	const privateKey = fs.readFileSync('keys/privkey2.pem', 'utf8')
	const certificate = fs.readFileSync('keys/cert2.pem', 'utf8')
	const ca = fs.readFileSync('keys/fullchain2.pem', 'utf8')
	const credentials = {key: privateKey,cert: certificate,ca: ca}
	const https = require('https').createServer(credentials, app)
	io.attach(https)
	https.listen(https_port, () => {console.log(`HTTPS Server running on port ${https_port}`)})
}else{
	const http_port = 5000
	const http = require('http').Server(app)
	io.attach(http)
	http.listen(http_port, function() {console.log(`Listening on ${http_port}`)})
}
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
})
app.get('/public/css/style.css', function(req, res) {
   res.sendFile(path.join(__dirname,'public/css/style.css'))})
app.use('/public/img', express.static(path.join(__dirname, 'public/img')))
//--------------------- SOCKETS ---------------------------- //
//DECLARATIONS
	let sequenceNumberByClient = new Map()
	let chat_storage = []
//SOCKETS
io.on('connection',function(socket){
//--------------------- CONNECTION SOCKET ---------------------------- //
	//SET A DEFAULT CLIENT NUMBER
	if(!sequenceNumberByClient.has(socket)){
		let chat_username = `AnonUser${sequenceNumberByClient.size+1}`
		sequenceNumberByClient.set(socket, {'socket_id': socket.id,'username':chat_username})
		//CLIENT CONNECTED AND LET IT KNOW IT'S ID
		console.info(`Client connected [id=${socket.id}]`)
		//BROADCAST USERS TO EVERYONE (INCLUDING USER CONNECTING)
		io.emit('pictionary_users',JSON.stringify([...sequenceNumberByClient.values()]))
		console.table(sequenceNumberByClient)
		socket.emit('pictionary_id',{'id':socket.id,'chat_username':chat_username})
	}else{
		//SEND ID ON RECONNECT
		chat_username = sequenceNumberByClient.get(socket).username
		socket.emit('pictionary_id',{'id':socket.id,'chat_username':chat_username})
	}
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
		io.emit('pictionary_users',all_users)
		console.log(`Broadcast all users: ${all_users}`)
	})
	socket.on('pictionary_chat', function (options) {
		let chat_options = JSON.parse(options)
		chat_storage.push(chat_options)
		let chat_to_send_obj = {'chat_from':sequenceNumberByClient.get(socket).username,'chat_text':chat_options.chat_text,'id':chat_storage.length}
	
		io.emit('pictionary_chat',JSON.stringify(chat_to_send_obj))
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
		io.emit('pictionary_clearscreen',data)
	})
//--------------------- PICTIONARY ---------------------------- //
	//GOT WORD
	socket.on('pictionary_word', function (data) {
		//GOT WORD DATA
		io.emit('pictionary_word',{'username':sequenceNumberByClient.get(socket).username,'difficulty':data.difficulty})

	})
//--------------------- DISCONNECT ---------------------------- //
   	//CLIENT DISCONNECT
   	socket.on('disconnect', function () {
		let discon_user = sequenceNumberByClient.get(socket).username
        sequenceNumberByClient.delete(socket)
        console.info(`Client gone [id=${socket.id}] [user=${discon_user}]`)
    	io.emit('pictionary_user_disconnect',{'discon_user':discon_user})

    })

})