# Connected Devices

## What is this?

This is a NodeJS module for pulling the list of connected devices from your home router.

### Supported routers

 * BT Home Hub (tested on firmware version `V100R001C01B036SP05_L_B`)

## Components

This has been broken into two components:

 1. __Connected Devices module__ - gets the list of connected devices from the router using PhantomJS.
 2. __Connected Devices runner__ - runs the module periodically and saves the connected devices data to file.

## Setup

Instructions below are aimed at linux. This has only been tested on Ubuntu. YMMV.

### Prerequisites

Install:

 * nodejs - [Installing via Package Manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

 * phantomjs - `sudo apt-get install phantomjs`<br />
   If you want the latest and greatest, you can [download pre-build binaries](http://phantomjs.org/download.html).

### Getting started

 * Clone the repository
  `git clone git@github.com:alistairjcbrown/router-connected-devices.git`

 * Intall dependencies
   * `cd router-connected-devices`
   * `npm install`
   * `cd connected-devices`
   * `npm install`

 * Change the interval and the output path in the config at
   * `router-connected-devices/connected-devices/config.js`

 * You can now call this module from the top level, eg.
   * `node router-connected-devices`

#### Extra

Use `forever` [[link](https://www.npmjs.org/package/forever)] to keep process going even if it crashes.

 * Install: `npm install -g forever`
 * `forever router-connected-devices`

## Output Format

#### Device Object

```json
{
	"device_name": "alice-iphone",
	"mac_address": "01:23:45:67:89:ab",
	"interface": "wireless" | "wired" | "usb"
}
```

#### Overall structure

```json
{
    "connected": [
        <Device objects>
        ...
    ],
	"disconnected": [
        <Device objects>
        ...
    ],
	"metadata": {
		"generated_at": <timestamp>,
		"output_interval": <interval, ms>
	}
}
```

## Advanced

For advanced usage (eg. customisation for an unsupported router), please see the documentation for the [Connected Devices](connected-devices/README.md) module.

## Contact

Twitter [@alistairjcbrown](http://twitter.com/alistairjcbrown)

