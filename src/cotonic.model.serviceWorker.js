/**
 * Copyright 2018 The Cotonic Authors. All Rights Reserved.
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

/* Starts the service worker and adds message relay topics */

"use strict";

var cotonic = cotonic || {};

(function(cotonic) {

    if (navigator.serviceWorker) {
        navigator.serviceWorker.register('/service-worker.js');

        navigator.serviceWorker.addEventListener('message', function(event) {
            switch (event.data.type) {
                case "broadcast":
                    let message = event.data.message;
                    message.topic = "model/serviceWorker/event";
                    cotonic.broker.publish_mqtt_message(message);
                    break;
                default:
                    break;
            }
        });
    }

    cotonic.broker.subscribe("model/serviceWorker/post/broadcast", function(msg) {
        if (navigator.serviceWorker.controller) {
            let data = {
                type: "broadcast",
                message: msg
            }
            navigator.serviceWorker.controller.postMessage(data);
        }
    });

}(cotonic));