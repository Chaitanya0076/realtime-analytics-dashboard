(function(){
    // avoid running twice
    if(window.__RA_LOADED__) return;
    window.__RA_LOADED__ = true;

    function sendPageView() {
        try{
            var domain = window.location.hostname;
            var path = window.location.pathname + window.location.search;
            var url = window.location.href;
            var referrer = document.referrer || "";
            var title = document.title || "";

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
                    }
                }
            }catch(e){
                // localStorage might be disabled
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

            fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                keepalive: true // important for sending data during unload
            }).catch(function(err){
                // optional: debug flag via query param
                if(window.location.search.indexOf('ra_debug=1') >= 0){
                    console.debug("[ra] failed to send event", err);
                }
            });
        }catch(e){
            if(window.location.search.indexOf('ra_debug=1') >= 0){
                console.debug("[ra] error building event", e);
            }
        }
    }

    if (document.readyState === "complete") {
        sendPageView();
    } else {
        window.addEventListener("load", sendPageView);
    }

    // v2 (future): expose SPA API
    window.ra = window.ra || {};
    window.ra.trackPageView = function (pathOverride) {
        // simple v2 hook; will reuse sendPageView with override later
        // for now, no-op or you can call sendPageView with some tweaks
        sendPageView();
    };
})();

// <script src="https://analytics.yourdomain.com/tracker.js" async></script>
