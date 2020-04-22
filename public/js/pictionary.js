//pictionary.js
//pictionary 

function init() {
	var canvas, ctx, canvasX, canvasY, mouseIsDown = 0,canvasXp,canvasYp;
	var canvas = document.getElementById("picpage");
	var ctx = canvas.getContext("2d");
	// UNIQUE ID FOR THE USER 
	var id = Math.round($.now()*Math.random());
	// DRAWING BOOL
	let drawing = false
	let artists = {}
	let cursors = {}
	let socket = io.connect('')
	var lastEmit = $.now();

	if (canvas.getContext) {
		ctx = canvas.getContext("2d");

		window.addEventListener('resize', resizeCanvas, false);
		window.addEventListener('orientationchange', resizeCanvas, false);
		resizeCanvas();
	}

	function resizeCanvas() {
		canvas.width = window.innerWidth;
	    canvas.height = window.innerHeight;
	}
	
	canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mousemove", mouseXY, false);	
	canvas.addEventListener("touchstart", touchDown, false);
	canvas.addEventListener("touchmove", touchXY, true);
	canvas.addEventListener("touchend", touchUp, false);
	document.body.addEventListener("mouseup", mouseUp, false);
	document.body.addEventListener("touchcancel", touchUp, false);

	function mouseUp() {
		mouseIsDown = 0;
		mouseXY();
	}

	function touchUp() {
		drawing=false
	}

	function mouseDown() {
		mouseIsDown = 1
		mouseXY()
	}

	function touchDown(e) {
		drawing=false
		canvasXp=e.targetTouches[0].pageX - canvas.offsetLeft
		canvasYp=e.targetTouches[0].pageY - canvas.offsetTop
		touchXY()
	}

	function mouseXY(e) {
		if (!e)
		e = event;
		canvasX = e.pageX - canvas.offsetLeft;
		canvasY = e.pageY - canvas.offsetTop;
		if (mouseIsDown)
			drawing = true;

		if (!mouseIsDown){
			drawing = false;
		}
         
		//DRAW FOR THE USER
		if(drawing){
			if($.now() - lastEmit > 30){
				socket.emit('pictionary_mousemove',{
					'x': canvasX,
					'y': canvasY,
					'drawing': drawing,
					'id': id
				})
				lastEmit = $.now();
			}
			drawLine(canvasXp, canvasYp, canvasX, canvasY);
		}
			canvasXp=canvasX
			canvasYp=canvasY
	}

	function touchXY(e) {
		if (!e)
		e = event
		e.preventDefault()
		canvasX = e.targetTouches[0].pageX - canvas.offsetLeft
		canvasY = e.targetTouches[0].pageY - canvas.offsetTop

		if($.now() - lastEmit > 30){
				socket.emit('pictionary_mousemove',{
					'x': canvasX,
					'y': canvasY,
					'drawing': drawing,
					'id': id
			})
			lastEmit = $.now()
		}
		drawing=true
		//drawDot(ctx,canvasX,canvasY,5);
		drawLine(canvasXp, canvasYp, canvasX, canvasY);
		canvasXp=canvasX
		canvasYp=canvasY
	}
	
	function drawDot(ctx,x,y,size) {
		//COLOR SETTING
		r=0; g=0; b=0; a=255;

		// FILL STYLE
		ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";

        // CIRCLE
		ctx.beginPath();
		ctx.arc(x, y, size, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();
    } 

    var chat_username
	
//-----USER FUNCTIONS ------------------------------------------------------------- //
	//RECEIVE ID
	socket.on('pictionary_id', (data)=>{
		let id=data.id
		chat_username=data.chat_username 
		$('#chat_username').text(`[ Username: ${chat_username} ]`)
		console.log(id,chat_username)
	})
	
	//SET USERNAME
	socket.on('pictionary_username',function(options){
		let username_options = JSON.parse(options)
		username_options.username_set ? (chat_username = username_options.username) : alert('Error, username already in use.')
		pictionary_alert(`<strong>Success:</strong> User set his <strong>username</strong> to <mark class='h5'>${username}</mark>.  <em>What's up ${username}</em>?!`,'success',10000)
	})
	
	//RECEIVE USER IDS AND HOW MANY ARE CONNECTED
	socket.on('pictionary_users', function (data) {
		var userdata = JSON.parse(data)
		var userids = Object.entries(userdata)
		uis = []
		Object.entries(userdata).forEach((i)=>{(typeof(i[1].username)!='undefined') ? uis.push(i[1].username) : ''})
		var useridstring = userids.map(function(k){if(typeof(k[1].username)=='undefined'){return k[0]}else{return k[1].username}}).join(', ')
		var users_num = userids.length
		pictionary_alert(`There are <strong>${users_num}</strong> users connected. ${useridstring}`,'primary',5000)
		pictionary_stats(
			{'users':users_num,
			'usernames':useridstring,
			'time':Date(Date.now()),
			'status':'OK'})

	})
	socket.on('pictionary_user_disconnect',function(options){
			let discon_username = options.discon_user
			pictionary_alert(`${discon_username} has left.`,'info',10000)
	})
	
	//RECEIVE USER IDS AND HOW MANY ARE CONNECTED

	//SETTING USERNAME FOR YOURSELF
	$('#set_my_username').click(event=>{
			username_options = {
				'username':$('#username_input').val()
			}
			//CHANGE USER NAME=
			socket.emit('pictionary_username',JSON.stringify(username_options))
			console.log(username_options)
			var username = $('#username_input').val()
			$('#username_set').modal('hide')
			$('#chat_username').text(`\t [Username: ${$('#username_input').val()} ]`)
			$('#chat_username').attr('style','')
		})
	$('#username_input').keypress(event=>{
		if ( event.which == 13 ) {
			event.preventDefault()
			$('#set_my_username').trigger('click')
		}
	})
	

//-----DRAWING FUNCTIONS AND SOCKETS ------------------------------------------------------------- //

	//GET MOVING MICE OF EVERYONE
	socket.on('pictionary_moving', function (data) {
		if(! (data.id in artists)){
			// CREATE CURSOR FOR NEW USER 
			cursors[data.id] = $('<div class="cursor">').appendTo('#cursors')
		}
			// MOUSE MOVE
			cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		})
		//USER DRAW
    	if(data.drawing && artists[data.id]){
			drawLine(artists[data.id].x, artists[data.id].y, data.x, data.y)
	    }
			artists[data.id] = data
			artists[data.id].updated = $.now()
	})
	var prev = {};
	
	$(document).on('mousemove',function(pos){
	    if($.now() - lastEmit > 30){
	       socket.emit('pictionary_mousemove',{
				'x': pos.pageX,
				'y': pos.pageY,
				'drawing': drawing,
				'id': id
	        });
	        lastEmit = $.now();
	    }
	})
	//--CLEAR TEH SCREEN
	socket.on('pictionary_clearscreen', function (data) {
	 		clearScreen(data)
	    })
	//REMOVE IDLE artists
	setInterval(function(){
		for(ident in artists){
			if($.now() - artists[ident].updated > 30000){
			// REMOVE USER AFTER X SECONDS (30)
			cursors[ident].remove();
			delete artists[ident];
		}
	}
	},30000);

	function drawLine(fromx, fromy, tox, toy){
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}
	$('#setColors > a').click((a)=>{
		a.preventDefault();
		ctx.strokeStyle = a.target.attributes.id.value.split('-')[1]
		console.log(a.target.attributes.id.value.split('-')[1])
	})


