/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var map;
var boundsLoaded;
var seaMarks;
var nextMark;
var myPos;
var useGPS = false;
var myMarker;
var shift;
var updateTime = new Date();
var appYes;
var myNMEA = {
    lat: "00 00.00",
    lng: "00 00.00",
    sog: "0.0",
    cog: "000",
    stw: "0.0",
    time: "00:00:00",
    twa: "000",
    twd: "000",
    tws: "0.0",
    awa: "000",
    aws: "0.0",
    hdg: "000"
}

var app = {
    btDevice: "unknown",
    chars: "",
    
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('DOMContentLoaded', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
        $(".main").hide();
        $("#map").show();
        $('.menu').jqsimplemenu();
        
        var appYes = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
        if (!appYes) {
          $("#3").hide();
          $("#4").hide();
          bt.connect();
        }
        //$('#clock').simpleClock();
        //  set size of the map div
        $('.main').width('100%');

        console.log("Device Dimension using PhoneGap");
        console.log("Width = " + screen.width);
        console.log("Height = " + screen.height);

        //alert('Screen Height: ' + $(window).height());

        drawmap("none");
        addMarks();
        if (useGPS) {onTrack();};
        //var timer = setInterval(function(){setTime();},1000);
        btn = $('<div class="leaflet-locate-control leaflet-bar leaflet-control"><a href=""></a></div>');
        $(btn).click(function(e) { e.preventDefault(); map.locate(); });
        $('.leaflet-top.leaflet-left').append(btn);

        $("#1").click(function(){
          $(".main").hide();
          $("#map").show();
        });
        $("#2").click(function(){
          $(".main").hide();
          $("#data").show();
        });
        $("#3").click(function(){
          $(".main").hide();
          $("#setup").show();
        });
        $("#4").click(function(){
          $(".main").hide();
          $("#btooth").show();
        });
        
        $("#refreshButton").click(function(){
          console.log("refreshButton");
          bt.list();
        });
        
        $("#disconnectButton").click(function(){
          console.log("disconnectButton");
          bt.disconnect;
        });
        
        $("#useGPS").change(function(){
            useGPS = !useGPS;
            console.log(useGPS);
        });
        
        bt.initialize();
        
        // check to see if Bluetooth is turned on.
        // this function is called only
        // if isEnabled(), below, returns success:
        var listPorts = function() {
            // list the available BT ports:
            bluetoothSerial.list(
                function(results) {
                    var table = "<table id=\"btSetup\">";
                    table = table + "<tr class=\"toprow\"><td> Name </td><td> MAC Address </td></tr>";
                    results.forEach(function(results) {
                    //app.display(JSON.stringify(results));
                        table = table + "<tr><td class=\"data\" onclick=\"app.manageConnection('" + results.address + "','" + results.name + "')\">" + results.name + "</td><td class=\"data\">" + results.address + "</td></tr>";
                    }),
                    table = table + "</table>";
                    document.getElementById("btSetup").innerHTML = table;
                },
                function(error) {
                    document.getElementById("btSetup").innerHTML = JSON.stringify(error);
                }
            );
        };

        // if isEnabled returns failure, this function is called:
        var notEnabled = function() {
            app.display("Bluetooth is not enabled.");
        };

         // check if Bluetooth is on:
        if (typeof bluetoothSerial !== "undefined") {
            bluetoothSerial.isEnabled(
                listPorts,
                notEnabled
            );
        } else {
            //$("#time").html(date.getHours());
        };
    },
    
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    
    /*
    Connects if not connected, and disconnects if connected:
*/
    manageConnection: function(macAddress, name) {
        btDevice = name;
        // connect() will get called only if isConnected() (below)
        // returns failure. In other words, if not connected, then connect:
        var connect = function () {
            // if not connected, do this:
            // clear the screen and display an attempt to connect
            app.clear();
            $("#btSetup").html("Attempting to connect to:" + btDevice);
            // attempt to connect:
            bluetoothSerial.connect(
                macAddress,  // device to connect to
                app.openPort,    // start listening if you succeed
                app.showError    // show the error if you fail
            );
        };

        // disconnect() will get called only if isConnected() (below)
        // returns success  In other words, if  connected, then disconnect:
        var disconnect = function () {
            document.getElementById("btSetup").innerHTML = "attempting to disconnect";
            // if connected, do this:
            bluetoothSerial.disconnect(
                app.closePort,     // stop listening to the port
                app.showError      // show the error if you fail
            );
        };

        // here's the real action of the manageConnection function:
        bluetoothSerial.isConnected(disconnect, connect);
    },
/*
    subscribes to a Bluetooth serial listener for newline
    and changes the button:
*/
    openPort: function() {
        // if you get a good Bluetooth serial connection:
        // change the button's name:
        //connectButton.innerHTML = "Disconnect";
        // set up a listener to listen for newlines
        // and display any new data that's come in since
        // the last newline:
        $("#btSetup").html("Connected to: " + btDevice);
        
        bluetoothSerial.subscribe('\n', function (data) {
            parseNMEA(data);

            now = new Date();
            if (now.getTime() - updateTime.getTime() > 3000) {
                updateTime = new Date();
                if (myNMEA.lat) {
                    myPos = L.latLng(myNMEA.lat, myNMEA.lng);
                    updateMarker(myNMEA.cog);
                    $("#pos").html(myNMEA.lat.toFixed(4) + "<br/>" + myNMEA.lng.toFixed(4));
                    $("#sog").html(myNMEA.speedKnots);
                    $("#cog").html(myNMEA.trackTrue);
                    if (nextMark) {
                        dtw = myPos.distanceTo(nextMark)*0.000539956803;
                        dtw = dtw.toFixed(2);
                        ttw = 999;
                        btw = getBaring(myPos, nextMark);

                        vmg = Math.cos(myNMEA.twa)*myNMEA.stw;
                        vmgtwp = Math.cos(btw-myNMEA.hdg)*myNMEA.stw;
                        $("#ttw").html(ttw);
                        $("#dtw").html(dtw);
                        $("#btw").html(btw);
                        updateMarker(myNMEA.cog);
                    };
    //                $("#time").html(line.timestamp);
                };

                if (myNMEA.stw)           {$("#speed").html(myNMEA.stw);};
                if (myNMEA.twa)           {$("#twa").html(myNMEA.twa);};
                if (myNMEA.tws)           {$("#tws").html(myNMEA.tws);};
                if (myNMEA.twd)           {$("#twd").html(myNMEA.twd);};
                if (line.twa)             {$("#shift").html(shift);};
                //$("#vmgPercent").html(line.lat);
            };
        });
    },

/*
    unsubscribes from any Bluetooth serial listener and changes the button:
*/
    closePort: function() {
        // if you get a good Bluetooth serial connection:
        document.getElementById("btSetup").innerHTML = "Disconnected from: " + btDevice;
        // change the button's name:
        //connectButton.innerHTML = "Connect";
        // unsubscribe from listening:
        bluetoothSerial.unsubscribe(
                function (data) {
                    document.getElementById("btSetup").innerHTML = data;
                },
                app.showError
        );
    },
/*
    appends @error to the message div:
*/
    showError: function(error) {
        document.getElementById("btSetup").innerHTML = error;
    },

/*
    appends @message to the message div:
*/
    display: function(message) {
        var display = document.getElementById("message"), // the message div
            lineBreak = document.createElement("br"),     // a line break
            label = document.createTextNode(message);     // create the label

        display.appendChild(lineBreak);          // add a line break
        display.appendChild(label);              // add the message node
    },
/*
    clears the message div:
*/
    clear: function() {
        var display = document.getElementById("message");
        document.getElementById("btSetup").innerHTML = "";
    }
};

