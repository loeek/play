//events (publish subscribe)
var events = {
	events: {},
	on: function (eventName, fn) {
		this.events[eventName] = this.events[eventName] || [];
		this.events[eventName].push(fn);
	},
	off: function(eventName, fn) {
		if (this.events[eventName]) {
			for (var i = 0; i < this.events[eventName].length; i++) {
				if (this.events[eventName][i] === fn) {
					this.events[eventName].splice(i, 1);
					break;
				}
			};
		}
	},
	emit: function (eventName, data) {
		if (this.events[eventName]) {
			this.events[eventName].forEach(function(fn) {
				fn(data);
			});
		}
	}
};

// player module
var player = (function(){
	//cache DOM
	var playlist = document.getElementById("playlist");
	var members = playlist.getElementsByTagName("li");
	var trackList = [];
	var currentTrack;
	var audio = new Audio();
	
	function init () {
		for (var i = 0, len = members.length; i < len; i++ ){
			var song = new Object();
			var title =  members[ i ].getElementsByTagName("span")[0].innerHTML;
			song.title = title.replace(/&amp;/, '&');
			var artist =  members[ i ].getElementsByTagName("span")[1].innerHTML;
			song.artist = artist.replace(/&amp;/, '&');
			var source =  members[ i ].getElementsByTagName("span")[2].innerHTML;
			song.source = source.replace(/&amp;/, '&');
			song.index = i;
			trackList.push(song);
		}
	}

	function render (argument) {
		// render the player frame
		var list = document.getElementById('player-ctn').innerHTML;
		document.getElementById('player-ctn').innerHTML = '<div class="maxi" id="player"><div id="player-header"><div id="window-controls"><span class="control-icon" id="minimize"></span><span class="control-icon" id="close"></span></div></div>' + list + '<div id="control-board"><ul class="inline-list" id="controls-top"><li><span class="control-icon" id="repeat"></span></li><li><span class="control-icon" id="previous"></span></li><li><span class="control-icon" id="play"></span></li><li><span class="control-icon" id="next"></span></li><li><span class="control-icon" id="plist"></span></li></ul><ul class="inline-list" id="controls-bottom"><li id="audio-time"><span id="current-time">02:55 /</span><span id="full-time">04:40</span></li><li id="audio-range"><input id="seekslider" type="range" min="0" max="100" value="0" step="1"></li><li id="volume-range"><span class="control-icon" id="volume"></span><input id="volumeslider" type="range" min="0" max="100" value="40" step="1"></li></ul></div></div></div>';
		events.emit("domRender");
	}

	init();
	
	window.onload = function() {
		render();
		initAudio(0);
	};
	// initialize audio track
	function initAudio(index) {
		var track = trackList[index];
		audio.src = track.source;
		audio.loop = false;
		events.emit("audioInit", index);
		audio.load();
		// handle audio errors
		audio.addEventListener('error',function failed(e) {
			switch (e.target.error.code) {
				case e.target.error.MEDIA_ERR_ABORTED:
					console.log('You aborted the video playback.');
					break;
				case e.target.error.MEDIA_ERR_NETWORK:
					console.log('A network error caused the audio download to fail.');
					break;
				case e.target.error.MEDIA_ERR_DECODE:
					console.log('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
					break;
				case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
					console.log('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
					events.emit("fileError", currentTrack.index);
					break;
				default:
					alert('An unknown error occurred.');
					break;
			}
		}, true);
	}
	// play or pause current track
	function playPauseAudio() {
		if (audio.paused) {
			audio.oncanplaythrough = audio.play();
			events.emit("audioPlaying", currentTrack.index);
		} else {
			audio.pause();
			events.emit("audioPaused", currentTrack.index);
		}
	}
	// mute or un-mute current tack
	function muteAudio(){
		if(audio.muted){
			audio.muted = false;
			events.emit("audioMuted", false);
		} else {
			audio.muted = true;
			events.emit("audioMuted", true);
		}
	}
	// Remove track from trackList array
	function removeTrack (index) {
		trackList.splice(index,1);
		resetTrackList();
	}
	// toggle track repetition
	function toggleRepeat (argument) {
		audio.loop = audio.loop ? false : true;
	}
	// reset the trackList indices
	function resetTrackList () {
		for (var i = 0, len = trackList.length; i < len; i++) { 
			trackList[i].index = i;
		}
	}
	// fire events emitted
	events.on('audioInit', setCurrentTrack);
	events.on("playToggled", playPauseAudio);
	events.on("nextPressed", nextTrack);
	events.on("prevPressed", previousTrack);
	events.on("fileError", nextTrack);
	events.on("fileError", removeTrack);
	events.on("repeatToggled", toggleRepeat);
	events.on("muteToggled", muteAudio);
	// set current track to initialized track
	function setCurrentTrack(index) {
		currentTrack = trackList[index];
	}
	// play next track
	function nextTrack() {
		if(typeof(currentTrack) != 'undefined'){
			var index = (currentTrack.index + 1 < trackList.length) ? currentTrack.index + 1 : 0;
			initAudio(index);
			playPauseAudio();
		}  
	}
	// play previous track
	function previousTrack() {
		if(typeof(currentTrack) != 'undefined'){
			var index = (currentTrack.index === 0) ? trackList.length - 1 : (currentTrack.index - 1);
			initAudio(index);
			playPauseAudio();
			console.log(index);
		}
	}

})();
// frame module 
var frame = (function(){
	// cache DOM
	var playlist,members,board,controls,playBtn,prevBtn,nextBtn,repeatBtn,listBtn,mutBtn,seekSlider,volumeSlider,curtimeText,durtimeText;

	function initFrame() {
		frame = document.getElementById("player"),
		playlist = document.getElementById("playlist"),
		members = playlist.getElementsByTagName("li"),
		board = document.getElementById("playlist"),
		controls = document.getElementById("control-board"),
		playBtn = document.getElementById("play"),
		prevBtn = document.getElementById("previous"),
		nextBtn = document.getElementById("next"),
		repeatBtn = document.getElementById("repeat"),
		listBtn = document.getElementById("plist"),
		muteBtn = document.getElementById("volume"),
		seekSlider = document.getElementById("seekslider"),
		volumeSlider = document.getElementById("volumeslider"),
		curtimeText = document.getElementById("current-time"),
		durtimeText = document.getElementById("full-time");
		closeBtn = document.getElementById("close");
		miniBtn = document.getElementById("minimize");
		listen();
	}
	
	function listen() {
		playBtn.addEventListener('click', function () {
			events.emit("playToggled");
			toggleActivity (this);
		}, false);

		prevBtn.addEventListener('click', function () {
			events.emit("prevPressed");
			toggleActivity (this);
		}, false);

		nextBtn.addEventListener('click', function () {
			events.emit("nextPressed");
			toggleActivity (this);
		}, false);

		repeatBtn.addEventListener('click', function () {
			events.emit("repeatToggled");
			toggleActivity (this);
		}, false);

		listBtn.addEventListener('click', function () {
			events.emit("ListViewToggled");
			toggleActivity (this);
		}, false);

		muteBtn.addEventListener('click', function () {
			events.emit("muteToggled");
			toggleActivity (this);
		}, false);

		closeBtn.addEventListener('click', function () {
			events.emit("closePressed");
			toggleActivity (this);
		}, false);

		miniBtn.addEventListener('click', function () {
			events.emit("miniPressed");
			toggleActivity (this);
		}, false);
	}

	events.on("domRender", initFrame);
	events.on("ListViewToggled", toggleViewMode);
	// view elements
	// toggle View Mode
	function toggleViewMode() {
		frame.className = (frame.className == 'minify') ? frame.className.replace("minify", "maxi") : frame.className.replace("maxi", "minify");
	}
	function toggleActivity (el) {
	 	el.className = (el.className == "control-icon active") ? el.className.replace("active", " ") : el.className + " active";
	 	console.log(el.className);
	}


})();