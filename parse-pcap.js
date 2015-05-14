var fs = require('fs');
var maxmind = require('maxmind');
var pcap = require('pcap');
var insubnet = require('insubnet');
var mapdata = require('./mapdata.js');
var rir = require('./rir.js');
var config = require('./config.js');

insubnet.setSubnets(config.myips);
maxmind.init('/usr/local/share/GeoIP/GeoIPASNum.dat');
var tcpt = new pcap.TCPTracker();
var pcap_session = pcap.createOfflineSession(process.argv[2], "");

//asn, inbool, time, ip, data, duration, egress
tcpt.on('session', function (session) {
	session.on('end', function (end) {
		var src = end.src.split(":");
		var srcip = src[0];
		var sport = src[1];
		var dst = end.dst.split(":");
		var dstip = dst[0];
		var dport = dst[1];
		var data = end.send_bytes_payload + end.recv_bytes_payload;
		var duration = end.close_time - end.syn_time;
		var time = end.syn_time;
		var inbool, asn, asntext, egress, ip, port;
		if (insubnet.Validate(srcip)) {
			// outbound
			var asna = maxmind.getAsn(dstip);
			if (asna) {
				port = dport;
				var asnum = asna.split(" ");
                        	asn = asnum[0].substr(2);
				asntext = asnum.join(" ");
			} else {
				asn = null;
			}
			ip = dstip;
			egress = end.send_bytes_payload;
			inbool = false;
		} else {
			// inbound
			var asna = maxmind.getAsn(srcip);
                        if (asna) {
				port = dport; // actually you really want this in either case
                                var asnum = asna.split(" ");
                                asn = asnum[0].substr(2);
				asntext = asnum.join(" ");
                        } else {
                                asn = null;
                        }
			ip = srcip;
			egress = end.recv_bytes_payload;
			inbool = true;
		}
		addSession(asn,asntext,inbool,ip,port,time,data,duration,egress);
	});
});

pcap_session.on('packet', function (raw) {
	var packet = pcap.decode.packet(raw);
	tcpt.track_packet(packet);
	//console.log(packet.payload.dhost);
});

pcap_session.on('complete', function () {
	var writedata = "var pcapmap = \n" + JSON.stringify(mapdata.map, null, 2) + ';';
	fs.writeFile('./js/pcapmap.js', writedata, function(err) {
    		if(err) {
        		return console.log(err);
    		}
    		console.log("js/pcapmap.js created");
	});
});

