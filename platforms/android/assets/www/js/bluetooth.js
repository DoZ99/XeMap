/* jshint quotmark: false, unused: vars, browser: true */
/* global cordova, console, $, bluetoothSerial, _, refreshButton, deviceList, previewColor, red, green, blue, disconnectButton, connectionScreen, colorScreen, rgbText, messageDiv */
'use strict';

var file = {
    writer: { available: false },
    reader: { available: false }
};

var device;
var msg=[];
var i = 0;

var bt = {
//    initialize: function() {
//        this.bind();
//    },
//    bind: function() {
//        document.addEventListener('deviceready', this.deviceready, false);
//    },
    initialize: function() {
        //display splashscreen
        //navigator.splashscreen.show();
        
        //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
        
        // wire buttons to functions
        deviceList.ontouchstart = bt.connect; // assume not scrolling
        refreshButton.ontouchstart = bt.list;
        disconnectButton.ontouchstart = bt.disconnect;
        
        //connectionScreen.hidden = false;
        //connectedScreen.hidden = true;

        //bt.list();
    },
    list: function(event) {
        //deviceList.firstChild.innerHTML = "Discovering...";
        
        bt.setStatus("Looking for Bluetooth Devices...");
        
        bluetoothSerial.list(bt.ondevicelist, bt.generateFailureFunction("List Failed"));
    },
    connect: function (e) {
        bt.setStatus("Connecting...");
        device = e.target.getAttribute('deviceId');
        console.log("Requesting connection to " + device);
        bt.setStatus("Requesting connection to " + device);
        bluetoothSerial.connect(device, bt.onconnect, bt.ondisconnect);        
    },
    disconnect: function(event) {
        if (event) {
            event.preventDefault();
        }

        bt.setStatus("Disconnecting...");
        bluetoothSerial.disconnect(bt.ondisconnect);
    },
    onconnect: function() {
        //connectionScreen.hidden = true;
        //connectedScreen.hidden = false;
        bt.setStatus("Connected.");
        bluetoothSerial.subscribe("\n", bt.onmessage, bt.generateFailureFunction("Subscribe Failed"));
    },
    ondisconnect: function() {
        connectionScreen.hidden = false;
        connectedScreen.hidden = true;
        bt.setStatus("Disconnected.");
    },
    timeoutId: 0,
    setStatus: function(status) {
        if (bt.timeoutId) {
            clearTimeout(bt.timeoutId);
        }
        messageDiv.innerText = status;
        bt.timeoutId = setTimeout(function() { messageDiv.innerText = ""; }, 4000);
    },
    ondevicelist: function(devices) {
        var listItem, deviceId;

        // remove existing devices
        deviceList.innerHTML = "";
       //bt.setStatus("");
        
        devices.forEach(function(device) {
            listItem = document.createElement('li');
            listItem.className = "topcoat-list__item";
            if (device.hasOwnProperty("uuid")) { // TODO https://github.com/don/BluetoothSerial/issues/5
                deviceId = device.uuid;
            } else if (device.hasOwnProperty("address")) {
                deviceId = device.address;
            } else {
                deviceId = "ERROR " + JSON.stringify(device);
            }
            listItem.setAttribute('deviceId', deviceId);            
            listItem.innerHTML = device.name + "<br/><i>" + deviceId + "</i>";
            deviceList.appendChild(listItem);
        });

        if (devices.length === 0) {
            
            if (cordova.platformId === "ios") { // BLE
                bt.setStatus("No Bluetooth Peripherals Discovered.");
            } else { // Android
                bt.setStatus("Please Pair a Bluetooth Device.");
            }

        } else {
            bt.setStatus("Found " + devices.length + " device" + (devices.length === 1 ? "." : "s."));
        }
    },
    generateFailureFunction: function(message) {
        var func = function(reason) {
            var details = "";
            if (reason) {
                details += ": " + JSON.stringify(reason);
            }
            bt.setStatus(message + details);
        };
        return func;
    },
    onmessage: function(message) {
        //console.log(message);
        parseNMEA(message);
        if ($("#btMsg").is(":visible")) {
            msg.push(message)
            btMsg.value = msg;
            btMsg.scrollTop = btMsg.scrollHeight;
            if (i >= 20) {
                msg.shift();
            } else {
                i++;
            }
        };
    }
};

function gotFS(fileSystem) {
    //fileSystem.root.getDirectory("/Android/data/com.steller.draughtboard", {create: false, exclusive: false}, success, fail);
    //fileSystem.root.getFile("/Android/data/com.steller.draughtboard/draughts.txt", {create: true, exclusive: false}, gotFileEntry, fail);
    fileSystem.root.getFile("draughts.txt", {create: true, exclusive: false}, gotFileEntry, fail);
}
function gotFileEntry(fileEntry) {
    file.entry = fileEntry;
    fileEntry.createWriter(gotFileWriter, fail);
}
function gotFileWriter(writer) {
    file.writer.available = true;
    file.writer.object = writer;
}
function fail(error) {
    console.log(error.code);
}