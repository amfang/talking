// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload; //userPayload -- car-dashboard
  var responsePayload; //watsonPayload -- car-dashboard
  // context in car-dashboard -- put into sendRequest(text, context)
  var context;

  var messageEndpoint = '/api/message';
  //alert("Api init");
  // Publicly accessible methods defined
  return {
    //initConversation: initConversation,
    sendRequest: sendRequest,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      //alert("setResponsePayload: "+newPayloadStr);
      responsePayload = JSON.parse(newPayloadStr);
    }
  };

  // Function used for initializing the conversation with the first message from Watson -- copied from car-dashboard
  function initConversation() {
    //postConversationMessage('');
    sendRequest('', null);
  }

  // Send a message request to the server
  function sendRequest(text, contextIn) {
    // Build request payload
    var payloadToWatson = {}; // data -- car-dashboard
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    //保持api -> context, 如果调用函数添加contextIn(conversation), 那么使用, 如果没有(STT), 使用保持的
    //alert("sendRequest -- contextIn: "+contextIn+" -- context: "+context);
    if (contextIn) {
      context = contextIn;
    }
    //alert("sendRequest -- contextIn: "+contextIn+" -- context: "+context);
    if (context) {
      payloadToWatson.context = context;
    }

    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        var response = JSON.parse(http.responseText);
        context = response.context;
        //alert("postConversationMessage -- Only response context: "+JSON.stringify(context));
        Api.setResponsePayload(http.responseText);
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      //Api.setRequestPayload(payloadToWatson); //Api.setUserPayload(data); -- copid from car-dashboard
      Api.setRequestPayload(params);
    }

    // Send request
    http.send(params);
  }
}());
