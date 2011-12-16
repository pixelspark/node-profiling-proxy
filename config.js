exports.config = {
	host: null,				// The IP address or host name to bind the proxy server to. 'null' means all of them
	port: 8002,				// The port to bind the proxy server to
	target: "127.0.0.1",	// IP or hostname of the target web service
	targetPort: 80,			// Port number of the target web service
	
	
	/* List of patterns with identifying names that define which calls are grouped and profiled together. If you capture
	subexpressions with parentheses, these are grouped together in the final profile. One request can map to many different
	patterns. Remember to specify the /g flag if you want to use capturing. Add /i to make the pattern case-insensitive. */
	profile: {		
		pageQuery: /^\/server\/pages\/([^\/]+)\/query$/gi,
		pageInfo: /^\/server\/pages\/[^\/]+\/info$/gi,
		pageAsset: /^\/server\/pages\/[^\/]+\/asset/gi,
		pageChildren: /^\/server\/pages\/[^\/]+\/children$/gi,
		longPolling: /^\/server\/events\/get$/gi,
		allServer: /^\/server\//,
		all: /./
	}
};