// Web Search Provider for GNOME Shell
// Copyright (C) 2015, 2017 Contributors, Bahodir Mansurov; 2017 Moritz Rakow
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// To debug: log('blah');
// And run: journalctl /usr/bin/gnome-session -f -o cat | grep LOG

const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Util = imports.misc.util;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Api = Me.imports.api;

const WikidataSearchProvider = new Lang.Class({
    Name: 'WikidataSearchProvider',

    _init: function() {
        var self = this;

        // Use the default app for opening https links as the app for
        // launching full search.
        this.appInfo = Gio.AppInfo.get_default_for_uri_scheme('https');
        // Fake the name and icon of the app
        this.appInfo.get_name = function() {
            return 'Wikidata Search Provider';
        };
        this.appInfo.get_icon = function() {
            return Gio.icon_new_for_string(Me.path + "/wikidata_logo.svg");
        };

        // Custom messages that will be shown as search results
        this._messages = {
            '__loading__': {
                id: '__loading__',
                name: 'Wikidata',
                description : 'Loading items from Wikidata, please wait...',
                // TODO: do these kinds of icon creations better
                createIcon: Lang.bind(this, this.createIcon, {})
            },
            '__error__': {
                id: '__error__',
                name: 'Wikidata',
                description : 'Oops, an error occurred while searching.',
                createIcon: Lang.bind(this, this.createIcon, {})
            }
        };
        // API results will be stored here
        this.resultsMap = new Map();
        this._api = new Api.Api();
		// Wait before making an API request
		this._timeoutId = 0;
    },

	/**
	 * Launch the search in the default app (i.e. browser)
	 * @param {String[]} terms
	 */
	launchSearch: function (terms) {
        Util.trySpawnCommandLine(
            "xdg-open " + this._api.getFullSearchUrl(this._getQuery(terms)));
	},

    /**
     * Open the url in default app
     * @param {String} identifier
     * @param {Array} terms
     * @param timestamp
     */
    activateResult: function(identifier, terms, timestamp) {
        let result;
        // only do something if the result is not a custom message
        if (!(identifier in this._messages)) {
            result = this.resultsMap.get(identifier);
            if (result) {
                Util.trySpawnCommandLine(
                    "xdg-open " + this._api.protocol + ':' + result.url +
                    '?setlang=' + this._api.language);
            }
        }
    },

    /**
     * Run callback with results
     * @param {Array} identifiers
     * @param {Function} callback
     */
    getResultMetas: function(identifiers, callback) {
        let metas = [];
        for (let i = 0; i < identifiers.length; i++) {
            metas.push(this._getResultMeta(identifiers[i]));
        }
        callback(metas);
    },

    /**
     * Search API if the query is a Wikidata query.
     * Wikidata query must start with a 'wd' as the first term.
     * @param {Array} terms
     * @param {Function} callback
     * @param {Gio.Cancellable} cancellable
     */
    getInitialResultSet: function(terms, callback, cancellable) {
        let meta;
        // terms holds array of search items
        // The first term must start with a 'wd' (=wikidata).
        // It can be of the form 'wd', 'wd-en', 'wd-ru'. The part after
        // the dash is the search language.
        if (terms.length >= 2 && terms[0].substr(0, 2) === 'wd') {
            // show the loading message
            this.showMessage('__loading__', callback);
			// remove previous timeout
			if (this._timeoutId > 0) {
				Mainloop.source_remove(this._timeoutId);
				this._timeoutId = 0;
			}
			// wait 0.2 seconds before making an API request
			this._timeoutId = Mainloop.timeout_add(200, Lang.bind(this, function() {
                // set the language
                meta = terms[0].split('-');
                if (meta.length == 2){
                    this._api.language = meta[1];
                } else {
                    this._api.language = this._api.defaultLanguage;
                }
				// now search
				this._api.searchEntities(
					this._getQuery(terms),
					Lang.bind(this, this._getResultSet, callback, this._timeoutId)
				);
			}));
        } else {
            // return an emtpy result set
            this._getResultSet(null, {}, callback, 0);
        }
    },

    /**
     * Show any message as a search item
     * @param {String} identifier Message identifier
     * @param {Function} callback Callback that pushes the result to search
     * overview
     */
    showMessage: function (identifier, callback) {
        callback([identifier]);
    },

    /**
     * TODO: implement
     * @param {Array} previousResults
     * @param {Array} terms
     * @returns {Array}
     */
    getSubsetResultSearch: function (previousResults, terms) {
        return [];
    },

    /**
     * Return subset of results
     * @param {Array} results
     * @param {number} max
     * @returns {Array}
     */
    filterResults: function(results, max) {
        // override max for now
        max = this._api.limit;
        return results.slice(0, max);
    },

	/**
	 * Return query string from terms array
	 * @param {String[]} terms
	 * @returns {String}
	 */
	_getQuery: function(terms) {
		return terms.slice(1).join(' ');
	},

    /**
     * Return meta from result
     * @param {String} identifier
     * @returns {{id: String, name: String, description: String, createIcon: Function}}
     * @private
     */
    _getResultMeta: function(identifier) {
        let result,
            meta;
        // return predefined message if it exists
        if (identifier in this._messages) {
            result = this._messages[identifier];
        } else {
            // TODO: check for messages that don't exist, show generic error message
            meta = this.resultsMap.get(identifier);
            result = {
                id: meta.id,
                name: meta.label,
                description : meta.description,
                createIcon: Lang.bind(this, this.createIcon, meta)
            };
        }
        return result;
    },

    /**
     * Parse results that we get from the API and save them in this.resultsMap.
     * Inform the user if no results are found.
     * @param {null|String} error
     * @param {Object|null} result
     * @param {Function} callback
     * @private
     */
    _getResultSet: function (error, result, callback, timeoutId) {
        let self = this,
            results = [];
        // log(error, JSON.stringify(result), timeoutId, this._timeoutId);
        if (timeoutId === this._timeoutId && result.search && result.search.length > 0) {
            result.search.forEach(function (result) {
                self.resultsMap.set(result.id, result);
                results.push(result.id);
            });
            callback(results);
        } else if (error) {
            // Let the user know that an error has occurred.
            log(error);
            this.showMessage('__error__', callback);
        } else {
            callback(results);
        }
    },

    /**
     * Create meta icon
     * @param size
     * @param {Object} meta
     */
    createIcon: function (size, meta) {
        // TODO: implement meta icon?
    }
});

let wikidataSearchProvider = null;

function init() {
    /** noop */
}

function enable() {
    if (!wikidataSearchProvider) {
        wikidataSearchProvider = new WikidataSearchProvider();
        Main.overview.viewSelector._searchResults._registerProvider(
            wikidataSearchProvider
        );
    }
}

function disable() {
    if (wikidataSearchProvider){
        Main.overview.viewSelector._searchResults._unregisterProvider(
            wikidataSearchProvider
        );
        wikidataSearchProvider = null;
    }
}
