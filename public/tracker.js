(function(){
    // avoid running twice
    if(window.__RA_LOADED__) return;
    window.__RA_LOADED__ = true;

    // Logging disabled by default (set to true to enable debugging)
    var DEBUG = false;
    
    // Debounce tracking to prevent duplicate page views
    var DEBOUNCE_MS = 1000; // 1 second debounce window
    var lastSentPath = null;
    var lastSentTime = 0;
    
    // Additional localStorage-based deduplication for catching any edge cases
    var STORAGE_DEBOUNCE_KEY = 'ra_last_pv';
    
    function getStoredLastPageView() {
        try {
            if (window.localStorage) {
                var stored = window.localStorage.getItem(STORAGE_DEBOUNCE_KEY);
                if (stored) {
                    return JSON.parse(stored);
                }
            }
        } catch(e) { /* ignore */ }
        return null;
    }
    
    function setStoredLastPageView(path, time) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(STORAGE_DEBOUNCE_KEY, JSON.stringify({
                    path: path,
                    time: time
                }));
            }
        } catch(e) { /* ignore */ }
    }
    
    function log(message, data) {
        if (DEBUG) {
            console.log("[ra] " + new Date().toISOString() + " - " + message, data || '');
        }
    }

    function sendPageView() {
        var currentPath = window.location.pathname + window.location.search;
        var now = Date.now();
        
        // Debounce: skip if same path was sent within the debounce window (in-memory check)
        if (currentPath === lastSentPath && (now - lastSentTime) < DEBOUNCE_MS) {
            log("Debounced duplicate page view (memory)", {
                path: currentPath,
                timeSinceLastSent: (now - lastSentTime) + "ms"
            });
            return;
        }
        
        // Additional debounce: check localStorage for cross-context deduplication
        // This catches cases where multiple script instances might be running
        var storedLastPV = getStoredLastPageView();
        if (storedLastPV && storedLastPV.path === currentPath && (now - storedLastPV.time) < DEBOUNCE_MS) {
            log("Debounced duplicate page view (storage)", {
                path: currentPath,
                timeSinceLastSent: (now - storedLastPV.time) + "ms"
            });
            return;
        }
        
        // Update tracking state (both in-memory and localStorage)
        lastSentPath = currentPath;
        lastSentTime = now;
        setStoredLastPageView(currentPath, now);
        try{
            var domain = window.location.hostname;
            var path = window.location.pathname + window.location.search;
            var url = window.location.href;
            var referrer = document.referrer || "";
            var title = document.title || "";

            // Warn if tracker is running on analytics domain itself
            var scriptSrc = (function(){
                var scripts = document.getElementsByTagName('script');
                for(var i = 0; i < scripts.length; i++){
                    if(scripts[i].src && scripts[i].src.indexOf('tracker.js') !== -1){
                        return scripts[i].src;
                    }
                }
                return '';
            })();
            
            if(scriptSrc) {
                try {
                    var scriptOrigin = new URL(scriptSrc).hostname;
                    // If the page domain matches the script origin, this might be the analytics dashboard itself
                    if(domain === scriptOrigin && !domain.includes('localhost')) {
                        console.warn('[Analytics Tracker] Warning: Tracker is running on the analytics dashboard domain (' + domain + '). Make sure you\'ve embedded this tracker on your actual website, not on the analytics dashboard. The domain "' + domain + '" must be registered in your dashboard for tracking to work.');
                    }
                } catch(e) {
                    // Ignore URL parsing errors
                }
            }

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

    // Track initial page load - use a flag to prevent any possibility of double-sending
    var initialPageViewSent = false;
    
    function sendInitialPageView() {
        if (initialPageViewSent) {
            log("Initial page view already sent, skipping");
            return;
        }
        initialPageViewSent = true;
        log("Sending initial page view");
        sendPageView();
    }
    
    if (document.readyState === "complete") {
        log("Document already complete");
        sendInitialPageView();
    } else {
        log("Waiting for document load event");
        window.addEventListener("load", function() {
            log("Document load event fired");
            sendInitialPageView();
        }, { once: true }); // Ensure the listener only fires once
    }

    // Track page navigations (for SPAs and browser back/forward)
    // Initialize lastPath after a short delay to ensure initial page view is processed first
    var lastPath = window.location.pathname + window.location.search;
    var navigationTrackingEnabled = false;
    
    // Delay enabling SPA navigation tracking to avoid conflicts with initial page view
    setTimeout(function() {
        navigationTrackingEnabled = true;
        // Update lastPath to current path (in case it changed during initial load)
        lastPath = window.location.pathname + window.location.search;
        log("Navigation tracking enabled", { lastPath: lastPath });
    }, 100);
    
    // Track popstate (browser back/forward)
    window.addEventListener("popstate", function() {
        if (!navigationTrackingEnabled) {
            log("Popstate ignored - navigation tracking not yet enabled");
            return;
        }
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
            if (!navigationTrackingEnabled) {
                log("pushState ignored - navigation tracking not yet enabled");
                return;
            }
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
            if (!navigationTrackingEnabled) {
                log("replaceState ignored - navigation tracking not yet enabled");
                return;
            }
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
