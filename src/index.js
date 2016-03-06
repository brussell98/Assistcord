var autoCount = 0
	,loggedIn = false
	,loggingIn = false
	,dark = false
	,replaces = []
	,watchingTimer
	,gameUpdaterTimer
	,auto = false
	,currentGame = "";

$(document).ready(function() {
	if (localStorage.darkTheme !== undefined) { if (localStorage.darkTheme) toggleDarkTheme(); }
	if (localStorage.discEmail !== undefined) document.getElementsByName("email")[0].value = CryptoJS.AES.decrypt(localStorage.discEmail, "asgvkf4yut584fq8hbw").toString(CryptoJS.enc.Utf8);
	if (localStorage.discPass !== undefined) document.getElementsByName("pass")[0].value = CryptoJS.AES.decrypt(localStorage.discPass, "asgvkf4yut584fq8hbw").toString(CryptoJS.enc.Utf8);

	var autos = localStorage.autos;
	if (autos) {
		autos = JSON.parse(autos);
		var autosDark = (localStorage.darkTheme) ? ' dark' : '';
		var autosDark1 = (localStorage.darkTheme) ? ' style="border-bottom-width: 1px !important; border-bottom-style: solid !important; border-bottom-color: rgb(25, 118, 210) !important; color: rgb(245, 245, 245) !important;"' : '';
		var autosDark2 = (localStorage.darkTheme) ? ' style="color: rgb(245, 245, 245); background-color: rgb(25, 118, 210);"' : '';
		autos.forEach(function(auto) {
			autoCount++;
			$("#autos").append('<form id="auto' + auto.id + '" class="form auto-form"><input class="forminput auto-find' + autosDark + '" type="text" id="find' + auto.id + '" value="' + auto.find.replace(/"/g, "&quot;") + '"' + autosDark1 + ' disabled><input class="forminput auto-replace" type="text" id="replace' + auto.id + '" value="' + auto.replace.replace(/"/g, "&quot;") + '"' + autosDark1 + ' disabled><input id="rem-auto-btn" name="auto' + auto.id + '" class="right btn btn-blue auto-rem" type="submit" value="-" onclick="event.preventDefault();remReplace(this);this.blur();"' + autosDark2 + '></form>');
			replaces.push({"find": auto.find, "replace": auto.replace});
		});
	}

	$(".form").on('submit', function(e) { e.preventDefault(); });
});

var discord = require("discord.js");
var bot = new discord.Client();

bot.on("ready", function() {
	$("#login").hide();
	loggingIn = false;
	loggedIn = true;
	document.getElementById("username").innerHTML = "Logged in as " + bot.user.username;
	(currentGame != "") ? document.getElementById("status").innerHTML = "Playing " + currentGame : document.getElementById("status").innerHTML = "Not Playing";
	watchingTimer = setInterval(function() { autoUpdate(); }, 30000);
	gameUpdaterTimer = setInterval(function() {
		if (currentGame !== "") { bot.setPlayingGame(currentGame); }
	}, 120000);
});

bot.on("disconnected", function() {
	if (loggedIn) {
		console.log("Lost connection to discord");
		loggedIn = false;
		auto = false;
		clearInterval(watchingTimer);
		clearInterval(gameUpdaterTimer);
		document.getElementsByClassName('login-info')[0].innerHTML = "Lost connection";
		$('#login').show();
	}
});

function login() {
	if (!loggingIn) {
	loggingIn = true;
	if (document.getElementById("saveLogin").checked) {
		localStorage.setItem("discEmail", CryptoJS.AES.encrypt(document.getElementsByName("email")[0].value, "asgvkf4yut584fq8hbw"));
		localStorage.setItem("discPass", CryptoJS.AES.encrypt(document.getElementsByName("pass")[0].value, "asgvkf4yut584fq8hbw"));
	}
	var email = document.getElementsByName("email")[0].value;
	var pass = document.getElementsByName("pass")[0].value;
	bot.login(email, pass, function(error, token) {
		if (error) {
			document.getElementsByClassName('login-info')[0].innerHTML = "Failed: Either your email or password is incorrect";
			$('#login-btn').blur();
			loggingIn = false;
		}
	});
	}
}

bot.on("message", function(msg) {
	if (msg.author.id != bot.user.id) return;
	if (replaces.length !== 0) replaceMessage(msg);
});

