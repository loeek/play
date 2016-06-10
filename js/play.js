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
		document.getElementById('player-ctn').innerHTML = '<div class="maxi" id="player"><div id="player-header"><div id="window-controls"><span class="control-icon" id="minimize"></span><span class="control-icon" id="close"></span></div></div>' + list + '<div id="control-board"><ul class="inline-list" id="controls-top"><li><span class="control-icon" id="repeat"></span></li><li><span class="control-icon" id="previous"></span></li><li><span class="control-icon" id="play"></span></li><li><span class="control-icon" id="next"></span></li><li><span class="control-icon" id="plist"></span></li></ul><ul class="inline-list" id="controls-bottom"><li class="audio-time"><span id="current-time">00:00</span></li><li id="audio-range"><input id="seekslider" type="range" min="0" max="100" value="0" step="1"></li><li class="audio-time"><span id="full-time">00:00</span><li id="volume-range"><span class="control-icon" id="volume"></span><input id="volumeslider" type="range" min="0" max="100" value="40" step="1"></li></ul></div></div></div>';
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
	events.on("volumeChanged", setVolume);
	events.on("seekSliderUpdated", updateAudio);
	audio.addEventListener("timeupdate", function(){ seektimeupdate(); });

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
		}
	}
	function updateAudio(value) {
		seekto = audio.duration * (value / 100);
		audio.currentTime = seekto;
	}

	function setVolume(value){
	    audio.volume = value;
    }

	function seektimeupdate(){
		var nt = audio.currentTime * (100 / audio.duration);
		events.emit("timeUpdated", nt);
		var curmins = Math.floor(audio.currentTime / 60);
		var cursecs = Math.floor(audio.currentTime - curmins * 60);
		var durmins = Math.floor(audio.duration / 60);
		var dursecs = Math.floor(audio.duration - durmins * 60);
		if(cursecs < 10){ cursecs = "0"+cursecs; }
		if(dursecs < 10){ dursecs = "0"+dursecs; }
		if(curmins < 10){ curmins = "0"+curmins; }
		if(durmins < 10){ durmins = "0"+durmins; }
		current = curmins+":"+cursecs;
		events.emit("updateChrono", current);
		duration = durmins+":"+dursecs;
		events.emit("audioPlaying", duration);
		if (audio.currentTime === audio.duration) {
			nextTrack();
		} 
	}

})();
// frame module 
var frame = (function(){
	// cache DOM
	var playlist,members,board,controls,playBtn,prevBtn,nextBtn,seeking=false,seekto,repeatBtn,listBtn,mutBtn,seekSlider,volumeSlider,curtimeText,durtimeText;

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
		playBtn.addEventListener('click', function() {
			events.emit("playToggled");
			toggleActivity (this);
		}, false);

		prevBtn.addEventListener('click', function() {
			events.emit("prevPressed");
			toggleActivity (this);
		}, false);

		nextBtn.addEventListener('click', function() {
			events.emit("nextPressed");
			toggleActivity (this);
		}, false);

		repeatBtn.addEventListener('click', function(event) {
			events.emit("repeatToggled");
			toggleActivity (this);
		}, false);

		listBtn.addEventListener('click', function() {
			events.emit("ListViewToggled");
			toggleActivity (this);
		}, false);

		muteBtn.addEventListener('click', function() {
			events.emit("muteToggled");
			toggleActivity (this);
		}, false);

		closeBtn.addEventListener('click', function() {
			events.emit("closePressed");
			toggleActivity (this);
		}, false);

		miniBtn.addEventListener('click', function() {
			events.emit("miniPressed");
			// toggleActivity (this);
		}, false);

		// var arr = new Array(6);
		// arr.forEach.call(members,function(el,i){
		// 	el.addEventListener('click', function(){alert(i);}, false);
		// });

		// for (var i = 0; i < members.length; i++) {
		// 	members[i].addEventListener('click', function() {
		// 		console.log(i); 
		// 	});
		// }

		seekSlider.addEventListener('mousedown', function(event) {
		 	seeking = true;
		 	events.emit("seekingOn", event);
		});

		seekSlider.addEventListener("mousemove", function(event){ 
			// events.emit("seekingOn", event);
		});

		seekSlider.addEventListener('mouseup', function(event) {
		 	seeking = false;
		});

		volumeSlider.addEventListener("mousemove", function(event) {
			var volume = volumeSlider.value / 100;
		 	events.emit("volumeChanged", volume);
		});
	}

	events.on("domRender", initFrame);
	events.on("ListViewToggled", toggleViewMode);
	events.on("seekingOn", updateSeekSlider);
	events.on("timeUpdated", updateSeekSlider);
	events.on("updateChrono", ChronoUpdate);
	events.on("audioPlaying", durationUpdate);

	// view elements
	// toggle View Mode
	function toggleViewMode() {
		frame.className = (frame.className == 'minify') ? frame.className.replace("minify", "maxi") : frame.className.replace("maxi", "minify");
	}

	function toggleActivity(el) {
	 	el.className = (el.className == "control-icon active") ? el.className.replace("control-icon active", "control-icon") : el.className.replace("control-icon", "control-icon active");
	}

	function updateSeekSlider(event) {
		if(seeking && (typeof(event) == "object")){
			seekSlider.value = event.clientX - seekSlider.offsetLeft;
			events.emit("seekSliderUpdated", seekSlider.value);
		} else {
			seekSlider.value = event;
		}
	}
	function ChronoUpdate(value) {
		curtimeText.innerHTML = value;
	}
	function durationUpdate(value) {
		durtimeText.innerHTML = value;
	}

})();