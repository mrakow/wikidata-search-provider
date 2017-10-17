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

/* globals imports */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^init|enable|disable$" }] */

const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Util = imports.misc.util;

const WebSearchProvider = new Lang.Class({
  Name: 'WebSearchProvider',

  _init: function () {
    // Faking name and icon of the app is needed for GNOME Shell to accept the
    // search provider.
    this.appInfo = Gio.AppInfo.get_default_for_uri_scheme('https');
    this.appInfo.get_name = function () {
      return 'Web Search Provider';
    };
    this.appInfo.get_icon = function () {
      return Gio.icon_new_for_string('system-search');
    };
  },

  /**
   * Called when the user first begins a search.
   * @param  {String[]}   terms    Array of search terms, which are treated as a
   * logical AND.
   * @param  {requestResultsCallback} callback The callback that is called with
   * the results.
   */
  getInitialResultSet: function (terms, callback) {
    let results = ['duckduckgo.com']; // TODO: Write a real keyword chooser.
    callback(results);
  },
  /**
   * This callback is displayed as part of the {getInitialResultSet} method.
   * @callback requestResultsCallback
   * @param  {String[]}   results An array of result identifier strings
   * representing items which match the given search terms. Identifiers are
   * unique within Web Search Provider's domain.
   */

  /**
   * Called when a search is performed which is a "subsearch" of the previous
   * search, e.g. the method may return fewer results, but not more or different
   * results.
   * @param  {String[]} previousResults Array of results previously returned by
   * {getInitialResultSet}.
   * @param  {String[]} terms           Array of updated search terms, which the
   * provider treats as logical AND.
   * @return {String[]}                 An array of result identifier strings
   * representing items which match the given search terms. Identifiers are
   * unique within Web Search Provider's domain.
   */
  getSubsetResultSearch: function (previousResults, terms) {
    // TODO: Implement result filtering.
  },

  /**
   * Returns an array of meta data that can be used to display each given result
   * @param  {String[]}   identifiers An array of result identifiers as returned
   * by {getInitialResultSet} or {getSubsearchResultSet}
   * @param  {requestMetasCallback} callback    This callback is called with the
   * array of meta data.
   */
  getResultMetas: function (identifiers, callback) {
    // TODO: Meta data look-up.
    let metas = [{
      id: 'duckduckgo.com',
      name: 'DuckDuckGo',
      createIcon: function () {}
    }];
    callback(metas);
  },
  /**
   * This callback is displayed as part of the {getResultMetas} method.
   * @callback requestMetasCallback
   * @param  {Meta[]}   metas An array of dictionaries describing the given
   * search results.
   */

  /**
   * A dictionary describing a given search result.
   * @typedef Meta
   * @type {Obect}
   * @property {String} name A human-readable name for the given search result.
   * @property {String} id The result identifier for the given search result.
   * @property {String} [icon] An icon (a serialized GIcon as obtained by
   * g_icon_serialize) to better serve the result with a thumbnail of the
   * content (e.g. for images). Note: seems to be required, but can be empty.
   * @property {String} [description] A description to help the user find the
   * desired result.
   */

  /**
   * Called when the users chooses a given result. The result will be displayed
   * in the default web browser.
   * @param  {String} identifier A result identifier as returned by
   * {getInitialResultSet} or {getSubsearchResultSet}
   * @param  {String[]} terms      Array of search terms, which are treated as
   * logical AND.
   * @param  {number} timestamp  A timestamp of the user interaction that
   * triggered this call.
   */
  activateResult: function (identifier, terms, timestamp) {
    // TODO: Real URL template selection.
    let queryURLTemplate = 'https://duckduckgo.com/?q=%s';
    let query = terms.slice(1).map(encodeURIComponent).join('+');

    let queryURL = queryURLTemplate.split('%s').map(encodeURI).join(query);
    Util.spawn(['xdg-open', queryURL]);
  },

  /**
   * Launches a full search in the default web browser for the provided terms.
   * @param  {String[]} terms Array of search terms, which the provider should
   * treat as logical AND.
   * @param  {number} timestamp  A timestamp of the user interaction that
   * triggered this call.
   */
  launchSearch: function (terms, times) {
    // TODO: Decide whether to open settings or results page in browser here.
  },

  /**
   * This method is an undocumented requirement by GNOME Shell.
   */
  filterResults: function (results, max) {
    return results.slice(0, max);
  }
});

let webSearchProvider = null;

function init () {}

function enable () {
  if (!webSearchProvider) {
    webSearchProvider = new WebSearchProvider();
    Main.overview.viewSelector._searchResults._registerProvider(
            webSearchProvider
        );
  }
}

function disable () {
  if (webSearchProvider) {
    Main.overview.viewSelector._searchResults._unregisterProvider(
            webSearchProvider
        );
    webSearchProvider = null;
  }
}
