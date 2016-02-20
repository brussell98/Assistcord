'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let window;

app.on('ready', function() {
	window = new BrowserWindow({width: 1000, height: 600, resizable: false, disableSecurity: true, title: "Auto Discord", webPreferences: {webSecurity: false}});
	window.setMenuBarVisibility(false);
	window.loadURL('file://' + __dirname + '/assets/index.html');
});

app.on('closed', function() {
	app.quit();
});
