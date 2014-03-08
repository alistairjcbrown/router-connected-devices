# Connected Devices Generator

This is a node module which utilses a bridging library with PhantomJS to interact with the web interface of the router.

It authenticates (as necessary) and retrieves a list of connected devices, returning an object with the device details.

### Current Implementation Notes

This module uses a forked version of the `node-phantom` module to support the `onNavigationRequested` [[link](http://phantomjs.org/api/webpage/handler/on-navigation-requested.html)] event handler in PhantomJS.

This change is currently in PR: https://github.com/alexscheelmeyer/node-phantom/pull/87

 * The master `node-phantom` branch: https://github.com/alexscheelmeyer/node-phantom
 * The forked version by `alexeypetrushin`: https://github.com/alexeypetrushin/node-phantom/
 * The tagged release for use in the `package.json` file for this module: https://github.com/alistairjcbrown/node-phantom/tarball/onnavigationrequested-support

Once support for `onNavigationRequested` is in the master branch of the main repository and available on `npm`, the `package.json` file for this module will be updated accordingly.

### Supported routers

 * BT Home Hub (tested on firmware version `V100R001C01B036SP05_L_B` )


## API

 * `init` - Sets up the module for use with PhantomJS. Takes a callback.

 * `generateMapping` - Creates a mapping of connected state to list of devices. Takes a callback and provides connected device mapping in parameters.

 * `destroy` - Tears down the module and PhantomJS instance.


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

In an effort to make this script extensible for use with other routers, router URLs, authentication data, element selectors and scripts which are run on the pages have all been moved to the (config file)[config.js] file.

The functionality to open a page should take card of detecting redirections and delaying until their have loaded.

However, the `_createDeviceObject` may need generalised to deal with different formats of element data and conversion of this data into a standard device object.


## Contact

Twitter [@alistairjcbrown](http://twitter.com/alistairjcbrown)

