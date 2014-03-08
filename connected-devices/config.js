"use strict";

var config = {};

config.output = {
    interval: 10000, // 10 seconds
    path: "./connected-devices.json"
};

config.router = {
    protocol:     "http://",
    host:         "<router_host>",
    devices_page: "/html/settings/a_devices.html",
    login_page:   "/html/common/advanced_login.html",
    username:     "<router_username>",
    password:     "<router_password>"
};

config.router.functions = {
    get_location: function() {
        return JSON.stringify(window.location);
    },
    log_in: function(password) {
        /* jshint undef: true, newcap: false */
        /* global SubmitForm */
        document.getElementById("password").value = password;
        SubmitForm();
    },
    get_element_contents_by_selector: function(selector) {
        var elements = document.querySelectorAll(selector),
            element_source = [];

        elements = Array.prototype.slice.call(elements);
        elements.forEach(function(element) {
            var element_contents = element.innerHTML;
            element_source.push(element_contents);
        });
        return element_source;
    }
};

config.router.selectors = {
    "connected": {
        "wired": "#connectedPhysical a",
        "wireless": "#connectedWireless a",
        "usb": "#connectedUsb a"
    },
    "disconnected": {
        "wired": "#disconnectedPhysical a",
        "wireless": "#disconnectedWireless a",
        "usb": "#disconnectedUsb a"
    }
};

module.exports = config;