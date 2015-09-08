var libQ = require('kew');
var libFast = require('fast.js');
var libCrypto = require('crypto');
var libBase64Url = require('base64-url');
var libLevel = require('level');
var libUtil = require('util');

// Define the CorePlaylistManager class
module.exports = CorePlaylistManager;
function CorePlaylistManager (commandRouter) {
	// This fixed variable will let us refer to 'this' object at deeper scopes
	var self = this;

	// Save a reference to the parent commandRouter
	self.commandRouter = commandRouter;

	// The playlistfs object is analogous to the library index object - its entries contain a list of ordered children
	self.playlistFS = {};
	self.playlistFS.root = {
		name: 'root',
		type: 'folder',
		uid: 'root',
		fullpath: [],
		children: [],
		childuids: {}
	};

	// Attempt to load playlists from database on disk
	self.sPlaylistDBPath = './app/db/playlistfs';
	self.loadPlaylistsFromDB();
}

CorePlaylistManager.prototype.getListing = function(sUid) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'CorePlaylistManager::getListing');

	var objReturn = {
		navigation: {
			prev: {
				uri: ''
			}
		},
		currentobject: {
			uid: ''
		},
		list: []
	};

	objReturn.list = self.playlistFS[sUid].children;
	objReturn.currentobject.uid = sUid;

	return libQ.resolve(objReturn);
}

// Load a LevelDB from disk containing the music library and indexes
CorePlaylistManager.prototype.loadPlaylistsFromDB = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'CorePlaylistManager::loadPlaylistsFromDB');
	self.commandRouter.pushConsoleMessage('Loading playlists from DB...');

	self.playlistFS = {};
	self.playlistFS.root = {
		name: 'root',
		type: 'folder',
		uid: 'root',
		fullpath: [],
		children: [],
		childuids: {}
	};

	var dbPlaylists = libLevel(self.sPlaylistDBPath, {'valueEncoding': 'json', 'createIfMissing': true});
	return libQ.resolve()
		.then(function() {
			return libQ.nfcall(libFast.bind(dbPlaylists.get, dbPlaylists), 'playlistFS');
		})
		.then(function(result) {
			self.playlistFS = result;
			self.commandRouter.pushConsoleMessage('Playlists loaded from DB.');
		})
		.fail(function(sError) {
			throw new Error('Error reading DB: ' + sError);
		})
		.fin(libFast.bind(dbPlaylists.close, dbPlaylists));
}

// Import existing playlists and folders from the various services
CorePlaylistManager.prototype.importServicePlaylists = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'CorePlaylistManager::importServicePlaylists');

	var dbPlaylists = libLevel(self.sPlaylistDBPath, {'valueEncoding': 'json', 'createIfMissing': true});
	return self.commandRouter.getAllTracklists()
		.then(function(arrayAllTracklists) {
			self.commandRouter.pushConsoleMessage('Importing playlists from music services...');

			return libQ.all(libFast.map(arrayAllTracklists, function(arrayTracklist) {
				return libQ.all(libFast.map(arrayTracklist, function(curTrack) {
					return self.addTrackToPlaylist(curTrack);
				}));
			}));
		})
		.then(function() {
			return libQ.nfcall(libFast.bind(dbPlaylists.put, dbPlaylists), 'playlistFS', self.playlistFS);
		})
		.then(function() {
			self.commandRouter.pushConsoleMessage('Playlists imported.');
		})
		.fin(libFast.bind(dbPlaylists.close, dbPlaylists));
}

// Add an track into the playlist filesystem
CorePlaylistManager.prototype.addTrackToPlaylist = function(curTrack) {
	var self = this;

	var arrayPath = curTrack.browsepath;
	var arrayCurFullPath = [];
	var curFolderKey = '';

	libFast.map(arrayPath, function(sCurPath, nIndex) {
		arrayCurFullPath = arrayCurFullPath.concat(sCurPath);

		curFolderKey = convertStringToHashkey(arrayCurFullPath.join('/'));
		if (!(curFolderKey in self.playlistFS)) {
			// Add folder to playlistfs object
			self.playlistFS[curFolderKey] = {
				name: sCurPath,
				type: 'folder',
				uid: curFolderKey,
				fullpath: arrayCurFullPath,
				children: [],
				childuids: {}
			};

			if (nIndex === 0) {
				// If this folder is the top level, list it in the root object
				self.playlistFS.root.children.push({
					name: sCurPath,
					type: 'folder',
					uid: curFolderKey
				});
			}
		}

		var arrayParentPath = arrayCurFullPath.slice(0, -1);
		if (arrayParentPath.length > 0) {
			// If this folder has a parent, add an entry in the parent's list of children
			var sParentKey = convertStringToHashkey(arrayParentPath.join('/'));
			if (!(curFolderKey in self.playlistFS[sParentKey].childuids)) {
				var objChildEntry = {
					name: sCurPath,
					type: 'folder',
					uid: curFolderKey
				};

				self.playlistFS[sParentKey].children.push(objChildEntry);
				self.playlistFS[sParentKey].childuids[curFolderKey] = null;
			}
		}
	});

	// Add the track as a child to the last folder
	var curTrackKey = convertStringToHashkey(curTrack.album + curTrack.name);
	self.playlistFS[curFolderKey].children.push({
		name: curTrack.name,
		type: 'item',
		trackuid: 'track:' + curTrackKey,
		service: curTrack.service,
		uri: curTrack.uri,
		duration: curTrack.duration
	});
	self.playlistFS[curFolderKey].childuids['track:' + curTrackKey] = null;

}

CorePlaylistManager.prototype.addLibraryUidsToPlaylist = function(arrayUids, sPlaylistUid) {
	var self = this;
	var arrayQueueItems = self.commandRouter.musicLibrary.makeQueueItemArray.call(self.commandRouter.musicLibrary, arrayUids);

	libFast.map(arrayQueueItems, function(curItem) {
		self.playlistFS[sPlaylistUid].children.push({
			name: curItem.name,
			type: 'item',
			trackuid: curItem.uid,
			service: curItem.service,
			uri: curItem.uri,
			duration: curItem.duration
		});
		self.playlistFS[sPlaylistUid].childuids[curItem.uid] = null;
	});

	return self.notifyPlaylistManagerUpdate();

}

CorePlaylistManager.prototype.notifyPlaylistManagerUpdate = function() {
	var self = this;

	return self.commandRouter.notifyPlaylistManagerUpdate.call(self.commandRouter);
}

// Create a URL safe hashkey for a given string. The result will be a constant length string containing
// upper and lower case letters, numbers, '-', and '_'.
function convertStringToHashkey(input) {
    if (input === null) {
        input = '';

    }

	return libBase64Url.escape(libCrypto.createHash('sha256').update(input, 'utf8').digest('base64'));
}

