/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require ( 'dotenv' ).config ( {silent: true} );
var express = require ( 'express' );
//var compression = require ( 'compression' );
var bodyParser = require ( 'body-parser' );  // parser for post requests
var watson = require ( 'watson-developer-cloud' );

//The conversation workspace id
var workspace_id = process.env.WORKSPACE_ID || '<workspace_id>';
//var logs = null;
console.log("workspace_id"+workspace_id);

var app = express ();

//app.use ( compression () );
app.use ( bodyParser.json () );
//static folder containing UI
app.use (express.static("./public"));

// Create the service wrapper
var conversation = watson.conversation ( {
  username: process.env.CONVERSATION_USERNAME || '<username>',
  password: process.env.CONVERSATION_PASSWORD || '<password>',
  //url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2016-10-21',
  version: 'v1'
} );

/*var conversation = new watson({
 // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
 // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
 // username: '<username>',
 // password: '<password>',
 url: 'https://gateway.watsonplatform.net/conversation/api',
 version_date: '2016-10-21',
 version: 'v1'
 });
 */
// Endpoint to be call from the client side
app.post ( '/api/message', function (req, res) {
  if ( !workspace_id || workspace_id === '<workspace-id>' ) {
    //If the workspace id is not specified notify the user
    return res.json ( {
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
        '<a href="https://github.com/watson-developer-cloud/car-dashboard">README</a> documentation on how to set this variable. <br>' +
        'Once a workspace has been defined the intents may be imported from ' +
        '<a href="https://github.com/watson-developer-cloud/car-dashboard/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    } );
  }
  var payload = {
    workspace_id: workspace_id,
    context: {}
  };
  if ( req.body ) {
    if ( req.body.input ) {
      payload.input = req.body.input;
    }
    if ( req.body.context ) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }
  // Send the input to the conversation service
  conversation.message ( payload, function (err, data) {
    if ( err ) {
      console.error ( JSON.stringify ( err ) );
      return res.status ( err.code || 500 ).json ( err );
    }
    console.log('request : payload; response: '+ data +'; time: '+new Date ());
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}


app.use ( '/api/speech-to-text/', require ( './speech/stt-token.js' ) );
app.use ( '/api/text-to-speech/', require ( './speech/tts-token.js' ) );

module.exports = app;