function jumpTo(lon, lat, zoom) {
	var x = Lon2Merc(lon);
	var y = Lat2Merc(lat);
	map.setCenter(new L.LatLng().LonLat(x, y), zoom);
	return false;
}

function jumpTotrack() {
	map.zoomToExtent(lgpx.getDataExtent());
	return false;
}

function Lon2Merc(lon) {
	return 20037508.34 * lon / 180;
}

function Lat2Merc(lat) {
	lat = Math.log(Math.tan( (90 + lat) * Math.PI / 360)) / (Math.PI / 180);
	return 20037508.34 * lat / 180;
}

function drawmap(gpx_file) {

	// Add Layers to map
  var mapnikURL = 'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png';
  //var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/efad1102a6054f70b0b563e4671f96c5/{styleId}/256/{z}/{x}/{y}.png';
  var seaUrl = 'http://t1.openseamap.org/seamark/{z}/{x}/{y}.png';
  var npeUrl = 'http://a.ooc.openstreetmap.org/npe/{z}/{x}/{y}.png';
  var os1Url = 'http://a.ooc.openstreetmap.org/os1/{z}/{x}/{y}.jpg';
  var os7Url = 'http://a.ooc.openstreetmap.org/os7/{z}/{x}/{y}.jpg';
  var transportUrl = 'http://b.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png';
  var cycleUrl = 'http://b.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png';
  var localURL = 'tiles/{z}/{x}/{y}.jpg';
  
  var cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';

  var //minimal   = L.tileLayer(cloudmadeUrl, {styleId: 22677, attribution: cloudmadeAttribution}),
      //midnight  = L.tileLayer(cloudmadeUrl, {styleId: 999,   attribution: cloudmadeAttribution}),
      //motorways = L.tileLayer(cloudmadeUrl, {styleId: 46561, attribution: cloudmadeAttribution}),
      sea       = L.tileLayer(seaUrl, {attribution: cloudmadeAttribution}),
      npe       = L.tileLayer(npeUrl, {attribution: cloudmadeAttribution}),
      os1       = L.tileLayer(os1Url, {attribution: cloudmadeAttribution}),
      os7       = L.tileLayer(os7Url, {attribution: cloudmadeAttribution}),
      transport = L.tileLayer(transportUrl, {attribution: cloudmadeAttribution}),
      cycle     = L.tileLayer(cycleUrl, {attribution: cloudmadeAttribution}),
      local      = L.tileLayer(localURL, {attribution: cloudmadeAttribution}),
      mapnik    = L.tileLayer(mapnikURL, {attribution: cloudmadeAttribution});

    seaMarks = new L.LayerGroup();
    seaMarks.addLayer(sea);
    
    map = L.map('map', {
        center: new L.LatLng(50.815, -1.285),
        zoom: 12,
        layers: [mapnik, seaMarks],
        touchZoom: true
    });
  
    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        L.marker(e.latlng).addTo(map);

        L.circle(e.latlng, radius).addTo(map);
        map.panTo(e.latlng);
    }

    map.on('locationfound', onLocationFound);
  
    map.on('moveend', function() { 
        newBounds = getBounds();
        if (boundsLoaded == undefined || !boundsLoaded.contains(map.getBounds())) update(true);
        boundsLoaded = newBounds;
    });
  
  var baseMaps = {
    "Mapnik": mapnik,
    //"Minimal": minimal,
    //"Night View": midnight,
    "NPE": npe,
    "OS1": os1,
    "OS7": os7,
    "Transport": transport,
    "Cycle": cycle,
    "Local": local
  };
  
  var overlayMaps = {
    "Seamap": seaMarks
    //"Motorways": motorways
  };

  L.control.layers(baseMaps, overlayMaps).addTo(map);
  
  map.on('locationfound', onLocationFound);
	
	// Add the Layer with the GPX Track
	if (gpx_file !== "none") {
	  lgpx = new OpenLayers.Layer.Vector("GPX Route", {
		  strategies: [new OpenLayers.Strategy.Fixed()],
		  eventListeners: {
			  "loaded": jumpTotrack
		  },
		  protocol: new OpenLayers.Protocol.HTTP({
			  url: gpx_file,
			  format: new OpenLayers.Format.GPX()
		  }),
		  style: {strokeColor: "blue", strokeWidth: 5, strokeOpacity: 0.5},
		  projection: new OpenLayers.Projection("EPSG:4326")
	  });
	  //map.addLayers([lgpx]);
	}
}

