/**
 * Copyright 2016-2021 The Cotonic Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

self.addEventListener('install', function(event) {
    event.waitUntil( self.skipWaiting() );
});

self.addEventListener('activate', function(event) {
    event.waitUntil( self.clients.claim() );
});

self.addEventListener('push', (event) => {
    const message = event.data.json();

    console.log(message);

    switch(message.type) {
        case "notification":
            const data = message.data;
            self.registration.showNotification(data.title, data.options);
            break;
        default:
            console.info("Service Worker: unknown push message", event);
    }
});

self.addEventListener("notificationclick", function(event) {
    console.log("on notification click", event);
    let url = new URL("/", self.origin);
    const notification = event.notification;
    if(notification.data && notification.data.url) {
        url = new URL(notification.data.url, self.origin);
    }

    // Check if there already is a tab with has this url open.
    event.waitUntil(clients.matchAll({ type: "window" })
        .then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

self.addEventListener('fetch', function(event) {
    // Firefox 88 is failing downloads for large requests over slower
    // connections if the service worker handles the fetch event.
    // Temporarily disabled the code below to fix this issue.
    //
    // if (   !event.request.headers.get('range')
    //     && !event.request.headers.get('x-no-cache')) {
    //     // fetch drops the 'range' header, which is used
    //     // with video and audio requests.
    //     event.respondWith( fetch( event.request ) );
    // }
});

self.addEventListener('message', function(event) {
    switch (event.data.type)  {
        case "broadcast":
            // Relay broadcast messages
            let message = event.data;
            message.sender_id = event.source.id;
            let promise = message_clients(message);
            if (event.waitUntil) {
                event.waitUntil(promise);
            }
            break;
        default:
            console.log("Service Worker: unknown message", event);
            break;
    }
});

// Relay a message to all clients (including the sender)
function message_clients( message ) {
    let promise = self.clients.matchAll()
        .then(function(clientList) {
            clientList.forEach(function(client) {
                client.postMessage(message);
            })
        });
    return promise;
}

