Node-profiling-proxy
================================

Node-profiling-proxy is a simple HTTP proxy that forwards requests unchanged to a specified target web service, while transparently recording response time and bytes transferred. When the special /_dump page is requested (or the profiling process is killed), a summary with statistics is shown. Node-profiling-proxy can be used to get an impression of the type of demand for a web service, as well as an overview of which request handlers need tuning.


Usage
-------------------------
* Change hostname and port for the proxy and the target web service in config.js
* Run the proxy: node ./profiling-proxy.js
* Use the web service as you usually would through the proxy
* request the /_dump page from a browser to get profiling data or press Ctrl-C to stop the server and dump the results to the console

FAQ
-------------------------
* _Why not just do this in the web service itself?_
	Adding profiling code to your web service is not difficult, but requires you to modify code at a very general level in your service. Furthermore, if you run a service that uses different processes (PHP in some cases, and node with clustering turned on) then it may not be feasible to share profiling data between these processes. Node-profiling-proxy is a drop-in solution that works with all HTTP services. Because it is written in NodeJS, it runs on Linux, Windows and OS X.

* _Who wrote this code?_
	Node-profiling-proxy was written by Tommy van der Vorst for Pixelspark. 