function replaceMessage(msg) {
	var changed = false;
	var updated = msg.content;
	replaces.forEach(function(replacer) {
		if (updated.indexOf(replacer.find) > -1) {
			var findRegExp = new RegExp(replacer.find, "g");
			updated = updated.replace(findRegExp, replacer.replace);
			changed = true;
		}
	});
	if (changed) bot.updateMessage(msg, updated, function(error) { if (error) console.log("Error updating message: " + error.stack); });
}

function setStatus() {
	var toSet = document.getElementsByName("status")[0].value;
	if (toSet && toSet != currentGame) {
		bot.setPlayingGame(toSet);
		currentGame = toSet;
		document.getElementById("status").innerHTML = "Playing " + toSet;
	}
}

function clearStatus() {
	if (loggedIn) {
		console.log("Cleared game");
		bot.setPlayingGame(null);
		currentGame = "";
		document.getElementById("status").innerHTML = "Not Playing";
	}
}

function toggleAuto() {
	if (auto) { auto = false;
	} else {
		auto = true;
		autoUpdate();
	}
}

function autoUpdate() {
	if (auto) { getTasks(); }
}

function getTasks() {
	var spawn = require("child_process").spawn;
	var tl = spawn("tasklist", ["-v", "/fo", "csv"]);
	var processes = [];

	tl.stdout.on("data", function(data) { processes.push(data); });
	tl.on("close", function(code) { checkForMatch(processes.join("").split("\r\n")); });
}

function checkForMatch(list) {
	for (var i = 0; i <= list.length; i++) {
		if (i == list.length) {
			if (currentGame !== "") {
				bot.setPlayingGame(null);
				currentGame = "";
				document.getElementById("status").innerHTML = "Not Playing";
			}
		} else {
			var e = document.getElementById("player");
			if (e.selectedIndex == 1 && list[i].startsWith("\"mpc-hc.exe")) {
				if (/:\d\d",".+"$/.exec(list[i]) !== null) {
					var title = /:\d\d",".+"$/.exec(list[i])[0].substr(6).replace(/"$/, "");
					if (title != "N/A" && title != "Media Player Classic Home Cinema") {
						title = title.replace(/\[[^\]]+\]/g, "").replace(/_/g, " ").replace(/\.[a-zA-Z]{3,5}$/, "").trim();
						if (title != currentGame) {
							bot.setPlayingGame(title);
							console.log(title);
							currentGame = title;
							document.getElementById("status").innerHTML = "Playing " + title;
							i = list.length + 1;
						} else i = list.length + 1;
					}
				}
			} else if (e.selectedIndex == 2 && list[i].startsWith("\"vlc.exe")) {
				if (/:\d\d",".+ - VLC media player"$/.exec(list[i]) !== null) {
					var title = /:\d\d",".+ - VLC media player"$/.exec(list[i])[0].substr(6).replace(/"$/, "");
					if (title != "N/A" && title != "VLC media player") {
						title = title.replace(/\[[^\]]+\]/g, "").replace(/_/g, " ").replace(/\.[a-zA-Z]{3,5} - VLC media player$/, "").trim();
						if (title != currentGame) {
							bot.setPlayingGame(title);
							console.log(title);
							currentGame = title;
							document.getElementById("status").innerHTML = "Playing " + title;
							i = list.length + 1;
						} else i = list.length + 1;
					}
				}
			}
		}
	}
}

function addReplace() {
	var find = document.getElementsByName("find")[0].value;
	var replace = document.getElementsByName("replace")[0].value;
	if (find && replace) {
		document.getElementsByName("find")[0].value = "";
		document.getElementsByName("replace")[0].value = "";
		autoCount++;
		if (localStorage.autos) {
			var autos = JSON.parse(localStorage.autos);
			var obj = {id: autoCount, find: find, replace: replace};
			autos.push(obj);
			localStorage.autos = JSON.stringify(autos);
		} else {
			var autos = [];
			var obj = {id: autoCount, find: find, replace: replace};
			autos.push(obj);
			localStorage.autos = JSON.stringify(autos);
		}
		var autosDark = (localStorage.darkTheme) ? ' dark' : '';
		var autosDark1 = (localStorage.darkTheme) ? ' style="border-bottom-width: 1px !important; border-bottom-style: solid !important; border-bottom-color: rgb(25, 118, 210) !important; color: rgb(245, 245, 245) !important;"' : '';
		var autosDark2 = (localStorage.darkTheme) ? ' style="color: rgb(245, 245, 245); background-color: rgb(25, 118, 210);"' : '';
		$("#autos").append('<form id="auto' + autoCount + '" class="form auto-form"><input class="forminput auto-find' + autosDark + '" type="text" id="find' + autoCount + '" value="' + find.replace(/"/g, "&quot;") + '""' + autosDark1 + '" disabled><input class="forminput auto-replace" type="text" id="replace' + autoCount + '" value="' + replace.replace(/"/g, "&quot;") + '"' + autosDark1 + ' disabled><input id="rem-auto-btn" name="auto' + autoCount + '" class="right btn btn-blue auto-rem" type="submit" value="-" onclick="event.preventDefault();remReplace(this);this.blur();"' + autosDark2 + '></form>');
		replaces.push({"find": find, "replace": replace});
	}
}