function onTrack() {
  map.locate({setView: true, maxZoom: 12});
  
  map.on('locationfound', onLocationFound);
  map.locate({watch: true, enableHighAccuracy: true});
}

function onLocationFound(e) {
    var radius = e.accuracy / 2;
    L.marker(e.latlng).addTo(map);
    L.circle(e.latlng, radius).addTo(map);

    myPos = L.latLng(e.latitude, e.longitude);
    updateMarker(myNMEA.cog);
    if (nextMark !== undefined) {
        dtw = myPos.distanceTo(nextMark)*0.000539956803;
        dtw = dtw.toFixed(2);
        btw = getBaring(myPos, nextMark);
        dtw = dtw = myPos.distanceTo(nextMark)*0.000539956803;
        dtw = dtw.toFixed(2);
        ttw = 999;
        $("#ttw").html(ttw);
        $("#dtw").html(dtw);
        $("#btw").html(btw);
        //$("#vmgPercent").html(line.lat);
    };
    setTime();
    $("#pos").html(myPos.lat.toFixed(2) + "<br/>" + myPos.lng.toFixed(2));
}

function setTime() {
    var currentTime = new Date();
    var hours = ('0' + currentTime.getHours()).slice(-2);
    var minutes = ('0' + currentTime.getMinutes()).slice(-2);
    var seconds = ('0' + currentTime.getSeconds()).slice(-2);
    var timeStr = hours + ":" + minutes + ":" + seconds;
    $("#time").html(timeStr);
}

