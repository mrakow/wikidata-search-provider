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

const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Params = imports.misc.params;

const PROTOCOL = 'https';
const BASE_URL = 'wikidata.org';
const DEFAULT_LANG = 'en';
const API_PATH = 'w/api.php';
const API_LIMIT = 10;
const HTTP_TIMEOUT = 10;
const USER_AGENT = 'WikidataSearchProvider extension for GNOME Shell';

/**
 * Client that interacts with the Wikidata API
 *
 * @class Api
 * @uses imports.gi.Soup
 * @uses imports.misc.params
 */
const Api = new Lang.Class({
    Name: 'Api',

    /**
     * Set default parameters and create a Soup session.
     * @constructor
     * @param {Object} params Parameters
     * @private
     */
    _init: function(params) {
        /**
         * @property {Object} _params
         * @private
         */
        this._params = Params.parse(params, {
            /**
             * @property {String} _params.protocol=PROTOCOL API protocol
             * @accessor
             */
            protocol: PROTOCOL,
            /**
             * @property {String} _params.baseUrl=BASE_URL API base url
             */
            baseUrl: BASE_URL,
            /**
             * @property {String} _params.language=DEFAULT_LANG API language
             * @accessor
             */
            language: DEFAULT_LANG,
            /**
             * @property {String} _params.apiPath=API_PATH API path
             */
            apiPath: API_PATH,
            /**
             * @property {String} _params.limit=API_LIMIT API limit
             */
            limit: API_LIMIT
        });

        /**
         * @property {Soup.SessionAsync} _session Soup session
         * @private
         */
        this._session = new Soup.SessionAsync();
        Soup.Session.prototype.add_feature.call(
            this._session,
            new Soup.ProxyResolverDefault()
        );
        this._session.user_agent = USER_AGENT;
        this._session.timeout = HTTP_TIMEOUT;
    },

    /**
     * Construct the API URL
     * @returns {String} Language specific API URL that expects a response
     * in JSON
     * @private
     */
    _getApiUrl: function() {
        return '%s://%s/%s?format=json&language=%s'
            .format(PROTOCOL, BASE_URL, API_PATH, this.language);
    },

    /**
     * Construct query URL using the API URL and query parameters
     * @param {Object} queryParameters
     * @returns {String} Query URL
     * @private
     */
    _getQueryUrl: function(queryParameters) {
        let queryString = '',
            url = this._getApiUrl(),
            parameter;

        for(parameter in queryParameters) {
            if(queryParameters.hasOwnProperty(parameter)) {
                queryString += '&%s=%s'.format(
                    parameter,
                    encodeURIComponent(queryParameters[parameter])
                )
            }
        }

        url += queryString;
        return url;
    },

	/**
	 * Get the language specific full search URL of the term
	 * @param {String} term
	 * @returns {String} ex: https://www.wikidata.org/w/index.php?seearch=обама&setlang=uz
	 */
	getFullSearchUrl: function(term) {
        return '%s://%s/w/index.php?search=%s&setlang=%s'
            .format(PROTOCOL, BASE_URL, term, this.language);
	},

    /**
     * Query the API
     * @param {Object} queryParameters Query parameters
     * @param {Function} callback Callback that will be called with an
     * error message or a result.
     * @param {null|String} callback.errorMessage Message describing
     * what went wrong
     * @param {Object|null} callback.result Response data parsed in JSON format
     */
    get: function(queryParameters, callback) {
        let queryUrl = this._getQueryUrl(queryParameters),
            request = Soup.Message.new('GET', queryUrl),
            result;

        this._session.queue_message(request,
            Lang.bind(this, function(http_session, message) {
                let errorMessage;
                if(message.status_code !== Soup.KnownStatusCode.OK) {
                    errorMessage = "Api.Client.get: Error code: %s"
                        .format(message.status_code);
                    log(errorMessage);
                    callback(errorMessage, null);
                } else {
                    try {
                        result = JSON.parse(request.response_body.data);
                        callback(null, result);
                    } catch(e) {
                        errorMessage = "Api.Client.get: %s".format(e);
                        log('%s. Response body: %s'
                            .format(errorMessage, request.response_body.data)
                        );
                        callback(errorMessage, null);
                    }
                }
            })
        );
    },

    /**
     * Search entities
     * @see https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
     *
     * @param {String} term Query to search for
     * @param {Function} callback Callback that will be called with an
     * error message or a result.
     * @param {null|String} callback.errorMessage Message describing
     * what went wrong
     * @param {Object|null} callback.result Response data parsed in JSON format
     * @param {Number} [continue_=0] Get results starting at this index
     */
    searchEntities: function (term, callback, continue_) {
        continue_ = continue_ || 0;
        this.get({
            action: 'wbsearchentities',
            search: term,
            type: 'item',
            'continue': continue_,
            limit: this.limit
        }, callback);
    },

    /**
     * Delete the Soup session
     */
    destroy: function() {
        this._session.run_dispose();
        this._session = null;
    },

    /**
     * Get the API protocol
     * @method getProtocol
     * @returns {String} this._params.protocol
     */
    get protocol() {
        return this._params.protocol;
    },

    /**
     * Get the API limit
     * @method getLimit
     * @returns {String} this._params.limit
     */
    get limit() {
        return this._params.limit;
    },

    /**
     * Get the API language
     * @method getLanguage
     * @returns {String} this._params.language
     */
    get language() {
        return this._params.language;
    },

    /**
     * Set the API language
     * @method getLanguage
     * @param {String} language
     */
    set language(language) {
        this._params.language = language;
    },

    /**
     * Get the default API language
     * @method getDefaultLanguage
     * @returns {String} DEFAULT_LANG
     */
    get defaultLanguage() {
        return DEFAULT_LANG;
    }

});
