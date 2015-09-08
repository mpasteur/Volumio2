var libQ = require('kew');
var libFast = require('fast.js');
var fs=require('fs-extra');

// Define the CoreCommandRouter class
module.exports = CoreCommandRouter;
function CoreCommandRouter (server) {
	// This fixed variable will let us refer to 'this' object at deeper scopes
	var self = this;

	self.server = server;

	// Start plugins
	self.pluginManager = new (require(__dirname+'/pluginmanager.js'))(self, server);
	self.pluginManager.loadPlugins();
	//self.pluginManager.onVolumioStart();
	//self.pluginManager.startPlugins();

	// Start the state machine
	self.stateMachine = new (require('./statemachine.js'))(self);

	// Start the music library
	self.musicLibrary = new (require('./musiclibrary.js'))(self);

	// Start the volume controller
	self.volumeControl = new (require('./volumecontrol.js'))(self);

	// Start the playlist manager
	self.playlistManager = new (require('./playlistmanager.js'))(self);

	self.pushConsoleMessage('[' + Date.now() + '] ' + 'BOOT COMPLETED');

}

// Methods usually called by the Client Interfaces ----------------------------------------------------------------------------

// Volumio Play
CoreCommandRouter.prototype.volumioPlay = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioPlay');

	return self.stateMachine.play.call(self.stateMachine);
}

// Volumio Pause
CoreCommandRouter.prototype.volumioPause = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioPause');

	return self.stateMachine.pause.call(self.stateMachine);
}

// Volumio Stop
CoreCommandRouter.prototype.volumioStop = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioStop');

	return self.stateMachine.stop.call(self.stateMachine);
}

// Volumio Previous
CoreCommandRouter.prototype.volumioPrevious = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioPrevious');

	return self.stateMachine.previous.call(self.stateMachine);
}

// Volumio Next
CoreCommandRouter.prototype.volumioNext = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioNext');

	return self.stateMachine.next.call(self.stateMachine);
}

// Volumio Get State
CoreCommandRouter.prototype.volumioGetState = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioGetState');

	return self.stateMachine.getState.call(self.stateMachine);
}

// Volumio Get Queue
CoreCommandRouter.prototype.volumioGetQueue = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioGetQueue');

	return self.stateMachine.getQueue.call(self.stateMachine);
}

// Volumio Remove Queue Item
CoreCommandRouter.prototype.volumioRemoveItemFromQueue = function(nIndex) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioRemoveItemFromQueue');

	return self.stateMachine.removeItemFromQueue.call(self.stateMachine, nIndex);
}

// Volumio Add Queue Uids
CoreCommandRouter.prototype.volumioAddLibraryUidsToQueue = function(arrayUids) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioAddLibraryUidsToQueue');

	return self.musicLibrary.addLibraryUidsToQueue.call(self.musicLibrary, arrayUids);
}

// Volumio Add Playlist Uids
CoreCommandRouter.prototype.volumioAddLibraryUidsToPlaylist = function(arrayUids, sPlaylistUid) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioAddLibraryUidsToPlaylist');

	return self.playlistManager.addLibraryUidsToPlaylist.call(self.playlistManager, arrayUids, sPlaylistUid);
}

// Volumio Rebuild Library
CoreCommandRouter.prototype.volumioRebuildLibrary = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioRebuildLibrary');

	return self.musicLibrary.buildLibrary.call(self.musicLibrary);
}

// Volumio Get Library Filters
CoreCommandRouter.prototype.volumioGetLibraryFilters = function(sUid) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioGetLibraryFilters');

	return self.musicLibrary.getIndex.call(self.musicLibrary, sUid);
}

// Volumio Get Library Listing
CoreCommandRouter.prototype.volumioGetLibraryListing = function(sUid, objOptions) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioGetLibraryListing');

	return self.musicLibrary.getListing.call(self.musicLibrary, sUid, objOptions);
}

// Volumio Get Playlist Listing
CoreCommandRouter.prototype.volumioGetPlaylistListing = function(sUid) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioGetPlaylistListing');

	return self.playlistManager.getListing.call(self.playlistManager, sUid);
}

// Service Update Tracklist
CoreCommandRouter.prototype.serviceUpdateTracklist = function(sService) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::serviceUpdateTracklist');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisPlugin.rebuildTracklist.call(thisPlugin);
}

// Volumio Set Volume
CoreCommandRouter.prototype.volumiosetvolume = function(VolumeInteger) {
	var self = this;
	return self.volumeControl.alsavolume.call(self.volumeControl, VolumeInteger);
}

// Volumio Update Volume
CoreCommandRouter.prototype.volumioupdatevolume = function(vol) {
	var self = this;
	return self.stateMachine.updateVolume.call(self.stateMachine, vol);
}

// Volumio Retrieve Volume
CoreCommandRouter.prototype.volumioretrievevolume = function(vol) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioRetrievevolume');

	return self.volumeControl.retrievevolume.call(self.volumeControl);
}

// Start WirelessScan
CoreCommandRouter.prototype.volumiowirelessscan = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::StartWirelessScan');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisPlugin.scanWirelessNetworks.call(thisPlugin);
}

// Push WirelessScan Results (TODO SEND VIA WS)
CoreCommandRouter.prototype.volumiopushwirelessnetworks = function(results) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + results);
}

// Volumio Import Playlists
CoreCommandRouter.prototype.volumioImportServicePlaylists = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioImportServicePlaylists');

	return self.playlistManager.importServicePlaylists.call(self.playlistManager);
}

