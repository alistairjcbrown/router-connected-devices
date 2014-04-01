/*
 * Connected Device
 *
 * Uses the web interface to the router to pull a list of connected devices
 * and their current state.
 *
 * @author Alistair Brown <github@alistairjcbrown.com>
 */
"use strict";

var phantom_bridge = require("node-phantom"),
    Q = require("q"),
    _ = require("underscore"),
    config = require("./config"),
    ConnectedDevices;


/*
 * ConnectedDevices
 *
 * Main object of which a new instance is exposed via exports.
 *
 * @param object dependencies
 * An object containing dependencies; config, phantom_bridge.
 */
ConnectedDevices = function(dependencies) {

    // Bind dependencies to `this`
    _.forEach(dependencies, function(dependency, dependency_name) {
        this[dependency_name] = dependency;
    }, this);


    // --- Public functions

    /*
     * init
     *
     * reates the url string and sets up the page instance from PhantomJS.
     *
     * @param function callback
     * @param object callback_context
     */
    this.init = function(callback, callback_context) {
        this._onNavigationRequestedCallbacks = [];
        this._onLoadFinishedCallbacks = [];

        this.url = this.config.router.protocol +
                   this.config.router.host +
                   this.config.router.devices_page;

        // Create PhantomJS instance
        Q.nfcall(this.phantom_bridge.create)
        // Create page in instance
        .then(_.bind(function(phantom) {
            this.phantom = phantom;
            return Q.nfcall(this.phantom.createPage);
        }, this))
        // Bind listeners to page
        .then(_.bind(function(page) {
            this.page = page;
            this._setEventListeners();

            callback.call(callback_context);
        }, this))
        // Fail state
        .fail(function(err) {
            callback.call(callback_context, err);
        });
    };


    /*
     * generateMapping
     *
     * Generates the connected device mapping object.
     * Checks authentication status and logs in if required.
     *
     * @param function callback
     * @param object callback_context
     */
    this.generateMapping = function(callback, callback_context) {
        Q.ninvoke(this, "_openPage", this.url)
        .then(_.bind(function(is_open) {
            if ( ! is_open) {
                callback.call(callback_context, new Error("Unable to open page"));
                throw new Error("abort");
            }

            console.log("Checking authentication status");
            return Q.ninvoke(this, "_getAuthenticationState");
        }, this))
        .then(_.bind(function(is_authenticated) {
            var deferred = Q.defer();

            if ( ! is_authenticated) {
                console.log(" >> Not logged in");
                this._authenticate(deferred);
            } else {
                console.log(" >> Already logged in");
                deferred.resolve();
            }

            return deferred.promise;

        }, this))
        .then(_.bind(function() {
            return Q.ninvoke(this, "_getConnectedDevices");
        }, this))
        .then(_.bind(function(connected_devices_mapping) {
            if (_.isEmpty(connected_devices_mapping)) {
                throw new Error("Empty device mapping provided");
            }

            // Add some meta data
            connected_devices_mapping.metadata = {};
            connected_devices_mapping.metadata.generated_at = + new Date();
            connected_devices_mapping.metadata.output_interval = this.config.output.interval;

            callback.call(callback_context, null, connected_devices_mapping);
        }, this))
        .fail(function(err) {
            if (err.message !== "abort") {
                callback.call(callback_context, err);
            }
        });
    };


    /*
     * destroy
     *
     * Cleanly exits the PhantomJS instance and removes object attributes.
     */
    this.destroy = function() {
        // Gracefully shutdown PhantomJS instance
        if (this.phantom) {
            this.phantom.exit();
        }

        // Remove attributes created in init
        delete this.url;
        delete this.phantom;
        delete this.page;
    };


    // --- Private functions

    /*
     * _setEventListeners
     *
     * Set state event listeners on the page object with one time callback
     * functionality.
     */
    this._setEventListeners = function() {
        // Call one time navigation callbacks
        this.page.onNavigationRequested = _.bind(function(args) {
            _.each(this._onNavigationRequestedCallbacks, function(callback) {
                callback(args[0]);
            });
            this._onNavigationRequestedCallbacks = [];
        }, this);

        // Call on time page loading callback
        this.page.onLoadFinished =  _.bind(function(status) {
            _.each(this._onLoadFinishedCallbacks, function(callback) {
                callback(status);
            });
            this._onLoadFinishedCallbacks = [];
        }, this);
    };


    /*
     * _openPage
     *
     * Opens page in phantom and detects page redirection.
     * Calls callback once page or redirected page has finished loading.
     *
     * @param string url
     * @param function callback
     * @param object callback_context
     */
    this._openPage = function(url, callback, callback_context) {
        console.log("Opening " + url);

        var deferred = Q.defer(),
            check_redirect_callback = _.once(deferred.resolve),
            page_open_status, check_redirect_timeout;

        this._onNavigationRequestedCallbacks.push(_.bind(function() {
            // Quick delay to add new callback after callback queue is cleared
            setTimeout(_.bind(function() {
                this._onNavigationRequestedCallbacks.push(check_redirect_callback);
            }, this), 1);
        }, this));

        Q.nfcall(this.page.open, url)
        .then(_.bind(function(status) {
            page_open_status = (status === "success");

            if ( ! page_open_status) {
                callback.call(callback_context, null, page_open_status);
                return;
            }

            check_redirect_timeout = setTimeout(function() {
                this._onNavigationRequestedCallbacks = [];
                check_redirect_callback();
            }, 500);

            return deferred.promise;
        }, this))
        .then(_.bind(function(url) {
            var deferred = Q.defer(),
                finished_load_callback;
            clearTimeout(check_redirect_timeout);

            // If there is no url, there is no redirect
            // If there is no redirect, we don"t need to wait on loading
            if ( ! _.isString(url)) {
                deferred.resolve();
                return deferred.promise;
            }

            console.log(" >> Redirection detected to " + url);

            finished_load_callback = function(status) {
                if (status === "success") {
                    deferred.resolve();
                    return;
                }
                deferred.reject(new Error("Redirect failed to open page"));
            };
            this._onLoadFinishedCallbacks.push(finished_load_callback);

            return deferred.promise;
        }, this))
        .then(function() {
            callback.call(callback_context, null, page_open_status);
        })
        .fail(function(err) {
            callback.call(callback_context, err, false);
        });

    };


    /*
     * _getPageLocation
     *
     * Returns an object containing page location data.
     *
     * @param function callback
     * @param object callback_context
     */
    this._getPageLocation = function(callback, callback_context) {
        this.page.evaluate(
            this.config.router.functions.get_location,
            function(err, location) {
                callback.call(callback_context, err, JSON.parse(location));
            }
        );
    };


    /*
     * _getAuthenticationState
     *
     * Returns boolean to decided if authenticated.
     * Decision is made by checking page location for log in page.
     *
     * @param function callback
     * @param object callback_context
     */
    this._getAuthenticationState = function(callback, callback_context) {
        Q.ninvoke(this, "_getPageLocation")
        .then(_.bind(function(location) {
            var past_login_page = location.pathname !== this.config.router.login_page;
            callback.call(callback_context, null, past_login_page);
        }, this));
    };


    /*
     * _authenticate
     *
     * Assumes the log in page is open and attempts to log in.
     * Will redirect to the intended URL on authentication succcess.
     *
     * @param deferred parent_deferred
     */
    this._authenticate = function(parent_deferred) {
        var deferred = Q.defer();

        this.page.evaluate(
            this.config.router.functions.log_in,
            deferred.resolve,
            this.config.router.password
        );

        deferred.promise
        .then(_.bind(function(err) {
            var deferred = Q.defer();

            if (err) {
                throw new Error("Authentication submission failed");
            }

            console.log(" >> Logged in");

            this._onLoadFinishedCallbacks.push(function(status) {
                if (status === "success") {
                    deferred.resolve();
                } else {
                    deferred.reject(new Error("Authentication submission failed to open page"));
                }
            });

            return deferred.promise;
        }, this))
        .then(_.bind(function() {
            return Q.ninvoke(this, "_openPage", this.url);
        }, this))
        .then(_.bind(function(is_open) {
            if ( ! is_open) {
                throw new Error("Unable to open page after authentication");
            }

            parent_deferred.resolve();
        }, this))
        .fail(function(err) {
            parent_deferred.reject(err);
        });
    };


    /*
     * _getConnectedDevices
     *
     * Uses selectors from config to pull connected device data from the
     * current page.
     *
     * @param function callback
     * @param object callback_context
     */
    this._getConnectedDevices = function(callback, callback_context) {
        var elements_promises = [];

        console.log("Pulling device state");

        // Iterate over the config and pull elements from page based on selectors
        _.each(this.config.router.selectors, function(selectors) {
            _.each(selectors, function(selector) {
                elements_promises.push(
                    Q.ninvoke(this, "_getElementsFromPage", selector)
                );
            }, this);
        }, this);

        Q.all(elements_promises)
        .then(_.bind(function(element_data) {
            var index = 0,
                devices = {};

            _.each(this.config.router.selectors, function(selectors, state) {
                devices[state] = [];
                _.each(selectors, function(selector, type) {
                    var type_element_data = element_data[index],
                        device_objects = this._createDeviceObjects(type_element_data, type);
                    devices[state] = devices[state].concat(device_objects);
                    index++;
                }, this);
            }, this);

            callback.call(callback_context, null, devices);
        }, this))
        .fail(function(err) {
            callback.call(callback_context, err);
        });
    };


    /*
     * _createDeviceObjects
     *
     * Iterates through element fragments to create an array of device objects
     *
     * @param array element_fragments
     * @param string type
     */
    this._createDeviceObjects = function(element_fragments, type) {
        var device_objects = [];

        _.each(element_fragments, function(element_fragment) {
            var device_object = this._createDeviceObject(element_fragment, type);
            device_objects.push(device_object);
        }, this);

        return device_objects;
    };


    /*
     * _createDeviceObject
     *
     * Takes a string of content from an element and converts it to an
     * element object
     *
     * @param string element_fragment
     * @param string type
     */
    this._createDeviceObject = function(element_fragment, type) {
        var device_details = element_fragment.split("<br>");
        return {
            "device_name": device_details[0],
            "mac_address": device_details[1],
            "interface":   type
        };
    };


    /*
     * _getElementsFromPage
     *
     * Gets element data from the page based on provided selector.
     *
     * @param string selector
     * @param function callback
     * @param object callback_context
     */
    this._getElementsFromPage = function(selector, callback, callback_context) {
        this.page.evaluate(
            this.config.router.functions.get_element_contents_by_selector,
            function(err, elements) {
                callback.call(callback_context, err, elements);
            },
            selector);
    };

};


// Make an instance of the module available
module.exports = new ConnectedDevices({
    phantom_bridge: phantom_bridge,
    config: config
});

