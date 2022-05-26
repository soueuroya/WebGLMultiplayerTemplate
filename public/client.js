/*
*@autor: Daniel Corbi Boldrin
*@description:  Client Javascript code for the WebGL socket Multiplayer Template Project
*/
var socket = io() || {};
socket.isReady = false;

window.addEventListener('load', function() {
	var execInUnity = function(method) {
		if (!socket.isReady) return;
		var args = Array.prototype.slice.call(arguments, 1);
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage("MultiplayerManager", method, args.join(':'));
		}		
	};

	socket.on('PONG', function(socket_id,msg) {
		var currentUserAtr = socket_id+':'+msg;
		if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('MultiplayerManager', 'OnPrintPongMsg', currentUserAtr);
		}
	});
	
	socket.on('JOIN_MULTIPLAYER_SUCCESS', function(id,name) {
		var currentUserAtr = id+':'+name;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnJoinMultiplayer', currentUserAtr);
		}
	});
	
	socket.on('PLAYER_INCOMING', function(id,name) {
		var currentUserAtr = id+':'+name;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnPlayerIncoming', currentUserAtr);
		}
	});
	
	socket.on('CREATE_ROOM_SUCCESS', function(id,name) {
	  var currentRoomAtr = id+':'+name;
	   if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnCreateRoom', currentRoomAtr);
		}
	});
	
	socket.on('CLOSE_ROOM_SUCCESS', function(id) {
	  var currentRoomAtr = id;
	   if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnCloseRoom', currentRoomAtr);
		}
	});
	
	socket.on('ROOM_INCOMING', function(roomid,ownerid,roomname,totalPlayers,isStarted) {
		var currentRoomAtr = roomid+':'+ownerid+':'+roomname+':'+totalPlayers+':'+isStarted;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnRoomIncoming', currentRoomAtr);
		}
	});
	
	socket.on('JOIN_ROOM_SUCCESS', function(roomid,playerid) {
		var currentRoomAtr = roomid+':'+playerid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnJoinRoom', currentRoomAtr);
		}
	});

	socket.on('LEAVE_ROOM_SUCCESS', function(roomid,playerid) {
		var currentRoomAtr = roomid+':'+playerid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnLeaveRoom', currentRoomAtr);
		}
	});
		
	socket.on('READY_ROOM_SUCCESS', function(roomid,playerid) {
		var currentRoomAtr = roomid+':'+playerid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnReadyRoom', currentRoomAtr);
		}
	});
		
	socket.on('UNREADY_ROOM_SUCCESS', function(roomid,playerid) {
		var currentRoomAtr = roomid+':'+playerid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnUnreadyRoom', currentRoomAtr);
		}
	});
	
	socket.on('START_ROOM_SUCCESS', function(roomid) {
		var currentRoomAtr = roomid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnStartRoom', currentRoomAtr);
		}
	});
	
	socket.on('START_GAME_SUCCESS', function(roomid,playerid) {
		var currentRoomAtr = roomid+':'+playerid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnStartGame', currentRoomAtr);
		}
	});
		
	socket.on('END_GAME_SUCCESS', function(roomid,playerid) {
		var currentRoomAtr = roomid+':'+playerid;
		if(window.unityInstance!=null)
		{
		  window.unityInstance.SendMessage ('MultiplayerManager', 'OnEndGame', currentRoomAtr);
		}
	});
	
    socket.on('UPDATE_MOVE_AND_ROTATE', function(id,position,rotation,velocity) {
	    var currentUserAtr = id+':'+position+':'+rotation+':'+velocity;
		if(window.unityInstance!=null)
		{
			window.unityInstance.SendMessage ('MultiplayerManager', 'OnUpdateMoveAndRotate',currentUserAtr);
		}
	});
	
	socket.on('USER_DISCONNECTED', function(id) {	
	    var currentUserAtr = id;
		if(window.unityInstance!=null)
		{  
			window.unityInstance.SendMessage ('MultiplayerManager', 'OnUserDisconnected', currentUserAtr);
		}
	});
});

