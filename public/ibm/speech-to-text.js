
/*
 * Copyright © 2016 I.B.M. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global WatsonSpeech: true, Conversation: true, Api: true Common: true*/

var STTModule = (function() {
  'use strict';
  var mic        = document.getElementById('input-mic');
  var recording  = false;
  var stream;
  var records    = 0;
  //alert("STTModule init");
  return {
    micON: micON,
    speechToText: speechToText,
    init: init
  };

  function init() {
    checkBrowsers();
  }

  function checkBrowsers() {
    // Check if browser supports speech
    if (!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia || navigator.msGetUserMedia)) {
      Common.hide(mic);
    }
  }

  function micON() { // When the microphone button is clicked
    //alert("micON clicked --- recording: "+recording);
    if (recording === false) {
      //alert("micON clicked --- records: "+records);
      var payload;
      if (records === 0) { // The first time the mic is clicked - inform user
        //alert("micON clicked --- records -- 1: "+records);
        payload = {output: {text: ['Accept the microphone prompt in your browser. Watson will listen soon.'], ref: 'STT'}}; // Dialog box output to let the user know we're recording
        records++;
      } else {
        payload = {output: {ref: 'STT'}}; // Let the user record right away
      }
      Api.setResponsePayload(JSON.stringify(payload));
    } else {
      recording = false;
      stream.stop();
      //speechToText();
    }
    //alert("micON clicked + records: "+records);
  }

  function speechToText() {
    //alert("speechToText function");
    mic.setAttribute('class', 'active-mic');  // Set CSS class of mic to indicate that we're currently listening to user input
    recording = true;                         // We'll be recording very shortly
    fetch('/api/speech-to-text/token')        // Fetch authorization token for Watson Speech-To-Text
      .then(function(response) {
        return response.text();
      })
      .then(function(token) {// Pass token to Watson Speech-To-Text service
        //alert("speechToText -- stream: "+stream+" --- token: "+token);
        stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
          token: token,                       // Authorization token to use this service, configured from /speech/stt-token.js file
          continuous: false,                  // False = automatically stop transcription the first time a pause is detected
          outputElement: '#textInput',       // CSS selector or DOM Element
          inactivity_timeout: 5,              // Number of seconds to wait before closing input stream
          format: false,                      // Inhibits errors
          keepMicrophone: true                // Avoids repeated permissions prompts in FireFox
        });
        //alert("speechToText - 1 -- stream: "+stream+" --- token: "+token);
        stream.promise()                                // Once all data has been processed...
          .then(function(data) {                        // ...put all of it into a single array
            //alert("data: "+data);
            mic.setAttribute('class', 'inactive-mic');  // Reset our microphone button to visually indicate we aren't listening to user anymore
            recording = false;                          // We aren't recording anymore
            if (data.length !== 0) {                    // If data is not empty (the user said something)
              var dialogue = data.pop();                // Get the last data variable from the data array, which will be the finalized Speech-To-Text transcript
              if ((dialogue.alternatives[0].transcript !== '') && (dialogue.final === true)) { // Another check to verify that the transcript is not empty and that this is the final dialog
                ConversationPanel.sendMessage();             // Send the message to Watson Conversation
                //alert("ConversationPanel.sendMessage();");
              }
            } else { // If there isn't any data to be handled by the conversation, display a message to the user letting them know
              var payload = {output: {text: ['Microphone input cancelled. Please press the button to speak to Watson again']}}; // If the user clicked the microphone button again to cancel current input
              Api.setResponsePayload(JSON.stringify(payload));
            }
          })
          .catch(function(err) { // Catch any errors made during the promise
            if (err !== 'Error: No speech detected for 5s.') { // This error will always occur when Speech-To-Text times out, so don't log it (but log everything else)
              console.log(err);
            }
            mic.setAttribute('class', 'inactive-mic'); // Reset our microphone button to visually indicate we aren't listening to user anymore
            var payload = {output: {text: ['Watson timed out after a few seconds of inactivity. Please press the button to speak to Watson again.']}};
            Api.setResponsePayload(JSON.stringify(payload));
          });
      })
      .catch(function(error) { // Catch any other errors and log them
        console.log(error);
      });
  }
})();

STTModule.init(); // Runs Speech to Text Module