function addMarks() {
    externalURL = 'http://www.overpass-api.de/api/xapi?node[seamark%3Aname=*][bbox=' + getBounds().toBBoxString() + ']';
    
    var xmlDoc;
    $.get(externalURL, function() {console.log("Getting XAPI: " + externalURL);})
        .done(function(data) {
            console.log("Success!");
            console.log(data);
            parseXML(data);
        })
        .fail(function(xmlData) {
            console.log( "error" + xmlData);
        });
}

function update(moved) {
    //addMarks();
}

function parseXML(xmlData) {
    //x = xmlData.getElementsByTagName("node");
    //console.log("Semarks found: " + x.length);
    
    $(xmlData).find('node').each(function(){
        var id = $(this).attr('id');
        var lat = $(this).attr('lat');
        var lon = $(this).attr('lon');
        
        var name = '########none##########';
        $(this).find('tag').each(function(){
            var tag = $(this).attr('k');
            if (tag === "seamark:name") {
                name = $(this).attr('v');
            }
        });
        //console.log(name);
        createMarker(lat, lon, name);
    });
}

function createMarker(lat, lng, name) {
    var marker = L.circle([lat, lng], 80, {
        color: '#000',
        opacity: 0.1,
        fillColor: '#000',
        fillOpacity: 0.1
    });
    marker.bindPopup("<span onclick=\"navTo(" + lat + "," + lng + ",'" + name + "')\">" 
            + name + "</span>");
    seaMarks.addLayer(marker);
}

