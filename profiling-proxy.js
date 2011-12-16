/** Copyright (c) 2011, Pixelspark (pixelspark.nl)
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. **/
var System = require("util");
var HTTP = require("http");
var Config = require("./config").config;

var Profile = {};
var profileStart = new Date().getTime();

// Create empty profile objects for each pattern specified in the configuration
for(var k in Config.profile) {
	Profile[k] = {};
}

// This dumps the Profile object to a human-readable form
function dump() {
	var profileTime = new Date().getTime() - profileStart;
	
	var d = "";
	for(var k in Config.profile) {
		d += (k+":\r\n");
		var info = Profile[k];
		var totalCount = 0;
		var totalTime = 0;
		for(var t in info) {
			var trace = info[t];
			totalCount += trace.count;
			totalTime += trace.totalTime;
			
			d += "- "+t+":\t";
			
			d += trace.count+"x, ";
			d += Math.round(trace.totalTime/trace.count)+"ms avg; ";
			d += Math.round(trace.totalSent/trace.count)+"b sent on average, "+trace.totalSent+"b total";
			d += "("+(Math.round((1000*trace.totalSent/trace.totalTime))+"bps)")+"\r\n";
		}
		d += Math.round(1000*totalCount/profileTime)+" requests/s\r\n\r\n";
	}
	
	
	d += "Profiled for "+Math.round(profileTime)+"ms";
	return d;
}

System.log("Starting profiling proxy at "+Config.host+":"+Config.port);

HTTP.createServer(function(request, response) {
	// Log start time of request and number of bytes sent back by the service
	var start = new Date().getTime();
	var sentBytes = 0;
	System.log(request.method+" "+request.url);
	
	// If the request is /_dump, return a human-readable summary of the profile collected up until now
	if(request.url==="/_dump") {
		response.end(dump());
		return;
	}
	// If the request is /_reset, clear currently stored profile data.
	else if(request.url==="/_reset") {
		for(var k in Config.profile) {
			Profile[k] = {};
		}
		response.end("OK");
		profileStart = new Date().getTime();
		return;
	}
	
	// Create a request for the target web service
	var target = HTTP.createClient(Config.targetPort, Config.target);
	var forward = target.request(request.method, request.url, request.headers);
	
	forward.on("error", function(err) {
		System.log("Proxy error: "+err);
	});
	
	forward.addListener('response', function(reply) {
		// This allows cross-origin AJAX request if the client side of the AJAX app is on another port
		reply.headers["Access-Control-Allow-Headers"] = "X-Requested-With";
		reply.headers["Access-Control-Allow-Origin"] = "http://localhost:"+Config.port;
		response.writeHead(reply.statusCode, reply.headers);
		
		// Forward returned data to client
		reply.addListener('data', function(chunk) {
			sentBytes += chunk.length;
			response.write(chunk, 'binary');		
		});
		
		reply.addListener('end', function() {
			response.end();
			
			// Process profile trace
			for(var k in Config.profile) {
				var pattern = Config.profile[k];
				var data = pattern.exec(request.url);
				if(data!==null) {
					var key = request.method;
					
					if(data.length>0) {
						key += ":";
						for(var a=1; a<data.length; a++) {
							key += data[a]+((a!=data.length-1)?";":"");
						}
					}
					
					var time = new Date().getTime() - start;
					
					var info = Profile[k];
					if(!(key in info)) {
						info[key] = {count:1, totalTime:time, totalSent:sentBytes};
					}
					else {
						info[key].count++;
						info[key].totalTime += time;
						info[key].totalSent += sentBytes;
					}
				}
			}
		});
	});
	
	// Proxy any posted data
	request.addListener('data', function(chunk) {
		forward.write(chunk, 'binary');
	});
	request.addListener('end', function() {
		forward.end();
	});
	
}).listen(Config.port, Config.host);

// This makes sure that we catch any uncaught exception (otherwise, the process would just terminate)
process.addListener('uncaughtException', function(err) {
	System.log("Caught exception: "+err+"\r\n"+err.stack);
	System.log(System.inspect(err));
});

process.addListener("SIGINT", function(e) {
	// Summarize profile data
	System.log("Terminating; recorded profile:");
	System.puts("");
	
	System.puts(dump());
	
	process.exit(0);
});