function addSession(asn, asntext, inbool, ip, port, time, data, duration, egress) {
        var xy = rir.rir[asn];
	if (typeof xy === 'undefined') {
		return;
	}
        var axy = xy.replace(/\[/g, '').split(']');
        var x = axy[0];
        var y = axy[1];
        var c = mapdata.map[x][y];
        c.x = x;
        c.y = y;
	c.asntext = asntext;
        c.altitude = c.altitude || 0;
        c.sessions = c.sessions || {};
        c.inbound = c.inbound || 0;
        c.outbound = c.outbound || 0;
        c.data = c.data || 0;
	c.egress = c.egress || 0;
        c.maxegress = c.maxegress || 0;
        c.maxduration = c.maxduration || 0;
        c.sessions[ip] = c.sessions[ip] || [];
        c.sessions[ip].push({"time":time,"port":port,"data":data,"duration":duration,"egress":egress});
        if (inbool) { c.inbound += 1; } else { c.outbound += 1; }
        c.data += data;
	c.egress += egress;
        // max duration
        if (duration > c.maxduration) { c.maxduration = duration; }
        if (egress > c.maxegress) { c.maxegress = egress; }
        // Change appearance accordingly
        // Set elevation according to ranges here
	if ((c.altitude < 4) && (c.data > 5000000)) {
                terraform(4, c);
        }
        if ((c.altitude < 3) && (c.data > 1000000)) {
                terraform(3, c);
        }
        else if ((c.altitude < 2) && (c.data > 500000)) {
                terraform(2, c);
        }
        else if ((c.altitude < 1) && (c.data > 0)) {
                terraform(1, c);
        }
}

function terraform(level, c) {
        c.altitude = level;
        var x = c.x;
        var y = c.y;
        var a = [];
        var coords1 = [
                0,-1,
                -1,0,
                1,0,
                0,1
        ];
        var coords2 = [
                -1,-1,
                1,-1,
                -1,1,
                1,1
        ];
        var coords3 = [
                -1,-2,
                0,-2,
                1,-2,
                -2,-1,
                -2,0,
                -2,1,
                2,-1,
                2,0,
                2,1,
                -1,2,
                0,2,
                1,2
        ];
	var coords4 = [
		-1,-3,
		0,-3,
		1,-3,
		-2,-2,
		2,-2,
		-3,-1,
		3,-1,
		-3,0,
		3,0,
		-3,1,
		3,1,
		-2,2,
		2,2,
		-1,3,
		0,3,
		1,3
	];


	/*      444
	       43334 	
	      4321234
	      431x134
	      4321234
	       43334
	        444
	*/

        if (level == 1) {
                raise(coords1,1);
        }
        if (level == 2) {
                raise(coords1,2);
                raise(coords2,1);
        }
        if (level == 3) {
                raise(coords1,3);
                raise(coords2,2);
                raise(coords3,1);
        }
	if (level == 4) {
		raise(coords1,4);
                raise(coords2,3);
                raise(coords3,2);
		raise(coords4,1);
	}
		
	function raise(coords,lvl) {
                // Go through specified coords array, get rid of off-screen ones, set x/y, push to a
                for (var i = 0; i < coords.length; i += 2) {
                        if ((parseInt(x) + coords[i] >= 0) && (parseInt(x) + coords[i] < 66)) { //needed to prevent [-1][y] problem
                                //console.log(parseInt(x) + coords[i],parseInt(y) + coords[i+1]);
                                var n = mapdata.map[parseInt(x) + coords[i]][parseInt(y) + coords[i+1]];
                                if (typeof(n) != "undefined") {
                                        n.x = parseInt(x) + coords[i];
                                        n.y = parseInt(y) + coords[i+1];
                                        a.push(n);
                                }
                        }
                }
                // Add to present elevation if already set, otherwise it's lvl - 1
                for (var i = 0; i < a.length; i++) {
                        if (typeof(a[i].altitude) != "undefined") {
                                if (a[i].altitude < lvl) {
                                        a[i].altitude = parseInt(a[i].altitude) + 1;
                                }
                        }
                        else {
                                a[i].altitude = parseInt(lvl) - 1;
                        }
			// ensure shoreline
			if (a[i].altitude > 0) {
				if (parseInt(x) + 1 < 66) {
					var n = mapdata.map[parseInt(a[i].x) + 1][parseInt(a[i].y)];
					if (typeof(n) != "undefined") {
						n.altitude = n.altitude || 0;
					}
					n = mapdata.map[parseInt(a[i].x)][parseInt(a[i].y) + 1];
					if (typeof(n) != "undefined") {
                                                n.altitude = n.altitude || 0;
                                        }
				}
				if (parseInt(a[i].x) - 1 >= 0) {
                                        var n = mapdata.map[parseInt(a[i].x) - 1][parseInt(a[i].y)];
                                        if (typeof(n) != "undefined") {
                                                n.altitude = n.altitude || 0;
                                        }
					n = mapdata.map[parseInt(a[i].x)][parseInt(a[i].y) - 1];
					if (typeof(n) != "undefined") {
                                                n.altitude = n.altitude || 0;
                                        }
                                }
                	}
        	}
	}
}
/* 
{ src: '108.161.250.57:50248',
  src_name: '108.161.250.57:50248',
  dst: '192.168.100.111:80',
  dst_name: '192.168.100.111:80',
  state: 'CLOSED',
  current_cap_time: 1430493741.965878,
  syn_time: 1430493741.85929,
  missed_syn: null,
  connect_time: 1430493741.859595,
  send_isn: 2609403242,
  send_window_scale: 1,
  send_packets: { '2609404730': 1430493741.859644 },
  send_acks: { '3652556874': 1430493741.859644 },
  send_retrans: {},
  send_next_seq: 2609403243,
  send_acked_seq: null,
  send_bytes_ip: 60,
  send_bytes_tcp: 64,
  send_bytes_payload: 107,
  recv_isn: 3652556873,
  recv_window_scale: 1,
  recv_packets: 
   { '3652556874': 1430493741.85931,
     '3652557108': 1430493741.963305 },
  recv_acks: 
   { '2609403243': 1430493741.85931,
     '2609404730': 1430493741.963394 },
  recv_retrans: {},
  recv_next_seq: null,
  recv_acked_seq: null,
  recv_bytes_ip: 100,
  recv_bytes_tcp: 104,
  recv_bytes_payload: 234,
  domain: null,
  _events: { end: [Function] },
  _maxListeners: undefined,
  close_time: 1430493741.965878 }
*/
