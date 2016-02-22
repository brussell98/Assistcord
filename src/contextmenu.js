var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');

var menu = new Menu();
menu.append(new MenuItem({ label: 'Clear game', click: function() {
	clearStatus();
} }));
menu.append(new MenuItem({ label: 'Show dev tools', click: function() {
	remote.getCurrentWindow().toggleDevTools();
} }));
menu.append(new MenuItem({ label: 'Dark theme', type: 'checkbox', click: function() {
	console.log("Dark theme not yet avalible");
} }));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: 'Settings', click: function() {
	console.log('Settings clicked');
}}));

window.addEventListener('contextmenu', function(e) {
	e.preventDefault();
	if (loggedIn) { menu.popup(remote.getCurrentWindow()); }
}, false);