//------ CHATTING FUNCTIONS AND SOCKETS ------------------------------------------------------------- //

	//GET CHAT MESSAGES
	socket.on('pictionary_chat',function(options){
		let chat_options = JSON.parse(options)
		console.log(chat_options)
		let new_chat = `<p id='${chat_options.id}' class='p-0 m-0'><small><strong>${(String(chat_options.chat_from).padEnd(' ',10)).substr(0,10)}</strong> : ${chat_options.chat_text}</small></p>`
		$('#chat_area').append(new_chat)
		console.log(chat_options.id)
		$('#'+chat_options.id).fadeIn(3000,'swing')
		$('#'+chat_options.id).fadeOut(3000)

		//setTimeout(new_chat.fadeOut(),10000)
		
	})
	
	// WRITE TEXT TO SEND IN TEH CHAT BAR
	$('#submit_chat').click(event=>{
		let chat_text = $('#chat_to_send').val()
		let chat_from=chat_username
		
		let chat_options = {
					'chat_text':chat_text,
					'chat_from':chat_from
				}
		console.log(chat_options)
		socket.emit('pictionary_chat',JSON.stringify(chat_options))
		$('#chat_to_send').val('')
	})
	$('#chat_to_send').keypress(event=>{
		if ( event.which == 13 ) {
			event.preventDefault()
			$('#submit_chat').trigger('click')
		}
	})

