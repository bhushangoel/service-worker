"use strict";

const version = 2;
var isOnline = true;
var isLoggedIn = false;

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);
self.addEventListener("message", onMessage);

main().catch(console.error);

/****************/

async function main() {
  console.log(`Service worker ${version} is starting....`);
  await sendMessage({ requestStatusUpdate: true });
}

async function sendMessage(msg) {
  // getting the correct client to send the msg to
  var allClients = await clients.matchAll({ includeUncontrolled: true });

  return Promise.all(
    allClients.map(function clientMsg(client) {
      var chan = new MessageChannel();
      chan.port1.onmessage = onMessage;
      return client.postMessage(msg, [chan.port2]);
    })
  );
}

function onMessage({ data }) {
  if (data.statusUpdate) {
    ({ isLoggedIn, isOnline } = data.statusUpdate);
    console.log(
      `SW ${version} - isLoggedIn ${isLoggedIn}, isOnline ${isOnline}`
    );
  }
}

async function onInstall(evt) {
  console.log(`Service worker ${version} is installing....`);
  // SVCWRKR
  self.skipWaiting();
}

function onActivate(evt) {
  // SVCWRKR request to browser that I am doing some stuff, don't shut down my service worker. Does not guarantee.
  evt.waitUntil(handleActivation());
}

async function handleActivation() {
  // SVCWRKR https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
  clients.claim();
  console.log(`Service worker ${version} is activating....`);
}
