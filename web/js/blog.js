(function Blog() {
  "use strict";

  var offlineIcon;
  var isOnline = "onLine" in navigator ? navigator.onLine : true;
  var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || "");
  var usingSW = "serviceworker" in navigator;
  var SWregistration;
  var svcWorker;

  document.addEventListener("DOMContentLoaded", ready, false);

  initServiceWorker().catch(console.error);

  // **********************************

  function ready() {
    offlineIcon = document.getElementById("connectivity-status");

    if (!isOnline) {
      offlineIcon.classList.remove("hidden");
    }

    window.addEventListener("online", function online() {
      offlineIcon.classList.add("hidden");
      isOnline = true;
      sendStatusUpdate();
    });

    window.addEventListener("offline", function offline() {
      offlineIcon.classList.remove("hidden");
      isOnline = false;
      sendStatusUpdate(); 
    });
  }

  async function initServiceWorker() {
    // step 1 : register the service worker
    SWregistration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });

    // step 2 : check the state of service worker, there can be 3 states
    svcWorker =
      SWregistration.installing ||
      SWregistration.waiting ||
      SWregistration.active;
    sendStatusUpdate(svcWorker);

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      function onController() {
        svcWorker = navigator.serviceWorker.controller;
        sendStatusUpdate(svcWorker);
      }
    );

    // listen from SW
    navigator.serviceWorker.addEventListener("message", onSWMessage);
  }

  function onSWMessage(evt) {
    var { data } = evt;
    if (data.requestStatusUpdate) {
      console.log("Received status update request from SW");
      sendStatusUpdate(evt.ports && evt.ports[0]);
    }
  }

  function sendStatusUpdate(target) {
    sendSWMessage({ statusUpdate: { isOnline, isLoggedIn } }, target);
  }

  // send messages to SW
  function sendSWMessage(msg, target) {
    if (target) {
      // in case of shared SW, we need to send msg to the requesting page only
      target.postMessage(msg);
    } else if (svcWorker) {
      svcWorker.postMessage(msg);
    }
  }
})();
