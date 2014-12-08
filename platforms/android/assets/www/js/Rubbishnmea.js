//  A NMEA-0183 parser based on the format given here: http://www.tronico.fi/OH6NT/docs/NMEA0183.pdf
//  Now modified by DoZ to hold the values it collects from NMEA lines

//  Based on http://github.com/jamesp/node-nmea/
//  but modified to be standalone rather than node.js dependent
//  and including DBT & MWV

var timestamp;
var lat;
var latPole;
var lon;
var lonPole;
var fixType;
var numSat;
var horDilution;
var alt;
var altUnit;
var geoidalSep;
var geoidalSepUnit;
var differentialAge;
var differentialRefStn;
var status;
var sog;
var trackTrue;
var trackMagnetic;
var twd;
var tws;
var stw;
var hdg;
var depthMeters;
        
var validLine = function(line) {
    // check that the line passes checksum validation
    // checksum is the XOR of all characters between $ and * in the message.
    // checksum reference is provided as a hex value after the * in the message.
    var checkVal = 0;
    var parts = line.split('*');
    for (var i=1; i < parts[0].length; i++) {
        checkVal = checkVal ^ parts[0].charCodeAt(i);
    };
    return checkVal == parseInt(parts[1], 16);
};

function getLatLng(latlng, loc) {
    latlng = latlng / 100;
    degrees = parseInt("latlng");
    minutes = latlng - degrees;
    minutes = minutes * 100 / 60;
    latlng = degrees + minutes;
    if (loc == "s" || loc == "S" || loc == "w" || loc == "W") {latlng = latlng * -1;};
    return latlng;
};