CoreCommandRouter.prototype.updateAllMetadata = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::updateAllMetadata');

	return self.musicLibrary.updateAllMetadata.call(self.musicLibrary);
}

// Methods usually called by the State Machine --------------------------------------------------------------------

CoreCommandRouter.prototype.volumioPushState = function(state) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioPushState');

	// Announce new player state to each client interface
	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);
			return thisInterface.pushState.call(thisInterface, state);
		})
	);
}

CoreCommandRouter.prototype.volumioPushQueue = function(queue) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::volumioPushQueue');

	// Announce new player queue to each client interface
	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);
			return thisInterface.pushQueue.call(thisInterface, queue);
		})
	);
}

// MPD Clear-Add-Play
CoreCommandRouter.prototype.serviceClearAddPlayTracks = function(arrayTrackIds, sService) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::serviceClearAddPlayTracks');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisPlugin.clearAddPlayTracks.call(thisPlugin, arrayTrackIds);
}

// MPD Stop
CoreCommandRouter.prototype.serviceStop = function(sService) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::serviceStop');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisPlugin.stop.call(thisPlugin);
}

// MPD Pause
CoreCommandRouter.prototype.servicePause = function(sService) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::servicePause');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisPlugin.pause.call(thisPlugin);
}

// MPD Resume
CoreCommandRouter.prototype.serviceResume = function(sService) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::serviceResume');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisPlugin.resume.call(thisPlugin);
}

// Methods usually called by the service controllers --------------------------------------------------------------

CoreCommandRouter.prototype.servicePushState = function(state, sService) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::servicePushState');

	return self.stateMachine.syncState.call(self.stateMachine, state, sService);
}

// Methods usually called by the music library ---------------------------------------------------------------------

// Get tracklists from all services and return them as an array
CoreCommandRouter.prototype.getAllTracklists = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::getAllTracklists');

	// This is the synchronous way to get libraries, which waits for each controller to return its tracklist before continuing
	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'music_service'), function(sService) {
			var thisService = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
			return thisService.getTracklist.call(thisService);
		})
	);
}

// Volumio Add Queue Items
CoreCommandRouter.prototype.addItemsToQueue = function(arrayItems) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::addItemsToQueue');

	return self.stateMachine.addItemsToQueue.call(self.stateMachine, arrayItems);
}

// Notifies clients that a change has occured in the music library
CoreCommandRouter.prototype.notifyMusicLibraryUpdate = function() {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::notifyMusicLibraryUpdate');

	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);

			if(typeof thisInterface.notifyMusicLibraryUpdate === "function") {
				return thisInterface.notifyMusicLibraryUpdate.call(thisInterface);
			}
		})
	);
}

// Notifies clients that a change has occured in the playlist filesystem
CoreCommandRouter.prototype.notifyPlaylistManagerUpdate = function() {
	var self = this;

	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);

			if(typeof thisInterface.notifyPlaylistManagerUpdate === "function") {
				return thisInterface.notifyPlaylistManagerUpdate.call(thisInterface);
			}
		})
	);
}

// Calls a service to fetch album art for a uri, possibly slow
CoreCommandRouter.prototype.serviceFetchAlbumArt = function(sService, sUri) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::serviceFetchAlbumArt');

	var thisService = self.pluginManager.getPlugin.call(self.pluginManager, 'music_service', sService);
	return thisService.fetchAlbumArt.call(thisService, sUri);
}

// Methods for generic plugin function calls --------------------------------------------------------------------------
CoreCommandRouter.prototype.executeOnPlugin = function(type, name, method, data) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::executeOnPlugin');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, type, name);
	return thisPlugin[method].call(thisPlugin, data);
}

CoreCommandRouter.prototype.getUIConfigOnPlugin = function(type, name, data) {
	var self = this;
	self.pushConsoleMessage('[' + Date.now() + '] ' + 'CoreCommandRouter::getUIConfigOnPlugin');

	var thisPlugin = self.pluginManager.getPlugin.call(self.pluginManager, type, name);
	return thisPlugin.getUIConfig.call(thisPlugin, data);
}

/* what is this?
CoreCommandRouter.prototype.getConfiguration=function(componentCode)
{
	console.log("_________ "+componentCode);
}
*/

// Utility functions ---------------------------------------------------------------------------------------------

CoreCommandRouter.prototype.pushConsoleMessage = function(sMessage) {
	var self = this;
console.log(sMessage);
	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);
			if( typeof thisInterface.printConsoleMessage === "function")
			return thisInterface.printConsoleMessage.call(thisInterface, sMessage);
		})
	);
}

CoreCommandRouter.prototype.pushToastMessage = function(type, title, message) {
	var self = this;

	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);
			if (typeof thisInterface.printToastMessage === "function")
				return thisInterface.printToastMessage.call(thisInterface, type, title, message);
		})
	);
}

CoreCommandRouter.prototype.pushMultiroomDevices = function(data)
{
	var self=this;

	return libQ.all(
		libFast.map(self.pluginManager.getPluginNames.call(self.pluginManager, 'user_interface'), function(sInterface) {
			var thisInterface = self.pluginManager.getPlugin.call(self.pluginManager, 'user_interface', sInterface);
			if (typeof thisInterface.pushMultiroomDevices === "function" )
				return thisInterface.pushMultiroomDevices.call(thisInterface, data);
		})
	);
}
