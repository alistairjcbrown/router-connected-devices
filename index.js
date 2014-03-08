/*
 * Connected Device Runner
 *
 * Sets up and runs the Connected Device module to have it generate a mapping
 * on an interval. The generated mapping is saved to file.
 *
 * @author Alistair Brown <github@alistairjcbrown.com>
 */
"use strict";

var fs = require("fs"),
    ConnectedDevicesRunner;


/*
 * ConnectedDevicesRunner
 *
 * Main object of which a new instance is run when this file is called.
 *
 * @param object dependencies
 * An object containing dependencies; connected_devices, outputPath.
 */
ConnectedDevicesRunner = function(dependencies) {

    // Bind dependencies to `this`
    Object.keys(dependencies).forEach(function(dependency_name) {
        var dependency = dependencies[dependency_name];
        this[dependency_name] = dependency;
    }, this);


    /*
     * run
     *
     * Initialises the connected devices module and starts generating interval.
     */
    this.run = function() {

        this.connected_devices.init(function(err) {
            if (err) {
                console.log("Error initialising", err);
                return;
            }

            // Generate data at each interval, starting immediately
            this._generateData();
            setInterval(this._generateData.bind(this), this.connected_devices.config.output.interval);
        }, this);

    };


    /*
     * _writeToFile
     *
     * Utility function to write data to file.
     *
     * @param string file_path
     * @param string file_contents
     * @param function callback
     * @param object callback_context
     */
    this._writeToFile = function(file_path, file_contents, callback, callback_context) {
        fs.writeFile(file_path, file_contents, function(err) {
            callback.call(callback_context, err);
        });
    };


    /*
     * _generateData
     *
     * Calls for connected device data and outputs to file
     */
    this._generateData = function() {
        console.log("Generating mapping...");
        this.connected_devices.generateMapping(function(err, connected_devices_mapping) {
            var connected_device_data;

            if (err) {
                console.log("Error generating", err);
                return;
            }

            connected_device_data = JSON.stringify(connected_devices_mapping, null, "\t");
            this._writeToFile(this.connected_devices.config.output.path, connected_device_data, function(err) {
                if (err) {
                    console.log("Error writing output file", err);
                    return;
                }

                console.log("Complete\n");
            }, this);
        }, this);
    };

};


// Create and run
new ConnectedDevicesRunner({
    connected_devices: require("./connected-devices")
}).run();

