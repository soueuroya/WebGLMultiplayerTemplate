/*
*@autor: Daniel Corbi Boldrin
*@description:  Server Javascript code for the WebGL socket Multiplayer Template Project
*/
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use("/public/TemplateData",express.static(__dirname + "/public/TemplateData"));
app.use("/public/Build",express.static(__dirname + "/public/Build"));
app.use(express.static(__dirname+'/public'));

var clients = [];
var clientLookup = {};
var rooms = [];
var roomLookup = {};
var sockets = {};

io.on('connection', function(socket){
	console.log('A user ready for connection!: ' + socket);
	var currentUser;
	var currentRoom;
	
	socket.on('PING', function (_pack)
	{
		var pack = JSON.parse(_pack);	
	    console.log('message from user# '+socket.id+": "+pack.msg);
		socket.emit('PONG', socket.id,pack.msg);
	});
	
	socket.on('JOIN_MULTIPLAYER', function (_data) // receiving player
	{
	    console.log('[JOIN_MULTIPLAYER] JOIN_MULTIPLAYER received!');
		
		var data = JSON.parse(_data);
        currentUser = {
			       name:data.name,
			       id:socket.id,
				   socketID:socket.id,
				   };
				   
		clients.push(currentUser);
		clientLookup[currentUser.id] = currentUser;
		socket.emit("JOIN_MULTIPLAYER_SUCCESS",currentUser.id,currentUser.name);
         
		clients.forEach( function(i) {
		    if(i.id!=currentUser.id)
			{ 
		      socket.emit('PLAYER_INCOMING',i.id,i.name);
		    }
	    });
		
		rooms.forEach( function(room) {
			socket.emit('ROOM_INCOMING',room.id,room.id,room.name,room.totalPlayers,room.isStarted);
			  
			room.allPlayers.forEach( function(player) {
				if (room.id != player.id)
				{
					socket.emit('JOIN_ROOM_SUCCESS',room.id,player.id);
				}
			});
			room.confirmedPlayers.forEach( function(player) {
				socket.emit("READY_ROOM_SUCCESS",room.id,player.id);
			});
		});
		
		socket.broadcast.emit('PLAYER_INCOMING',currentUser.id,currentUser.name);
	});//END_JOIN_MULTIPLAYER
	
	socket.on('CREATE_ROOM', function (_data) // receiving room
	{
	    console.log('[CREATE_ROOM] CREATE ROOM received!');
		
		var data = JSON.parse(_data);
        currentRoom = {
			       id:currentUser.id,
				   name:"Room",
				   totalPlayers: 1,
				   allPlayers: [],
				   confirmedPlayers: [],
				   startedPlayers: [],
				   isStarted: false
				   };
		currentRoom.allPlayers.push(clientLookup[currentUser.id]);
		console.log('[CREATE_ROOM] room '+currentRoom.name+': created!');
		rooms.push(currentRoom);
		roomLookup[currentRoom.id] = currentRoom;
		socket.emit("CREATE_ROOM_SUCCESS",currentRoom.id,currentRoom.name);
		socket.broadcast.emit('ROOM_INCOMING',currentRoom.id,currentUser.id,currentRoom.name,currentRoom.totalPlayers);
		
		console.log('[CREATE_ROOM] Total rooms: ' + rooms.length);
	});//END_CREATE_ROOM
	
	socket.on('CLOSE_ROOM', function (_data) // receiving room
	{
		console.log('[CLOSE_ROOM] CLOSE ROOM received!');
		
		var data = JSON.parse(_data);
		var found = false;
	    if(data.id != 0)
		{
			for (var i = 0; i < rooms.length; i++)
			{
				if (rooms[i].id == data.id)
				{
					console.log("Room "+rooms[i].name+" has been closed");
					rooms.splice(i,1);
					socket.emit('CLOSE_ROOM_SUCCESS', data.id);
					socket.broadcast.emit('CLOSE_ROOM_SUCCESS', data.id);
					found = true;
				};
			};
		}
		if(!found)
		{
			console.log('CLOSE_ROOM_FAIL: ' + data.id);
		}
    });//END_CLOSE_ROOM
	
	socket.on('JOIN_ROOM', function (_data) // receiving room and player
	{
	    console.log('[JOIN_ROOM] JOIN ROOM received!');
		
		var data = JSON.parse(_data);
        var joined = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.length < 4)
				{
					roomLookup[data.room].allPlayers.push(clientLookup[data.player]);
					roomLookup[data.room].totalPlayers++;
					socket.emit("JOIN_ROOM_SUCCESS",data.room,data.player);
					socket.broadcast.emit("JOIN_ROOM_SUCCESS",data.room,data.player);
					joined = true;
				}
				else
				{
					console.log('[JOIN_ROOM] Player failed joining room: ' + data.room + " - " + data.player + " room already full");
				}
			}
			else
			{
				console.log('[JOIN_ROOM] Player failed joining room: ' + data.room + " - " + data.player + " room not found");
			}
		}
		else
		{
			console.log('[JOIN_ROOM] Player failed joining room: ' + data.room + " - " + data.player + " client not found");
		}
		if (!joined)
		{
			socket.emit("JOIN_ROOM_FAIL",data.room,data.player);
			console.log('[JOIN_ROOM] Player failed joining room: ' + data.room + " - " + data.player);
		}
		else
		{
			console.log('[JOIN_ROOM] Player joined room: ' + data.room);
		}
	});//END_JOIN_ROOM
	
	socket.on('LEAVE_ROOM', function (_data) // receiving room and player
	{
	    console.log('[LEAVE_ROOM] LEAVE ROOM received!');
		
		var data = JSON.parse(_data);
        var left = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.includes(clientLookup[data.player]))
				{
					if (roomLookup[data.room].confirmedPlayers.includes(currentUser))
					{
						roomLookup[data.room].confirmedPlayers.splice(roomLookup[data.room].confirmedPlayers.indexOf(clientLookup[currentUser.id]),1);
					}
					roomLookup[data.room].allPlayers.splice(roomLookup[data.room].allPlayers.indexOf(clientLookup[data.player]),1); // remove user from room
					roomLookup[data.room].totalPlayers--;
					socket.emit("LEAVE_ROOM_SUCCESS",data.room,data.player);
					socket.broadcast.emit("LEAVE_ROOM_SUCCESS",data.room,data.player);
					left = true;
				}
				else
				{
					console.log('[LEAVE_ROOM] Player failed leaving room: R:' + data.room + " - P:" + data.player + " client not found in the room!");
				}
			}
			else
			{
				console.log('[LEAVE_ROOM] Player failed leaving room: R:' + data.room + " - P:" + data.player + " room not found!");
			}
		}
		else
		{
			console.log('[LEAVE_ROOM] Player failed leaving room: R:' + data.room + " - P:" + data.player + " client not found!");
		}
		if (!left)
		{
			console.log('[LEAVE_ROOM] Player failed leaving room: R:' + data.room + " - P:" + data.player);
		}
		else
		{
			console.log('[LEAVE_ROOM] Player P:' + data.player + ' left room: R:' + data.room);
		}
	});//END_LEAVE_ROOM
	
	socket.on('READY_ROOM', function (_data) // receiving room and player
	{
	    console.log('[READY_ROOM] READY ROOM received!' + _data);
		
		var data = JSON.parse(_data);
        var left = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.includes(clientLookup[data.player]))
				{
					if (!roomLookup[data.room].confirmedPlayers.includes(clientLookup[data.player]))
					{
						roomLookup[data.room].confirmedPlayers.push(clientLookup[data.player]);
						socket.emit("READY_ROOM_SUCCESS",data.room,data.player);
						socket.broadcast.emit("READY_ROOM_SUCCESS",data.room,data.player);
						left = true;
					}
					else
					{
						console.log('[READY_ROOM] Player failed readying room: R:' + data.room + " - P:" + data.player + " client already in confirmed list!");
					}
				}
				else
				{
					console.log('[READY_ROOM] Player failed readying room: R:' + data.room + " - P:" + data.player + " client not found in the room!");
				}
			}
			else
			{
				console.log('[READY_ROOM] Player failed readying room: R:' + data.room + " - P:" + data.player + " room not found!");
			}
		}
		else
		{
			console.log('[READY_ROOM] Player failed readying room: R:' + data.room + " - P:" + data.player + " client not found!");
		}	
		
		if (!left)
		{
			console.log('[READY_ROOM] Player failed readying room: R:' + data.room + " - P:" + data.player);
		}
		else
		{
			console.log('[READY_ROOM] Player P:' + data.player + ' readyed room: R:' + data.room);
		}
	});//END_READY_ROOM
	
	socket.on('UNREADY_ROOM', function (_data) // receiving room and player
	{
	    console.log('[UNREADY_ROOM] UNREADY ROOM received!' + _data);
		
		var data = JSON.parse(_data);
        var left = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.includes(clientLookup[data.player]))
				{
					if (roomLookup[data.room].confirmedPlayers.includes(clientLookup[data.player]))
					{
						roomLookup[data.room].confirmedPlayers.splice(roomLookup[data.room].confirmedPlayers.indexOf(clientLookup[data.player]),1); // remove user from confirmed players
						socket.emit("UNREADY_ROOM_SUCCESS",data.room,data.player);
						socket.broadcast.emit("UNREADY_ROOM_SUCCESS",data.room,data.player);
						left = true;
					}
					else
					{
						console.log('[UNREADY_ROOM] Player failed unreadying room: R:' + data.room + " - P:" + data.player + " confirmed list does not have player!");
					}
				}
				else
				{
					console.log('[UNREADY_ROOM] Player failed unreadying room: R:' + data.room + " - P:" + data.player + " client not found in the room!");
				}
			}
			else
			{
				console.log('[UNREADY_ROOM] Player failed unreadying room: R:' + data.room + " - P:" + data.player + " room not found!");
			}
		}
		else
		{
			console.log('[UNREADY_ROOM] Player failed unreadying room: R:' + data.room + " - P:" + data.player + " client not found!");
		}	
		
		if (!left)
		{
			console.log('[UNREADY_ROOM] Player failed unreadying room: R:' + data.room + " - P:" + data.player);
		}
		else
		{
			console.log('[UNREADY_ROOM] Player P:' + data.player + ' unreadyed room: R:' + data.room);
		}
	});//END_UNREADY_ROOM
	
	socket.on('KICK_PLAYER', function (_data) // receiving room and player
	{
	    console.log('[KICK_PLAYER] KICK_PLAYER received!' + _data);
		
		var data = JSON.parse(_data);
        var kicked = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.includes(clientLookup[data.player]))
				{
					roomLookup[data.room].allPlayers.splice(roomLookup[data.room].allPlayers.indexOf(clientLookup[data.player]),1); // remove user from room
					roomLookup[data.room].totalPlayers--;
					socket.emit("LEAVE_ROOM_SUCCESS",data.room,data.player);
					socket.broadcast.emit("LEAVE_ROOM_SUCCESS",data.room,data.player);
					if (roomLookup[data.room].confirmedPlayers.includes(clientLookup[data.player]))
					{
						roomLookup[data.room].confirmedPlayers.splice(roomLookup[data.room].confirmedPlayers.indexOf(clientLookup[data.player]),1); // remove user from confirmed players
					}
					kicked = true;
				}
				else
				{
					console.log('[KICK_PLAYER] Player failed leaving/kicked from room: R:' + data.room + " - P:" + data.player + " client not found in the room!");
				}
			}
			else
			{
				console.log('[KICK_PLAYER] Player failed leaving/kicked from room: R:' + data.room + " - P:" + data.player + " room not found!");
			}	
		}
		else
		{
			console.log('[KICK_PLAYER] Player failed leaving/kicked from room: R:' + data.room + " - P:" + data.player + " client not found!");
		}			
		
		if (!kicked)
		{
			console.log('[KICK_PLAYER] Player failed leaving/kicked from room: R:' + data.room + " - P:" + data.player);
		}
		else
		{
			console.log('[KICK_PLAYER] Player P:' + data.player + ' left/kicked from room: R:' + data.room);
		}
	});//END_KICK_PLAYER
	
	socket.on('START_ROOM', function (_data) //receiving room
	{
		console.log('[START_ROOM] START ROOM received!');
		
		var data = JSON.parse(_data);
		var found = false;
	    if(data.id != 0)
		{
			for (var i = 0; i < rooms.length; i++)
			{
				if (rooms[i].id == data.id)
				{
					console.log("Room "+rooms[i].name+" has been started");
					rooms[i].isStarted = true
					socket.emit('START_ROOM_SUCCESS', data.id);
					socket.broadcast.emit('START_ROOM_SUCCESS', data.id);
					found = true;
				};
			};
		}
		if(!found)
		{
			console.log('START_ROOM_FAIL: ' + data.id);
		}
    });//END_START_ROOM
	
	socket.on('START_GAME', function (_data) // room and player
	{
	    console.log('[START_GAME] START GAME received!' + _data);
		
		var data = JSON.parse(_data);
        var started = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.includes(clientLookup[data.player]))
				{
					if (!roomLookup[data.room].startedPlayers.includes(clientLookup[data.player]))
					{
						roomLookup[data.room].startedPlayers.push(clientLookup[data.player]);
						socket.emit("START_GAME_SUCCESS",data.room,data.player);
						socket.broadcast.emit("START_GAME_SUCCESS",data.room,data.player);
						started = true;
					}
					else
					{
						console.log('[START_GAME] Player failed starting game: R:' + data.room + " - P:" + data.player + " client already in started list!");
					}
				}
				else
				{
					console.log('[START_GAME] Player failed starting game: R:' + data.room + " - P:" + data.player + " client not found in the room!");
				}
			}
			else
			{
				console.log('[START_GAME] Player failed starting game: R:' + data.room + " - P:" + data.player + " room not found!");
			}
		}
		else
		{
			console.log('[START_GAME] Player failed starting game: R:' + data.room + " - P:" + data.player + " client not found!");
		}	
		
		if (!started)
		{
			console.log('[START_GAME] Player failed starting game: R:' + data.room + " - P:" + data.player);
		}
		else
		{
			console.log('[START_GAME] Player P:' + data.player + ' started game: R:' + data.room);
		}
	});//END_START_GAME
	
	socket.on('END_GAME', function (_data) // room and player
	{
	    console.log('[END_GAME] END GAME received!' + _data);
		
		var data = JSON.parse(_data);
        var ended = false;
		if (clientLookup[data.player] != null)
		{
			if (roomLookup[data.room] != null)
			{
				if (roomLookup[data.room].allPlayers.includes(clientLookup[data.player]))
				{
					if (roomLookup[data.room].startedPlayers.includes(clientLookup[data.player]))
					{
						roomLookup[data.room].startedPlayers.splice(roomLookup[data.room].startedPlayers.indexOf(clientLookup[data.player]),1); // remove user from started players
						socket.emit("END_GAME_SUCCESS",data.room,data.player);
						socket.broadcast.emit("END_GAME_SUCCESS",data.room,data.player);
						ended = true;
					}
					else
					{
						console.log('[END_GAME] Player failed ending game: R:' + data.room + " - P:" + data.player + " started list does not have player!");
					}
				}
				else
				{
					console.log('[END_GAME] Player failed ending game: R:' + data.room + " - P:" + data.player + " client not found in the room!");
				}
			}
			else
			{
				console.log('[END_GAME] Player failed ending game: R:' + data.room + " - P:" + data.player + " room not found!");
			}
		}
		else
		{
			console.log('[END_GAME] Player failed ending game: R:' + data.room + " - P:" + data.player + " client not found!");
		}	
		
		if (!ended)
		{
			console.log('[END_GAME] Player failed ending game: R:' + data.room + " - P:" + data.player);
		}
		else
		{
			console.log('[END_GAME] Player P:' + data.player + ' ended game: R:' + data.room);
		}
	});//END_END_GAME
	
	socket.on('MOVE_AND_ROTATE', function (_data) // receiving position, rotation and velocity
	{
		console.log('[MOVE_AND_ROTATE] MOVE AND ROTATE received! ' + _data);
		
		var data = JSON.parse(_data);	
		if(data.local_player_id == currentUser.id)
		{
			currentUser.position = data.position;
			currentUser.rotation = data.rotation;
			currentUser.velocity = data.velocity;
			socket.broadcast.emit('UPDATE_MOVE_AND_ROTATE', currentUser.id,currentUser.position,currentUser.rotation,currentUser.velocity);
		}
	});//END_MOVE_AND_ROTATE
	
	socket.on('disconnect', function ()
	{
	    if(currentUser)
		{
			currentUser.isDead = true;
			for (var i = 0; i < clients.length; i++)
			{
				if (clients[i].id == currentUser.id) 
				{
					if (currentRoom != null && currentRoom.id != null)
					{
						for (var j = 0; j < rooms.length; j++)
						{
							if (rooms[j].allPlayers.includes(currentUser))
							{
								if (rooms[j].confirmedPlayers.includes(currentUser))
								{
									rooms[j].confirmedPlayers.splice(rooms[j].confirmedPlayers.indexOf(clientLookup[currentUser.id]),1);
								}
								if (rooms[j].startedPlayers.includes(currentUser))
								{
									rooms[j].startedPlayers.splice(rooms[j].startedPlayers.indexOf(clientLookup[currentUser.id]),1);
								}
								rooms[j].allPlayers.splice(rooms[j].allPlayers.indexOf(clientLookup[currentUser.id]),1); // remove user from room
								rooms[j].totalPlayers--;
								socket.emit('LEAVE_ROOM_SUCCESS', rooms[j].id, currentUser.id);
								socket.broadcast.emit('LEAVE_ROOM_SUCCESS', rooms[j].id, currentUser.id);
								console.log("Player in the room: "+rooms[j].id+" has been disconnected!");
							}
							if (rooms[j].id == currentUser.id)
							{
								socket.emit('CLOSE_ROOM_SUCCESS', rooms[j].id);
								socket.broadcast.emit('CLOSE_ROOM_SUCCESS', rooms[j].id);
								console.log("Owner of the room: "+rooms[j].id+" has been disconnected");
								rooms.splice(j,1);
							}
						}
					}
					console.log("User "+clients[i].name+" has disconnected");
					clients.splice(i,1);
				}
				else
				{
					console.log("User "+clients[i].name+" could not be disconnected");
				}
			}
			socket.broadcast.emit('USER_DISCONNECTED', currentUser.id);
			console.log("Clients left connected: ");
			for(var i = 0; i < clients.length; i++)
			{
				console.log(" - " + clients[i].name);	
			}
		}
    });//END_SOCKET_ON_disconnect
});//END_IO.ON

http.listen(process.env.PORT || 7777, function(){
	console.log('listening on *:7777');
});
console.log("------- server is running -------");