function remReplace(e) {
	var autos = JSON.parse(localStorage.autos);
	var eID = e.name.replace(/auto/, "");
	autos.splice(parseInt(eID) - 1, 1);
	replaces.splice(parseInt(eID) - 1, 1);
	for (var i = 0; i < autos.length; i++) {
		if (autos[i].id > eID) { autos[i].id = autos[i].id - 1; }
	}
	$("#" + e.name).remove();
	autoCount--;
	localStorage.autos = JSON.stringify(autos);
	$(".auto-find").each(function() {
		var ID = parseInt(this.id.replace(/find/, ""));
		if (ID > eID) { $(this).prop("id", "find" + (ID - 1)); }
	});
	$(".auto-form").each(function() {
		var ID = parseInt(this.id.replace(/auto/, ""));
		if (ID > eID) { $(this).prop("id", "auto" + (ID - 1)); }
	});
	$(".auto-replace").each(function() {
		var ID = parseInt(this.id.replace(/replace/, ""));
		if (ID > eID) { $(this).prop("id", "replace" + (ID - 1)); }
	});
	$(".auto-rem").each(function() {
		var ID = parseInt(this.name.replace(/auto/, ""));
		if (ID > eID) { $(this).prop("name", "auto" + (ID - 1)); }
	});
}

function toggleDarkTheme() {
	if (dark) {
		dark = false;
		$('#login').css('background-color', '');
		$('html').css('color', '');
		$('.btn-blue').css('background-color', '');
		$('.btn-blue').css('color', '');
		$('.status-bar').css('background-color', '');
		$('.material-select').css('color', '');
		$('.material-select').css('border-bottom', '');
		$('.auto-replace').css('color', '');
		$('.auto-replace').css('border-bottom-color', '');
		$('.auto-find').css('color', '');
		$('.auto-find').css('border-bottom-color', '');
		$('.forminput').css('border-bottom', '');
		$('.forminput').css('color', '');
		$('.forminput').toggleClass('dark');
		$('.btn-flat').css('color', '');
		$('.card').css('background', '');
		$('.cardbanner').css('background-color', '');
		$('#bot-settings-btn').css('color', '');
		$('#bot-settings-btn').css('background-color', '');
		$('.onoffswitch-label').toggleClass('dark');
		$('.onoffswitch-checkbox').toggleClass('dark');
		$('.switch-text').css('color', '');
		$('body').css('background-color', '');
		$('option').css('background-color', '');
		$('option').css('color', '');
		localStorage.setItem('darkTheme', false);
	} else {
		dark = true;
		$('#login').css('background-color', '#212121');
		$('html').css('color', '#f5f5f5');
		$('.btn-blue').css('background-color', '#1976d2');
		$('.btn-blue').css('color', '#f5f5f5');
		$('.status-bar').css('background-color', '#1976d2');
		$('.material-select').css('color', '#e0e0e0');
		$('.material-select').css('border-bottom', '1px solid #d6d6d6');
		$('.auto-replace').css('color', '#f5f5f5');
		$('.auto-replace').css('border-bottom-color', '#1976d2 !important');
		$('.auto-find').css('color', '#f5f5f5');
		$('.auto-find').css('border-bottom-color', '#1976d2 !important');
		$('.forminput').css('border-bottom', '1px solid #d6d6d6');
		$('.forminput').css('color', '#f5f5f5');
		$('.forminput').toggleClass('dark');
		$('.btn-flat').css('color', '#1976d2');
		$('.card').css('background', '#363636');
		$('.cardbanner').css('background-color', '#1976d2');
		$('#bot-settings-btn').css('color', '#f5f5f5');
		$('#bot-settings-btn').css('background-color', '#363636');
		$('.onoffswitch-label').toggleClass('dark');
		$('.onoffswitch-checkbox').toggleClass('dark');
		$('.switch-text').css('color', '#e0e0e0');
		$('body').css('background-color', '#212121');
		$('option').css('background-color', '#525252');
		$('option').css('color', '#f5f5f5');
		localStorage.setItem('darkTheme', true);
	}
}
