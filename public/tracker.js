(function(){
    // avoid running twice
    if(window.__RA_LOADED__) return;
    window.__RA_LOADED__ = true;

    // Logging disabled by default (set to true to enable debugging)
    var DEBUG = false;
    
    function log(message, data) {
        if (DEBUG) {
            console.log("[ra] " + new Date().toISOString() + " - " + message, data || '');
        }
    }

    function sendPageView() {
        try{
            var domain = window.location.hostname;
            var path = window.location.pathname + window.location.search;
            var url = window.location.href;
            var referrer = document.referrer || "";
            var title = document.title || "";

            log("sendPageView called", {
                domain: domain,
                path: path,
                url: url,
                readyState: document.readyState
            });

            // optional: simple session id using localStorage
            var sessionKey = 'ra_session_id';
            var sessionId = null;

            try{
                if(window.localStorage){
                    sessionId = window.localStorage.getItem(sessionKey);
                    if(!sessionId){
                        sessionId = self.crypto && self.crypto.randomUUID 
                            ? self.crypto.randomUUID() 
                            : String(Math.random()).slice(2)+Date.now().toString(36);
                        window.localStorage.setItem(sessionKey, sessionId);
                        log("Created new session ID", sessionId);
                    } else {
                        log("Using existing session ID", sessionId);
                    }
                }
            }catch(e){
                log("localStorage error", e);
            }

            var payload = {
                domain: domain,
                path: path,
                url: url,
                referrer: referrer,
                title: title,
                sessionId: sessionId,
                viewportWidth: window.innerWidth || document.documentElement.clientWidth,
                viewportHeight: window.innerHeight || document.documentElement.clientHeight,
            };

            log("Payload created", payload);

            // Determine the analytics server URL
            // If script is loaded from localhost:3000, use that; otherwise use the script's origin
            var scriptSrc = (function(){
                var scripts = document.getElementsByTagName('script');
                for(var i = 0; i < scripts.length; i++){
                    if(scripts[i].src && scripts[i].src.indexOf('tracker.js') !== -1){
                        return scripts[i].src;
                    }
                }
                return '';
            })();
            
            var analyticsUrl = scriptSrc ? scriptSrc.replace('/tracker.js', '/api/events') : 'http://localhost:3000/api/events';
            
            log("Sending event to", analyticsUrl);
            
            var sendTime = Date.now();
            fetch(analyticsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                keepalive: true // important for sending data during unload
            }).then(function(response){
                var responseTime = Date.now() - sendTime;
                log("Event sent successfully", {
                    status: response.status,
                    statusText: response.statusText,
                    responseTime: responseTime + "ms",
                    url: url,
                    path: path
                });
            }).catch(function(err){
                log("Failed to send event", {
                    error: err.message || err,
                    url: url,
                    path: path
                });
            });
        }catch(e){
            log("Error building event", {
                error: e.message || e,
                stack: e.stack
            });
        }
    }

    // Track initial page load
    if (document.readyState === "complete") {
        log("Document already complete, sending page view");
        sendPageView();
    } else {
        log("Waiting for document load event");
        window.addEventListener("load", function() {
            log("Document load event fired");
            sendPageView();
        });
    }

    // Track page navigations (for SPAs and browser back/forward)
    var lastPath = window.location.pathname + window.location.search;
    
    // Track popstate (browser back/forward)
    window.addEventListener("popstate", function() {
        var currentPath = window.location.pathname + window.location.search;
        if (currentPath !== lastPath) {
            log("Popstate navigation detected", {
                from: lastPath,
                to: currentPath
            });
            lastPath = currentPath;
            sendPageView();
        }
    });

    // Track pushState/replaceState (SPA navigation)
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        setTimeout(function() {
            var currentPath = window.location.pathname + window.location.search;
            if (currentPath !== lastPath) {
                log("pushState navigation detected", {
                    from: lastPath,
                    to: currentPath
                });
                lastPath = currentPath;
                sendPageView();
            }
        }, 0);
    };
    
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        setTimeout(function() {
            var currentPath = window.location.pathname + window.location.search;
            if (currentPath !== lastPath) {
                log("replaceState navigation detected", {
                    from: lastPath,
                    to: currentPath
                });
                lastPath = currentPath;
                sendPageView();
            }
        }, 0);
    };

    // Expose API for manual tracking
    window.ra = window.ra || {};
    window.ra.trackPageView = function (pathOverride) {
        log("Manual trackPageView called", { pathOverride: pathOverride });
        if (pathOverride) {
            // Temporarily override path for this tracking
            var originalPath = window.location.pathname;
            Object.defineProperty(window.location, 'pathname', {
                get: function() { return pathOverride.split('?')[0]; },
                configurable: true
            });
            sendPageView();
            Object.defineProperty(window.location, 'pathname', {
                get: function() { return originalPath; },
                configurable: true
            });
        } else {
            sendPageView();
        }
    };
    
    log("Tracker initialized", {
        domain: window.location.hostname,
        path: window.location.pathname,
        url: window.location.href
    });
})();

// <script src="https://analytics.yourdomain.com/tracker.js" async></script>