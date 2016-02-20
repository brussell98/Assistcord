var autoCount = 0;
var loggedIn = false;

$(document).ready(function() {
	if (localStorage.discEmail !== undefined) { document.getElementsByName("email")[0].value = localStorage.discEmail; }
	if (localStorage.discPass !== undefined) { document.getElementsByName("pass")[0].value = localStorage.discPass; }

	var autos = localStorage.autos;
	if (autos) {
		autos = JSON.parse(autos);
		autos.forEach(function(auto) {
			autoCount++;
			$("#autos").append('<form id="auto' + auto.id + '" class="form auto-form"><input class="forminput auto-find" type="text" id="find' + auto.id + '" value="' + auto.find + '" disabled><input class="forminput auto-replace" type="text" id="replace' + auto.id + '" value="' + auto.replace + '" disabled><input id="rem-auto-btn" name="auto' + auto.id + '" class="right btn btn-blue auto-rem" type="submit" value="-" onclick="event.preventDefault();remReplace(this);this.blur();"></form>');
		});
	}

	$(".form").on('submit', function(e) { e.preventDefault(); });
});

var discord = require("discord.js");
var bot = new discord.Client();
var auto = false, currentGame = "";

bot.on("ready", () => {
	$("#login").hide();
	loggedIn = true;
	document.getElementById("username").innerHTML = "Logged in as " + bot.user.username;
	(bot.user.game !== null) ? document.getElementById("status").innerHTML = "Playing " + bot.user.game.name : document.getElementById("status").innerHTML = "Not Playing";

	setInterval(() => { autoUpdate(); }, 30000);

	setInterval(() => {
		if (currentGame !== "") { bot.setPlayingGame(currentGame); }
	}, 120000);
});

bot.on("disconnected", () => {
	console.log("Lost connection to discord");
	loggedIn = false;
	auto = true;
	/* Display on screen */
});

function login() {
	if (document.getElementById("saveLogin").checked) {
		localStorage.setItem("discEmail", document.getElementsByName("email")[0].value);
		localStorage.setItem("discPass", document.getElementsByName("pass")[0].value);
	}
	var email = document.getElementsByName("email")[0].value;
	var pass = document.getElementsByName("pass")[0].value;
	bot.login(email, pass);
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

	tl.stdout.on("data", (data) => { processes.push(data); });
	tl.on("close", (code) => { checkForMatch(processes.join("").split("\r\n")); });
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
					if (title !== "N/A") {
						title = title.replace(/\[[^\]]+\]/g, "").replace(/_/g, " ").replace(/\.[a-zA-Z]{3,5}$/, "").trim();
						if (title != currentGame) {
							bot.setPlayingGame(title);
							console.log(title);
							currentGame = title;
							document.getElementById("status").innerHTML = "Playing " + title;
							i = list.length + 1;
						} else { i = list.length + 1; }
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
		$("#autos").append('<form id="auto' + autoCount + '" class="form auto-form"><input class="forminput auto-find" type="text" id="find' + autoCount + '" value="' + find + '" disabled><input class="forminput auto-replace" type="text" id="replace' + autoCount + '" value="' + replace + '" disabled><input id="rem-auto-btn" name="auto' + autoCount + '" class="right btn btn-blue auto-rem" type="submit" value="-" onclick="event.preventDefault();remReplace(this);this.blur();"></form>');
	}
}

function remReplace(e) {
	var autos = JSON.parse(localStorage.autos);
	var eID = e.name.replace(/auto/, "");
	autos.splice(parseInt(eID) - 1, 1);
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