function updateMarker(cog) {
    if ($("#map").is(":visible")) {
        if (cog*1 >= 0) cog = (roundToNearest(cog, 10) + 180) % 360;
        var triIcon = L.icon({
            iconUrl: './img/markers/tri-'+cog+'.png',

            iconSize:     [30, 30] // size of the icon
            //shadowSize:   [50, 64], // size of the shadow
            //iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            //shadowAnchor: [4, 62],  // the same for the shadow
            //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        L.marker([myPos.lat, myPos.lng], {icon: triIcon}).addTo(map);
    };
}

function navTo(lat, lng, name) {
    nextMark = L.latLng(lat, lng);
    $("#navTo").html(name);
    alert("Navigating to " + name);
}

function getBaring(pos1, pos2) {
    lat1 = pos1.lat;
    lon1 = pos1.lng;
    lat2 = pos2.lat;
    lon2 = pos2.lng;
    dLon = lon2 - lon1;
    var y = Math.sin(dLon)*Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) -
        Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x) * 180 / Math.PI;
    if (brng < 0) {brng = 360 + brng;};
    brng = brng.toFixed(2)
    console.log(brng);
    return brng;
}

//  get bounds of the map, padded and rounded to nearest 0.1 degree
function getBounds() {
    b = map.getBounds().pad(2);
    step = (b.getEast() - b.getWest() > 5) ? 1 : 10;
    w = Math.floor(b.getWest() * step) / step;
    s = Math.floor(b.getSouth() * step) / step;
    e = Math.ceil(b.getEast() * step) / step;
    n = Math.ceil(b.getNorth() * step) / step;
    return new L.LatLngBounds([ s, w ], [ n, e ]);
}

function addDepths(data) {
	
/*	var box_extents = [
		[-1.275, 50.82, -1.278, 50.822]
	];*/
	
	var box_extents = new Array();
	var len = Object.keys(data[0]).length;

	for (var i = 0; i < len; i++) {
    	box_extents[i] = [data[1][i+1], data[0][i+1], data[3][i+1], data[2][i+1]];
	}
	
//	console.log(box_extents);
	
	var depthLayer  = new OpenLayers.Layer.Vector("Depth Layer", { style: {fillColor: '#FF0000', fillOpacity: 0.5, strokeWidth: 0}});
	
	var m0 = OpenLayers.Util.applyDefaults(m0, OpenLayers.Feature.Vector.style['default']);
	m0.fillColor = '#62AB74';
	m0.fillOpacity = 0.5;
	m0.strokeWidth = 0;
	
	var m1 = OpenLayers.Util.applyDefaults(m1, OpenLayers.Feature.Vector.style['default']);
	m1.fillColor = '#66FFCC';
	m1.fillOpacity = 0.5;
	m1.strokeWidth = 0;
	
	var m2 = OpenLayers.Util.applyDefaults(m2, OpenLayers.Feature.Vector.style['default']);
	m2.fillColor = '#3CBED9';
	m2.fillOpacity = 0.5;
	m2.strokeWidth = 0;
	
	var m5 = OpenLayers.Util.applyDefaults(m5, OpenLayers.Feature.Vector.style['default']);
	m5.fillColor = '#0066FF';
	m5.fillOpacity = 0.5;
	m5.strokeWidth = 0;
	
	var m10 = OpenLayers.Util.applyDefaults(m10, OpenLayers.Feature.Vector.style['default']);
	m10.fillColor = '#3300AA';
	m10.fillOpacity = 0.5;
	m10.strokeWidth = 0;
	
	for (var i = 0; i < len; i++) {
        ext = box_extents[i];
        bounds = OpenLayers.Bounds.fromArray(ext);
        bounds.transform(fromProj, toProj);
        
        box = new OpenLayers.Feature.Vector(bounds.toGeometry());
        if (data[4][i+1] <= 0) {
        	box.style = m0;
        } else if (data[4][i+1] <= 2) {
        	box.style = m2;
        } else if (data[4][i+1] <= 5) {
        	box.style = m5;
        } else if (data[4][i+1] <= 10) {
        	box.style = m10;
        }
        depthLayer.addFeatures(box);
    }

	map.addLayers([depthLayer]);
}