//----- PICTIONARY-RELATED SOCKET EMITS ------------------------------------------------------------- //
	//SOMEONE RECEIVED WORD
	socket.on('pictionary_word',function(word_data){
		pictionary_alert(`New Word Alert: <span class='h5'>${word_data.username}</span> recieved a new word @ difficulty: <strong>${word_data.difficulty}</strong>`,
			'info',
			10000)
		//setTimeout(new_chat.fadeOut(),10000)
		
	})

//------- OTHER JS FUNCTION ------------------------------------------------------------- //

	$('#get_word_modal .dropdown-item').click(function(e){
		   $('#choose_word_difficulty').text(this.innerHTML)
		})
	$('#go_get_word').click(function(e){
				let word_difficulty = ['Easy','Medium','Hard','Expert'].indexOf($('#choose_word_difficulty').text())
		   		socket.emit('pictionary_word',{username:'','difficulty':word_difficulty})	
		   		console.log(word_difficulty)
		   		$.ajax({
				url: '/wordgen/'+word_difficulty,
				dataType: 'json',                   
				success: function (data){
					console.log(data)
					word = JSON.parse(data).word
					$('#word_chosen').text(`${word}`)
					$('#word_chosen').attr('style','text-transform:capitalize;box-shadow: 0 0 5px #51CBEE;align:right')
					
				},
				error:function(e){console.log(e)}
				})
		   	})

	let chat_noshow=false	


	$('#chat_close').click(function(event){
		event.preventDefault()
		if(!chat_noshow){
			$('#pictionary_chat > *').hide()
			$('#chat_row').show()
			$('#chat_row .alert-heading').attr('style','font-size:.75em;')
			$('#chat_close > span').html('&#9650; ')
			$('#chat_close').show()
			chat_noshow=true
		}else{
			$('#pictionary_chat > *').show()
			$('#chat_row .alert-heading').attr('style','')
			$('#chat_close > span').html('&#9660;')
			chat_noshow=false
		}

	})
	function clearScreen(data){
		canvas=document.getElementById('picpage')
		const context = canvas.getContext('2d')
		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.beginPath();
		console.log('cleared')
	}
	$('#clearscreen_all').click(function (e){
		e.preventDefault()   
		socket.emit('pictionary_clearscreen',{username:'','clear':true})
	})
	//------- OTHER JS FUNCTION ------------------------------------------------------------- //
	function pictionary_alert(message,type,timing){
		if(!chat_noshow){
			$('pictionary_alert').attr('style','padding-bottom: '+($('#pictionary_chat').height()+20))
			let pic_alert = $('<div>')
			.addClass(`alert alert-${type} alert-dismissable fade show`)
			.attr('role','alert')
			.html(message)
			.appendTo($('#pictionary_alert'))
			.fadeOut(timing)
		}
	}
	function pictionary_stats(options){
		console.log(options)

		$('#pictionary_STATS').html('')
		let stat_div = $('<div>')
			.addClass(`card p-0 m-2`)
			.attr('style','width: 25rem;border:none')
		let stat_div_header = $('<div>')
			.addClass('card-title')
			.html('PICTIONARY STATS')
			.appendTo(stat_div)
		let stat_div_body = $('<div>')
			.addClass('card-body p-0')
			.appendTo(stat_div)
		let stat_div_row = $(`<div class='row'>`).appendTo(stat_div_body)
			for(prop in options){
				$('<dt>')
					.addClass('col-md-4 card-text')
					.html(`<strong>${prop}</strong>`)
			.attr('style','text-transform:capitalize; white-space: nowrap;overflow: hidden;text-overflow: ellipsis')
					.appendTo(stat_div_row)
				$('<dd>')
					.addClass('col-md-8 card-text text-muted')
					.html(`${options[prop]}`)
			.attr('style','text-transform:capitalize; white-space: nowrap;overflow: hidden;text-overflow: ellipsis')
					.appendTo(stat_div_row)
			}
		stat_div.appendTo($('#pictionary_STATS'))
			
	}

}