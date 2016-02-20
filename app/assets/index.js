$(document).ready(function() {
	document.addEventListener("keydown", function(key) {
		if (key.which === 123) { require('remote').getCurrentWindow().toggleDevTools(); }
	});

	if (localStorage.getItem("discEmail") !== undefined) { document.getElementsByName("email")[0].value = localStorage.getItem("discEmail"); }
	if (localStorage.getItem("discPass") !== undefined) { document.getElementsByName("pass")[0].value = localStorage.getItem("discPass"); }

	$(".form").on('submit', function(e) { e.preventDefault(); });
});

var discord = require("discord.js");

var bot = new discord.Client();
var auto = false, currentGame = "";

bot.on("ready", () => {
	$("#login").hide();
	document.getElementById("username").innerHTML = "Logged in as " + bot.user.username;
	(bot.user.game !== null) ? document.getElementById("status").innerHTML = "Current Status: " + bot.user.game.name : document.getElementById("status").innerHTML = "Current Status: Nothing";

	setInterval(() => {
		autoUpdate();
	}, 30000);
});

bot.on("disconnected", () => { console.log("Lost connection to discord"); /* Display on screen */ });

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
		document.getElementById("status").innerHTML = "Current Status: " + toSet;
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
	if (auto) {
		getTasks();
	}
}

function getTasks() {
	var spawn = require("child_process").spawn;
	var tl = spawn("tasklist", ["-v", "/fo", "csv"]);
	var processes = [];

	tl.stdout.on("data", (data) => {
		processes.push(data);
	});
	tl.stderr.on("data", (data) => {
		console.log(`stderr: ${data}`);
	});
	tl.on("close", (code) => {
		checkForMatch(processes.join("").split("\r\n"));
	});
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