//  round x to nearest multiple of y
function roundToNearest(number, toNearest) {
    if (toNearest == 0) toNearest = 5;
    number *= 1;
    mod = number % toNearest;
    return (mod > toNearest / 2) ? number + toNearest - mod : number - mod;
}

function parseNMEA(data) {
    line = NMEA.parse(data);
    
    if ($("#btMsg").is(":visible")) {
        $("#btMsg").html(data);
    };
    
    var a = 0.7;
    var b = 0.3;
    
    if (line.stw)           myNMEA.stw = myNMEA.stw*a + line.stw*b;
    if (line.speedKnots)    myNMEA.sog = myNMEA.sog*a + line.speedKnots*b;
    if (line.trackTrue)     myNMEA.cog = myNMEA.cog*a + line.trackTrue*b;
    if (line.lat)           myNMEA.lat = line.lat;
    if (line.lon)           myNMEA.lng = line.lon;
    if (line.twa)           {
        myNMEA.twa = myNMEA.twa*a + line.twa*b;
        shift = line.twa-myNMEA.twa;
    }
    if (line.tws)           myNMEA.tws = myNMEA.tws*a + line.tws*b;
    if (line.twd)           myNMEA.twd = myNMEA.twd*a + line.twd*b;
    if (line.hdg)           myNMEA.hdg = myNMEA.twd*a + line.hdg*b;
    
    //            if (line.stw)           {$("#speed").html(line.stw);};
//            if (line.speedKnots)    {$("#sog").html(line.speedKnots);};
//            if (line.trackTrue)     {$("#cog").html(line.trackTrue);};
//            if (line.type == "nav-info") {
//                myPos = L.latLng(line.lat, line.lon);
//                if (nextMark) {
//                    dtw = myPos.distanceTo(nextMark)*0.000539956803;
//                    dtw = dtw.toFixed(2);
//                    ttw = 999;
//                    btw = getBaring(myPos, nextMark);
//                    
//                    vmg = Math.cos(nmea.twa)*nmea.stw;
//                    vmgtwp = Math.cos(btw-hdg)*nmea.stw;
//                    $("#ttw").html(ttw);
//                    $("#dtw").html(dtw);
//                    $("#btw").html(btw);
//                }
//                $("#pos").html(line.lat + "<br/>" + line.lon);
//                $("#time").html(line.timestamp);
//                updateMarker(270);
//                //$("#shift").html(line.lat);
//                //$("#vmgPercent").html(line.lat);
//            };
//            
//            if (line.twa)           {$("#twa").html(line.twa);};
//            if (line.tws)           {$("#tws").html(line.tws);};
//            if (line.twd)           {$("#twd").html(line.twd);};
//            //if (line.twa)           {$("#vmg").html(line.speedKnots);};
    return true;
}

  $.fn.simpleClock = function () {

    // Define weekdays and months
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // getTime - Where the magic happens ...
    function getTime() {
      var date = new Date(),
      hour = date.getHours();
      return {
        day: weekdays[date.getDay()],
        date: date.getDate(),
        month: months[date.getMonth()],
        hour: appendZero(hour),
        minute: appendZero(date.getMinutes()),
        second: appendZero(date.getSeconds())
      };
    }

    // appendZero - If the number is less than 10, add a leading zero. 
    function appendZero(num) {
      if (num < 10) {
        return "0" + num;
      }
      return num;
    }

    // refreshTime - Build the clock.
    function refreshTime() {
      var now = getTime();
      $('#date').html(now.day + ', ' + now.date + '. ' + now.month);
      $('#time').html("<span class='hour'>" + now.hour + "</span>:" + "<span class='minute'>" + now.minute + "</span>:" + "<span class='second'>" + now.second + "</span>");
    }

    // Tick tock - Run the clock.
    refreshTime();
    setInterval(refreshTime, 1000);

  };