NMEA = {};
NMEA.parsers = {
    GGA: function(fields) {
        var FIX_TYPE = ['none', 'fix', 'delta'];
        
        timestamp = fields[1];
        lat = getLatLng(fields[2], fields[3]);
        latPole = fields[3];
        lon = getLatLng(fields[4], fields[5]);
        lonPole = fields[5];
        fixType = FIX_TYPE[+fields[6]];
        numSat = +fields[7];
        horDilution = +fields[8];
        alt = +fields[9];
        altUnit = fields[10];
        geoidalSep = +fields[11];
        geoidalSepUnit = fields[12];
        differentialAge = +fields[13];
        differentialRefStn = fields[14];
    },
    GLL: function(fields) {
        timestamp = fields[5];
        lat = getLatLng(fields[1], fields[2]);
        latPole = fields[2];
        lon = getLatLng(fields[3], fields[4]);
        lonPole = fields[4];
        status = fields[6] == 'A' ? 'valid' : 'invalid';
    },
    RMC: function(fields) {
        timestamp = fields[1];
        status = fields[2] == 'V' ? 'warning' : 'valid';
        lat = getLatLng(fields[3], fields[4]);
        latPole = fields[4],
        lon = getLatLng(fields[5], fields[6]);
        lonPole = fields[6];
        sog = +fields[7];
        trackTrue = +fields[8];
        date = fields[9];
        variation = +fields[10];
        variationPole = fields[11];
    },
    VTG: function(fields) {
        trackTrue = +fields[1];
        trackMagnetic = +fields[3];
        sog = +fields[5];
        //speedKmph = +fields[7];
    },
    APB: function(fields) {
/*
=== APB - Autopilot Sentence "B" ===

                                         13    15
------------------------------------------------------------------------------
        1 2 3   4 5 6 7 8   9 10   11  12|   14|
        | | |   | | | | |   | |    |   | |   | |
 $--APB,A,A,x.x,a,N,A,A,x.x,a,c--c,x.x,a,x.x,a*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

1. Status
     V = LORAN-C Blink or SNR warning
     V = general warning flag or other navigation systems when a reliable
         fix is not available
2. Status
     V = Loran-C Cycle Lock warning flag
     A = OK or not used
3. Cross Track Error Magnitude
4. Direction to steer, L or R
5. Cross Track Units, N = Nautical Miles
6. Status
     A = Arrival Circle Entered
7. Status
     A = Perpendicular passed at waypoint
8. Bearing origin to destination
9. M = Magnetic, T = True
10. Destination Waypoint ID
11. Bearing, present position to Destination
12. M = Magnetic, T = True
13. Heading to steer to destination waypoint
14. M = Magnetic, T = True
15. Checksum
*/
        status1 = fields[1];
        status2 = fields[2];
        xteMagn = fields[3];
        steerDir = fields[4];
        xteUnit = fields[5];
        arrivalCircleStatus = fields[6];
        arrivalPerpendicularStatus = fields[7];
        bearingOrig2Dest = +fields[8];
        bearingOrig2DestType = fields[9];
        waypoint = fields[10];
        bearing2Dest = +fields[11];
        bearingDestType = fields[12];
        heading2steer = +fields[13];
        headingDestType = fields[14];
    },
    GSA: function(fields) {
      // $GPGSA,A,3,12,05,25,29,,,,,,,,,9.4,7.6,5.6
       var sats = [];
       for (var i=1; i < 13; i++) {
           if (fields[i+2]) sats.push(+fields[i+2]);
       };
        selectionMode = fields[1];
        mode = +fields[2];
        satellites = sats;
        PDOP = fields[15];
        HDOP = fields[16];
        VDOP = fields[17];
    },
//    GSV: function(fields) {
//        // $GPGSV,3,1,12, 05,58,322,36, 02,55,032,, 26,50,173,, 04,31,085,
//        var numRecords = (fields.length - 4) / 4,
//            sats = [];
//        for (var i=0; i < numRecords; i++) {
//            var offset = i * 4 + 4;
//            sats.push({id: fields[offset],
//                       elevationDeg: +fields[offset+1],
//                       azimuthTrue: +fields[offset+2],
//                       SNRdB: +fields[offset+3]});
//        };
//        return {
//            type: 'satellite-list-partial',
//            numMsgs: +fields[1],
//            msgNum: +fields[2],
//            satsInView: +fields[3],
//            satellites: sats
//        };
//    },
    BWC: function(fields) {
/*
 === BWC - Bearing & Distance to Waypoint - Great Circle ===
------------------------------------------------------------------------------
                                                         12
        1         2       3 4        5 6   7 8   9 10  11|    13 14
        |         |       | |        | |   | |   | |   | |    |   |
 $--BEC,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x.x,T,x.x,M,x.x,N,c--c,m,*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
1. UTCTime
2. Waypoint Latitude
3. N = North, S = South
4. Waypoint Longitude
5. E = East, W = West
6. Bearing, True
7. T = True
8. Bearing, Magnetic
9. M = Magnetic
10. Nautical Miles
11. N = Nautical Miles
12. Waypoint ID
13. FAA mode indicator (NMEA 2.3 and later, optional)
14. Checksum
*/

        //type: '2waypoint',
        lat = getLatLng(fields[2], fields[3]);
        latPole = fields[3];
        lon = getLatLng(fields[4], fields[5]);
        lonPole = fields[5];
        bearingtrue = fields[6];
        bearingmag = fields[8];
        distance = fields[10];
        id = fields[12];
    },
    VWT: function(fields) {
/* VWT True Wind Speed and Angle
$--VWT,x.x,a,x.x,N,x.x,M,x.x,K*hh
1) Calculated wind angle relative to the vessel, 0 to 180 deg
2) left/right L/R of vessel heading
3) Calculated wind Speed
4) N = knots
5) Wind speed
6) M = meters/second
7) Wind speed
8) K*hh = Km/Hr
9) Checksum*/
        if (fields[2] == "L" || fields[2] == "left") {
            fields[1] = fields[1] * -1;
        }
        //type:       "true-wind",
        twd = +fields[1];
        wSide = fields[2];
        tws = +fields[3];
    },

    VHW: function(fields) {
/*VHW Water Speed and Heading
 1 2 3 4 5 6 7 8 9
 | | | | | | | | |
$--VHW,x.x,T,x.x,M,x.x,N,x.x,K*hh
1) Degress True
2) T = True
3) Degrees Magnetic
4) M = Magnetic
5) Knots (speed of vessel relative to the water)
6) N = Knots
7) Kilometers (speed of vessel relative to the water)
8) K = Kilometres
9) Checksum*/
        
        //type:       "boat-speed-heading",
        stw = +   fields[5];
        hdg =     fields[3];
    },

    DBT: function(fields) {
/*
=== DBT - Depth below transducer ===

------------------------------------------------------------------------------
       1   2 3   4 5   6 7
       |   | |   | |   | |
$--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

1. Depth, feet
2. f = feet
3. Depth, meters
4. M = meters
5. Depth, Fathoms
6. F = Fathoms
7. Checksum
*/
        //type: "depth-transducer",
        depthMeters = +fields[3],
        depthFeet = +fields[1];
    },
    MWV: function(fields) {
/*
=== MWV - Wind Speed and Angle ===

------------------------------------------------------------------------------
       1   2 3   4 5
       |   | |   | |
$--MWV,x.x,a,x.x,a*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

1. Wind Angle, 0 to 360 degrees
2. Reference, R = Relative, T = True
3. Wind Speed
4. Wind Speed Units, K/M/N
5. Checksum
*/
        if (fields[1] > 180) {
            fields[1] = fields[1] * -1;
        }
        units = fields[4];
        if (units == "K") k = 0.539957;
        if (units == "M") k = 0.868976;

        //type: 'wind',
        reference = fields[2];
        if (reference == "T" || reference == "t") {
            twa = +fields[1];
            tws: +fields[3] * k;
        } else {
            aws = +fields[1];
            aws: +fields[3] * k;
        };
    }
};

//  parse function
NMEA.prototype.parse = function(line) {
    if (validLine(line)) {
        var fields = line.split('*')[0].split(','),
            talker_id,
            msg_fmt;
        if (fields[0].charAt(1) == 'P') {
            talker_id = 'P'; // Proprietary
            msg_fmt = fields[0].substr(2);
        } else {
            talker_id = fields[0].substr(1, 2);
            msg_fmt = fields[0].substr(3);
        }
        parser = NMEA.parsers[msg_fmt];
        if (parser) {
            var val = parser(fields);
            val.talker_id = talker_id;
            return val;
        }
    }
};