/*
 * ExSIP version 1.5.903
 * Copyright (c) 2015 BroadSoft, Inc.
 * Homepage: http://www.broadsoft.com
 * Fork of JsSIP 0.3.7
 * Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com>
 * License: MIT
 */


/*global console: false*/

/**
 * @name ExSIP
 * @namespace
 */
(function(window) {

var ExSIP = (function() {
  "use strict";

  var ExSIP = {};

  Object.defineProperties(ExSIP, {
    version: {
      get: function(){ return '1.5.903'; }
    },
    name: {
      get: function(){ return 'ExSIP'; }
    }
  });

  return ExSIP;
}());



/**
 * @fileoverview Message
 */

/**
 * @augments ExSIP
 * @class Class creating SIP MESSAGE request.
 * @param {ExSIP.UA} ua
 */
(function(ExSIP) {
var Logger;

  function DateFmt(fstr) {
    this.formatString = fstr;

    var mthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    var zeroPad = function(number) {
      return ("0"+number).substr(-2,2);
    };

    var dateMarkers = {
      d:['getDate',function(v) { return zeroPad(v);}],
      m:['getMonth',function(v) { return zeroPad(v+1);}],
      n:['getMonth',function(v) { return mthNames[v]; }],
      w:['getDay',function(v) { return dayNames[v]; }],
      y:['getFullYear'],
      H:['getHours',function(v) { return zeroPad(v);}],
      M:['getMinutes',function(v) { return zeroPad(v);}],
      S:['getSeconds',function(v) { return zeroPad(v);}],
      i:['toISOString']
    };

    this.format = function(date) {
      var dateTxt = this.formatString.replace(/%(.)/g, function(m, p) {
        var dateMarker = dateMarkers[p];
        var method = dateMarker[0];
        var rv = date[method]();

        if ( dateMarker[1] != null ) {
          rv = dateMarker[1](rv);
        }

        return rv;

      });

      return dateTxt;
    };

  }

  Logger = function(prefix) {
    this.prefix = prefix;
    this.fmt = new DateFmt("%m%d/%H%M%S");
  };


  Logger.prototype = {
    log: function(msg, ua) {
      if(!ua || ua.isDebug()) {
        console.log(this.formatMsg(msg));
      }
    },
    debug: function(msg, ua) {
      if(!ua || ua.isDebug()) {
        console.debug(this.formatMsg(msg));
      }
    },
    error: function(msg) {
      console.error(this.formatMsg(msg));
    },
    warn: function(msg, ua) {
      if(!ua || ua.isDebug()) {
        console.warn(this.formatMsg(msg));
        console.trace();
      }
    },
    formatMsg: function(msg) {
      return this.getTime()+' : '+this.prefix+' : '+msg;
    },
    getTime: function() {
      return this.getTimeFor(new Date());
    },
    getTimeFor: function(date) {
      return this.fmt.format(date);
    }
  };

ExSIP.Logger = Logger;
}(ExSIP));



/**
 * @fileoverview EventEmitter
 */

/**
 * @augments ExSIP
 * @class Class creating an event emitter.
 */
(function(ExSIP) {
var
  EventEmitter,
  Event,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'EVENT EMITTER');

EventEmitter = function(){};
EventEmitter.prototype = {
  /**
   * Initialize events dictionary.
   * @param {Array} events
   */
  initEvents: function(events) {
    var i = events.length, self = this;

    this.events = {};
    this.onceNotFired = []; // Array containing events with _once_ defined tat didn't fire yet.
    this.maxListeners = 10;
    this.events.newListener = function(event) { // Default newListener callback
      if (self.isDebug()) {
        logger.log('new listener added to event '+ event);
      }
    };

    while (i--) {
      if (this.isDebug()) {
        logger.log('adding event '+ events[i]);
      }
      this.events[events[i]] = [];
    }
  },

  /**
  * Check whether an event exists or not.
  * @param {String} event
  * @returns {Boolean}
  */
  checkEvent: function(event) {
    if (!this.events[event]) {
      logger.error('no event named '+ event);
      return false;
    } else {
      return true;
    }
  },

  /**
  * Add a listener to the end of the listeners array for the specified event.
  * @param {String} event
  * @param {Function} listener
  */
  addListener: function(event, listener) {
    if (!this.checkEvent(event)) {
      return;
    }

    if (this.events[event].length >= this.maxListeners) {
      if (this.isDebug()) {
        logger.warn('max listeners exceeded for event '+ event);
      }
    }

    this.events[event].push(listener);
    this.events.newListener.call(null, event);
  },

  on: function(event, listener) {
    this.addListener(event, listener);
  },

  /**
  * Add a one time listener for the event.
  * The listener is invoked only the first time the event is fired, after which it is removed.
  * @param {String} event
  * @param {Function} listener
  */
  once: function(event, listener) {
    this.events[event].unshift(listener);
    this.onceNotFired.push(event);
  },

  /**
  * Remove a listener from the listener array for the specified event.
  * Caution: changes array indices in the listener array behind the listener.
  * @param {String} event
  * @param {Function} listener
  */
  removeListener: function(event, listener) {
    if (!this.checkEvent(event)) {
      return;
    }

    var array = this.events[event], i = 0, length = array.length;

    while ( i < length ) {
      if (array[i] && array[i].toString() === listener.toString()) {
        array.splice(i, 1);
      } else {
        i++;
      }
    }
  },

  /**
  * Remove all listeners from the listener array for the specified event.
  * @param {String} event
  */
  removeAllListener: function(event) {
    if (!this.checkEvent(event)) {
      return;
    }

    this.events[event] = [];
  },

  /**
  * By default EventEmitter will print a warning
  * if more than 10 listeners are added for a particular event.
  * This function allows that limit to be modified.
  * @param {Number} listeners
  */
  setMaxListeners: function(listeners) {
    if (Number(listeners)) {
      this.maxListeners = listeners;
    }
  },

  /**
  * Get the listeners for a specific event.
  * @param {String} event
  * @returns {Array}  Array of listeners for the specified event.
  */
  listeners: function(event) {
    return this.events[event];
  },

  /**
  * Execute each of the listeners in order with the supplied arguments.
  * @param {String} events
  * @param {Array} args
  */
  emit: function(event, sender, data) {
    var listeners, length,
      idx=0;

    if (!this.checkEvent(event)) {
      return;
    }

    if (this.isDebug()) {
      logger.log('emitting event '+event);
    }

    listeners = this.events[event];
    length = listeners.length;

    var e = new ExSIP.Event(event, sender, data);

    if (e) {
      for (idx; idx<length; idx++) {
        listeners[idx].apply(null, [e]);
      }
    } else {
      for (idx; idx<length; idx++) {
        listeners[idx].call();
      }
    }

    // Check whether _once_ was defined for the event
    idx = this.onceNotFired.indexOf(event);

    if (idx !== -1) {
      this.onceNotFired.splice(idx,1);
      this.events[event].shift();
    }
  },

  /**
  * This function is executed anytime a new listener is added to EventEmitter instance.
  * @param {Function} listener
  */
  newListener: function(listener) {
    this.events.newListener = listener;
  }
};

Event = function(type, sender, data) {
  this.type = type;
  this.sender= sender;
  this.data = data;
};

ExSIP.EventEmitter = EventEmitter;
ExSIP.Event = Event;
}(ExSIP));



/**
 * @fileoverview ExSIP Constants
 */

/**
 * ExSIP Constants.
 * @augments ExSIP
 */

ExSIP.C= {
  USER_AGENT: 'BroadSoft WebRTC Client - '+ ExSIP.version,

  // SIP scheme
  SIP: 'sip',

  // Invalid target
  INVALID_TARGET_URI: 'sip:invalid@invalid',

  // End and Failure causes
  causes: {
    // Generic error causes
    CONNECTION_ERROR:         'Connection Error',
    REQUEST_TIMEOUT:          'Request Timeout',
    SIP_FAILURE_CODE:         'SIP Failure Code',
    INVALID_TARGET:           'Invalid Target',
    INTERNAL_ERROR:           'Internal Error',

    // SIP error causes
    BUSY:                     'Busy',
    REJECTED:                 'Rejected',
    REDIRECTED:               'Redirected',
    UNAVAILABLE:              'Unavailable',
    NOT_FOUND:                'Not Found',
    ADDRESS_INCOMPLETE:       'Address Incomplete',
    INCOMPATIBLE_SDP:         'Incompatible SDP',
    AUTHENTICATION_ERROR:     'Authentication Error',
    DIALOG_ERROR:             'Dialog Error',

    // Session error causes
    WEBRTC_NOT_SUPPORTED:     'WebRTC Not Supported',
    WEBRTC_ERROR:             'WebRTC Error',
    CANCELED:                 'Canceled',
    NO_ANSWER:                'No Answer',
    EXPIRES:                  'Expires',
    NO_ACK:                   'No ACK',
    USER_DENIED_MEDIA_ACCESS: 'User Denied Media Access',
    BAD_MEDIA_DESCRIPTION:    'Bad Media Description',
    RTP_TIMEOUT:              'RTP Timeout',
    NOT_ACCEPTABLE_ERROR:     'Not Acceptable'
  },

  SIP_ERROR_CAUSES: {
    REDIRECTED: [300,301,302,305,380],
    BUSY: [486,600],
    REJECTED: [403,603],
    NOT_FOUND: [404,604],
    UNAVAILABLE: [480,410,408,430],
    ADDRESS_INCOMPLETE: [484],
    INCOMPATIBLE_SDP: [488],
    AUTHENTICATION_ERROR:[401,407],
    NOT_ACCEPTABLE_ERROR:[606]
  },

  // SIP Methods
  ACK:        'ACK',
  BYE:        'BYE',
  CANCEL:     'CANCEL',
  INFO:       'INFO',
  INVITE:     'INVITE',
  REFER:      'REFER',
  MESSAGE:    'MESSAGE',
  NOTIFY:     'NOTIFY',
  OPTIONS:    'OPTIONS',
  REGISTER:   'REGISTER',
  UPDATE:     'UPDATE',
  SUBSCRIBE:  'SUBSCRIBE',

  // MODES
  SENDONLY:  'sendonly',
  RECVONLY:  'recvonly',
  SENDRECV:  'sendrecv',
  INACTIVE:  'inactive',

  /* SIP Response Reasons
   * DOC: http://www.iana.org/assignments/sip-parameters
   * Copied from https://github.com/versatica/OverSIP/blob/master/lib/oversip/sip/constants.rb#L7
   */
  REASON_PHRASE: {
    100: 'Trying',
    180: 'Ringing',
    181: 'Call Is Being Forwarded',
    182: 'Queued',
    183: 'Session Progress',
    199: 'Early Dialog Terminated',  // draft-ietf-sipcore-199
    200: 'OK',
    202: 'Accepted',  // RFC 3265
    204: 'No Notification',  //RFC 5839
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Moved Temporarily',
    305: 'Use Proxy',
    380: 'Alternative Service',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    410: 'Gone',
    412: 'Conditional Request Failed',  // RFC 3903
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Unsupported URI Scheme',
    417: 'Unknown Resource-Priority',  // RFC 4412
    420: 'Bad Extension',
    421: 'Extension Required',
    422: 'Session Interval Too Small',  // RFC 4028
    423: 'Interval Too Brief',
    428: 'Use Identity Header',  // RFC 4474
    429: 'Provide Referrer Identity',  // RFC 3892
    430: 'Flow Failed',  // RFC 5626
    433: 'Anonymity Disallowed',  // RFC 5079
    436: 'Bad Identity-Info',  // RFC 4474
    437: 'Unsupported Certificate',  // RFC 4744
    438: 'Invalid Identity Header',  // RFC 4744
    439: 'First Hop Lacks Outbound Support',  // RFC 5626
    440: 'Max-Breadth Exceeded',  // RFC 5393
    469: 'Bad Info Package',  // draft-ietf-sipcore-info-events
    470: 'Consent Needed',  // RFC 5360
    478: 'Unresolvable Destination',  // Custom code copied from Kamailio.
    480: 'Temporarily Unavailable',
    481: 'Call/Transaction Does Not Exist',
    482: 'Loop Detected',
    483: 'Too Many Hops',
    484: 'Address Incomplete',
    485: 'Ambiguous',
    486: 'Busy Here',
    487: 'Request Terminated',
    488: 'Not Acceptable Here',
    489: 'Bad Event',  // RFC 3265
    491: 'Request Pending',
    493: 'Undecipherable',
    494: 'Security Agreement Required',  // RFC 3329
    500: 'Server Internal Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Server Time-out',
    505: 'Version Not Supported',
    513: 'Message Too Large',
    580: 'Precondition Failure',  // RFC 3312
    600: 'Busy Everywhere',
    603: 'Decline',
    604: 'Does Not Exist Anywhere',
    606: 'Not Acceptable'
  }
};



/**
 * @fileoverview Exceptions
 */

/**
 * ExSIP Exceptions.
 * @augments ExSIP
 */
(function(ExSIP) {
var Exceptions;

Exceptions= {
  ConfigurationError: (function(){
    var exception = function(parameter, value) {
      this.code = 1;
      this.name = 'CONFIGURATION_ERROR';
      this.parameter = parameter;
      this.value = value;
      this.message = (!this.value)? 'Missing parameter: '+ this.parameter : 'Invalid value '+ window.JSON.stringify(this.value) +' for parameter "'+ this.parameter +'"';
    };
    exception.prototype = new Error();
    return exception;
  }()),

  InvalidTargetError: (function(){
    var exception = function(target) {
      this.code = 2;
      this.name = 'INVALID_TARGET_ERROR';
      this.target = target;
      this.message = 'Invalid target: ' + this.target;
    };
    exception.prototype = new Error();
    return exception;
  }()),

  InvalidStateError: (function(){
    var exception = function(status) {
      this.code = 3;
      this.name = 'INVALID_STATE_ERROR';
      this.status = status;
    };
    exception.prototype = new Error();
    return exception;
  }())
};

ExSIP.Exceptions = Exceptions;
}(ExSIP));


/**
 * @fileoverview SIP TIMERS
 */

/**
 * @augments ExSIP
 */
(function(ExSIP) {
var Timers,
  T1 = 500,
  T2 = 4000,
  T4 = 5000;

Timers = {
  T1: T1,
  T2: T2,
  T4: T4,
  TIMER_B: 64 * T1,
  TIMER_D: 0  * T1,
  TIMER_F: 64 * T1,
  TIMER_H: 64 * T1,
  TIMER_I: 0  * T1,
  TIMER_J: 0  * T1,
  TIMER_K: 0  * T4,
  TIMER_L: 64 * T1,
  TIMER_M: 64 * T1,
  PROVISIONAL_RESPONSE_INTERVAL: 60000  // See RFC 3261 Section 13.3.1.1
};

ExSIP.Timers = Timers;
}(ExSIP));



/**
 * @fileoverview Transport
 */

/**
 * @augments ExSIP
 * @class Transport
 * @param {ExSIP.UA} ua
 * @param {Object} server ws_server Object
 */
(function(ExSIP) {
var Transport,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'TRANSPORT'),
  C = {
    // Transport status codes
    STATUS_READY:        0,
    STATUS_DISCONNECTED: 1,
    STATUS_ERROR:        2
  };

Transport = function(ua, server) {
  this.ua = ua;
  this.ws = null;
  this.server = server;
  this.reconnection_attempts = 0;
  this.closed = false;
  this.connected = false;
  this.reconnectTimer = null;
  this.lastTransportError = {};

  this.ua.transport = this;

  // Connect
  this.connect();
};

Transport.prototype = {
  /**
   * Send a message.
   * @param {ExSIP.OutgoingRequest|String} msg
   * @returns {Boolean}
   */
  send: function(msg) {
    var message = msg.toString();

    if(this.ws && this.readyState() === WebSocket.OPEN) {
      logger.debug('sending WebSocket message:\n\n' + message + '\n', this.ua);
      this.ws.send(message);
      return true;
    } else {
      logger.warn('unable to send message, WebSocket is not open', this.ua);
      return false;
    }
  },

  readyState: function() {
    return this.ws.readyState;
  },

  /**
  * Disconnect socket.
  */
  disconnect: function() {
    if(this.ws) {
      this.closed = true;
      logger.log('closing WebSocket ' + this.server.ws_uri, this.ua);
      this.ws.close();
    }
  },

  /**
  * Connect socket.
  */
  connect: function() {
    var transport = this;

    if(this.ws && (this.readyState() === WebSocket.OPEN || this.readyState() === WebSocket.CONNECTING)) {
      logger.log('WebSocket ' + this.server.ws_uri + ' is already connected', this.ua);
      return false;
    }

    if(this.ws) {
      this.ws.close();
    }

    logger.log('connecting to WebSocket ' + this.server.ws_uri, this.ua);

    try {
      this.ws = new WebSocket(this.server.ws_uri, 'sip');
      this.ua.usedServers.push(this.server);
    } catch(e) {
      logger.warn('error connecting to WebSocket ' + this.server.ws_uri + ': ' + e, this.ua);
    }

    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = function() {
      transport.onOpen();
    };

    this.ws.onclose = function(e) {
      transport.onClose(e);
      this.onopen = null;
      this.onclose = null;
      this.onmessage = null;
      this.onerror = null;
    };

    this.ws.onmessage = function(e) {
      transport.onMessage(e);
    };

    this.ws.onerror = function(e) {
      transport.onError(e);
    };
  },

  // Transport Event Handlers

  /**
  * @event
  * @param {event} e
  */
  onOpen: function() {
    this.connected = true;

    logger.log('WebSocket ' + this.server.ws_uri + ' connected', this.ua);
    // Clear reconnectTimer since we are not disconnected
    window.clearTimeout(this.reconnectTimer);
    // Disable closed
    this.closed = false;
    // Trigger onTransportConnected callback
    this.ua.onTransportConnected(this);
  },

  /**
  * @event
  * @param {event} e
  */
  onClose: function(e) {
    var connected_before = this.connected;

    this.connected = false;
    this.lastTransportError.code = e.code;
    this.lastTransportError.reason = e.reason;
    logger.log('WebSocket disconnected (code: ' + e.code + (e.reason? '| reason: ' + e.reason : '') +')', this.ua);

    if(e.wasClean === false) {
      logger.warn('WebSocket abrupt disconnection', this.ua);
    }
    // Transport was connected
    if(connected_before === true) {
      this.ua.onTransportClosed(this);
      // Check whether the user requested to close.
      if(!this.closed) {
        // Reset reconnection_attempts
        this.reconnection_attempts = 0;
        this.reConnect();
      } else {
        this.ua.emit('disconnected', this.ua, {
          transport: this,
          code: this.lastTransportError.code,
          reason: this.lastTransportError.reason
        });
      }
    } else {
      // This is the first connection attempt
      //Network error
      this.ua.onTransportError(this);
    }
  },

  /**
  * @event
  * @param {event} e
  */
  onMessage: function(e) {
    var message, transaction,
      data = e.data;

    // CRLF Keep Alive response from server. Ignore it.
    if(data === '\r\n') {
      logger.debug('received WebSocket message with CRLF Keep Alive response', this.ua);
      return;
    }

    // WebSocket binary message.
    else if (typeof data !== 'string') {
      try {
        data = String.fromCharCode.apply(null, new Uint8Array(data));
      } catch(evt) {
        logger.warn('received WebSocket binary message failed to be converted into string, message discarded', this.ua);
        return;
      }

      logger.debug('received WebSocket binary message:\n\n' + data + '\n', this.ua);
    }

    // WebSocket text message.
    else {
      logger.debug('received WebSocket text message:\n\n' + data + '\n', this.ua);
    }

    message = ExSIP.Parser.parseMessage(this.ua, data);

    if(this.ua.status === ExSIP.UA.C.STATUS_USER_CLOSED && message instanceof ExSIP.IncomingRequest) {
      logger.debug('UA status is closed - not handling message\n', this.ua);
      return;
    }

    // Do some sanity check
    if(message && ExSIP.sanityCheck(message, this.ua, this)) {
      if(message instanceof ExSIP.IncomingRequest) {
        message.transport = this;
        this.ua.receiveRequest(message);
      } else if(message instanceof ExSIP.IncomingResponse) {
        /* Unike stated in 18.1.2, if a response does not match
        * any transaction, it is discarded here and no passed to the core
        * in order to be discarded there.
        */
        switch(message.method) {
          case ExSIP.C.INVITE:
            transaction = this.ua.transactions.ict[message.via_branch];
            if(transaction) {
              transaction.receiveResponse(message);
            } else {
              logger.warn("no ict transaction found for "+message.via_branch+" in "+ExSIP.Utils.toString(this.ua.transactions.ict), this.ua);
            }
            break;
          case ExSIP.C.ACK:
            // Just in case ;-)
            break;
          default:
            transaction = this.ua.transactions.nict[message.via_branch];
            if(transaction) {
              transaction.receiveResponse(message);
            }
            break;
        }
      } else {
        logger.debug('Message is not request nor response\n', this.ua);
      }
    } else {
      if(message) {
          logger.debug('Sanity check failed\n', this.ua);
      } else {
          logger.debug('Not a message\n', this.ua);
      }
    }
  },

  /**
  * @event
  * @param {event} e
  */
  onError: function(e) {
    logger.warn('WebSocket connection error: ' + JSON.stringify(e), this.ua);
  },

  /**
  * Reconnection attempt logic.
  * @private
  */
  reConnect: function() {
    var transport = this;

    this.reconnection_attempts += 1;

    if(this.reconnection_attempts > this.ua.configuration.ws_server_max_reconnection) {
      logger.warn('maximum reconnection attempts for WebSocket ' + this.server.ws_uri, this.ua);
      this.ua.onTransportError(this);
    } else {
      logger.log('trying to reconnect to WebSocket ' + this.server.ws_uri + ' (reconnection attempt ' + this.reconnection_attempts + ')', this.ua);

      if(this.ua.configuration.ws_server_reconnection_timeout === 0) {
        transport.connect();
      } else {
        this.reconnectTimer = window.setTimeout(function() {
          transport.connect();}, this.ua.configuration.ws_server_reconnection_timeout * 1000);
      }
    }
  }
};

Transport.C = C;
ExSIP.Transport = Transport;
}(ExSIP));



/**
 * @fileoverview SIP Message Parser
 */

/**
 * Extract and parse every header of a SIP message.
 * @augments ExSIP
 * @namespace
 */
(function(ExSIP) {
var Parser,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'PARSER');

function getHeader(data, headerStart) {
  var
    // 'start' position of the header.
    start = headerStart,
    // 'end' position of the header.
    end = 0,
    // 'partial end' position of the header.
    partialEnd = 0;

  //End of message.
  if (data.substring(start, start + 2).match(/(^\r\n)/)) {
    return -2;
  }

  while(end === 0) {
    // Partial End of Header.
    partialEnd = data.indexOf('\r\n', start);

    // 'indexOf' returns -1 if the value to be found never occurs.
    if (partialEnd === -1) {
      return partialEnd;
    }

    if(!data.substring(partialEnd + 2, partialEnd + 4).match(/(^\r\n)/) && data.charAt(partialEnd + 2).match(/(^\s+)/)) {
      // Not the end of the message. Continue from the next position.
      start = partialEnd + 2;
    } else {
      end = partialEnd;
    }
  }

  return end;
}

function parseHeader(message, data, headerStart, headerEnd) {
  var header, idx, length, parsed,
    hcolonIndex = data.indexOf(':', headerStart),
    headerName = data.substring(headerStart, hcolonIndex).trim(),
    headerValue = data.substring(hcolonIndex + 1, headerEnd).trim();

  // If header-field is well-known, parse it.
  switch(headerName.toLowerCase()) {
    case 'via':
    case 'v':
      message.addHeader('via', headerValue);
      if(message.countHeader('via') === 1) {
        parsed = message.parseHeader('Via');
        if(parsed) {
          message.via = parsed;
          message.via_branch = parsed.branch;
        }
      } else {
        parsed = 0;
      }
      break;
    case 'from':
    case 'f':
      message.setHeader('from', headerValue);
      parsed = message.parseHeader('from');
      if(parsed) {
        message.from = parsed;
        message.from_tag = parsed.getParam('tag');
      }
      break;
    case 'to':
    case 't':
      message.setHeader('to', headerValue);
      parsed = message.parseHeader('to');
      if(parsed) {
        message.to = parsed;
        message.to_tag = parsed.getParam('tag');
      }
      break;
    case 'record-route':
      parsed = ExSIP.Grammar.parse(headerValue, 'Record_Route');

      if (parsed === -1) {
        parsed = undefined;
      }

      length = parsed.length;
      for (idx = 0; idx < length; idx++) {
        header = parsed[idx];
        message.addHeader('record-route', headerValue.substring(header.possition, header.offset));
        message.headers['Record-Route'][message.countHeader('record-route')-1].parsed = header.parsed;
      }
      break;
    case 'call-id':
    case 'i':
      message.setHeader('call-id', headerValue);
      parsed = message.parseHeader('call-id');
      if(parsed) {
        message.call_id = headerValue;
      }
      break;
    case 'contact':
    case 'm':
      parsed = ExSIP.Grammar.parse(headerValue, 'Contact');

      if (parsed === -1) {
        parsed = undefined;
      }

      length = parsed.length;
      for (idx = 0; idx < length; idx++) {
        header = parsed[idx];
        message.addHeader('contact', headerValue.substring(header.possition, header.offset));
        message.headers['Contact'][message.countHeader('contact')-1].parsed = header.parsed;
      }
      break;
    case 'content-length':
    case 'l':
      message.setHeader('content-length', headerValue);
      parsed = message.parseHeader('content-length');
      break;
    case 'content-type':
    case 'c':
      message.setHeader('content-type', headerValue);
      parsed = message.parseHeader('content-type');
      break;
    case 'cseq':
      message.setHeader('cseq', headerValue);
      parsed = message.parseHeader('cseq');
      if(parsed) {
        message.cseq = parsed.value;
      }
      if(message instanceof ExSIP.IncomingResponse) {
        message.method = parsed.method;
      }
      break;
    case 'max-forwards':
      message.setHeader('max-forwards', headerValue);
      parsed = message.parseHeader('max-forwards');
      break;
    case 'www-authenticate':
      message.setHeader('www-authenticate', headerValue);
      parsed = message.parseHeader('www-authenticate');
      break;
    case 'proxy-authenticate':
      message.setHeader('proxy-authenticate', headerValue);
      parsed = message.parseHeader('proxy-authenticate');
      break;
    default:
      // Do not parse this header.
      message.setHeader(headerName, headerValue);
      parsed = 0;
  }

  if (parsed === undefined) {
    return false;
  } else {
    return true;
  }
}

/** Parse SIP Message
 * @function
 * @param {String} message SIP message.
 * @returns {ExSIP.IncomingRequest|ExSIP.IncomingResponse|undefined}
 */
Parser = {};
Parser.parseMessage = function(ua, data) {
  var message, firstLine, contentLength, bodyStart, parsed,
    headerStart = 0,
    headerEnd = data.indexOf('\r\n');

  if(headerEnd === -1) {
    logger.warn('no CRLF found, not a SIP message, discarded', ua);
    return;
  }

  // Parse first line. Check if it is a Request or a Reply.
  firstLine = data.substring(0, headerEnd);
  parsed = ExSIP.Grammar.parse(firstLine, 'Request_Response');

  if(parsed === -1) {
    logger.warn('error parsing first line of SIP message: "' + firstLine + '"', ua);
    return;
  } else if(!parsed.status_code) {
    message = new ExSIP.IncomingRequest(ua);
    message.method = parsed.method;
    message.ruri = parsed.uri;
  } else {
    message = new ExSIP.IncomingResponse();
    message.status_code = parsed.status_code;
    message.reason_phrase = parsed.reason_phrase;
  }

  message.data = data;
  headerStart = headerEnd + 2;

  /* Loop over every line in data. Detect the end of each header and parse
  * it or simply add to the headers collection.
  */
  while(true) {
    headerEnd = getHeader(data, headerStart);

    // The SIP message has normally finished.
    if(headerEnd === -2) {
      bodyStart = headerStart + 2;
      break;
    }
    // data.indexOf returned -1 due to a malformed message.
    else if(headerEnd === -1) {
      logger.warn('malformed message at : '+headerStart, ua);
      return;
    }

    parsed = parseHeader(message, data, headerStart, headerEnd);

    if(!parsed) {
      return;
    }

    headerStart = headerEnd + 2;
  }

  /* RFC3261 18.3.
   * If there are additional bytes in the transport packet
   * beyond the end of the body, they MUST be discarded.
   */
  if(message.hasHeader('content-length')) {
    contentLength = message.getHeader('content-length');
    message.body = data.substr(bodyStart, contentLength);
  } else {
    message.body = data.substring(bodyStart);
  }

  return message;
};

ExSIP.Parser = Parser;
}(ExSIP));



/**
 * @fileoverview SIP Message
 */

(function(ExSIP) {
var
  SIPMessage,
  OutgoingRequest,
  IncomingMessage,
  IncomingRequest,
  IncomingResponse,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'SIP MESSAGE');

/**
 * @augments SIPMessage
 * @class Class for SIP messages.
 */
SIPMessage = function() {
  this.headers = {};
};

SIPMessage.prototype = {
  /**
   * Get the value of the given header name at the given position.
   * @param {String} name header name
   * @param {Number} [idx=0] header index
   * @returns {String|undefined} Returns the specified header, null if header doesn't exist.
   */
  getHeader: function(name, idx) {
    var header = this.headers[ExSIP.Utils.headerize(name)];

    idx = idx || 0;

    if(header) {
      if(header[idx]) {
        return header[idx].raw;
      }
    } else {
      return;
    }
  },

  /**
   * Get the header/s of the given name.
   * @param {String} name header name
   * @returns {Array} Array with all the headers of the specified name.
   */
  getHeaderAll: function(name) {
    var idx, length,
      header = this.headers[ExSIP.Utils.headerize(name)],
      result = [];

    if(!header) {
      return [];
    }

    length = header.length;
    for (idx = 0; idx < length; idx++) {
      result.push(header[idx].raw);
    }

    return result;
  },

  /**
   * Verify the existence of the given header.
   * @param {String} name header name
   * @returns {boolean} true if header with given name exists, false otherwise
   */
  hasHeader: function(name) {
    return(this.headers[ExSIP.Utils.headerize(name)]) ? true : false;
  },

  /**
   * Insert a header of the given name and value into the last position of the
   * header array.
   * @param {String} name header name
   * @param {String} value header value
   */
  addHeader: function(name, value) {
    var header = { raw: value };

    name = ExSIP.Utils.headerize(name);

    if(this.headers[name]) {
      this.headers[name].push(header);
    } else {
      this.headers[name] = [header];
    }
  },

  /**
   * Count the number of headers of the given header name.
   * @param {String} name header name
   * @returns {Number} Number of headers with the given name
   */
  countHeader: function(name) {
    var header = this.headers[ExSIP.Utils.headerize(name)];

    if(header) {
      return header.length;
    } else {
      return 0;
    }
  },

  /**
   * Parse the given header on the given index.
   * @param {String} name header name
   * @param {Number} [idx=0] header index
   * @returns {Object|undefined} Parsed header object, undefined if the header is not present or in case of a parsing error.
   */
  parseHeader: function(name, idx) {
    var header, value, parsed;

    name = ExSIP.Utils.headerize(name);

    idx = idx || 0;

    if(!this.headers[name]) {
      logger.log('header "' + name + '" not present', this.ua);
      return;
    } else if(idx >= this.headers[name].length) {
      logger.log('not so many "' + name + '" headers present', this.ua);
      return;
    }

    header = this.headers[name][idx];
    value = header.raw;

    if(header.parsed) {
      return header.parsed;
    }

    //substitute '-' by '_' for grammar rule matching.
    parsed = ExSIP.Grammar.parse(value, name.replace(/-/g, '_'));

    if(parsed === -1) {
      this.headers[name].splice(idx, 1); //delete from headers
      logger.warn('error parsing "' + name + '" header field with value "' + value + '"', this.ua);
      return;
    } else {
      header.parsed = parsed;
      return parsed;
    }
  },

  /**
   * Message Header attribute selector. Alias of parseHeader.
   * @param {String} name header name
   * @param {Number} [idx=0] header index
   * @returns {Object|undefined} Parsed header object, undefined if the header is not present or in case of a parsing error.
   *
   * @example
   * message.s('via',3).port
   */
  s: function(name, idx) {
    return this.parseHeader(name, idx);
  },

  /**
   * Replace the value of the given header by the value.
   * @param {String} name header name
   * @param {String} value header value
   */
  setHeader: function(name, value) {
    var header = { raw: value };
    this.headers[ExSIP.Utils.headerize(name)] = [header];
  }
};

  /**
 * @augments ExSIP
 * @class Class for outgoing SIP request.
 * @param {String} method request method
 * @param {String} ruri request uri
 * @param {ExSIP.UA} ua
 * @param {Object} params parameters that will have priority over ua.configuration parameters:
 * <br>
 *  - cseq, call_id, from_tag, from_uri, from_display_name, to_uri, to_tag, route_set
 * @param {Object} [headers] extra headers
 * @param {String} [body]
 */
OutgoingRequest = function(method, ruri, ua, params, extraHeaders, body) {
  SIPMessage.call(this);
  var
    to,
    from, fromName, fromTag,
    call_id,
    cseq;

  params = params || {};

  // Mandatory parameters check
  if(!method || !ruri || !ua) {
    return null;
  }

  this.ua = ua;
  this.method = method;
  this.ruri = ruri;
  this.body = body;
  this.extraHeaders = extraHeaders || [];

  // Fill the Common SIP Request Headers

  // Route
  if (params.route_set && params.route_set.toString() !== "") {
    this.setHeader('route', params.route_set);
  } else if (ua.configuration.use_preloaded_route){
    this.setHeader('route', ua.transport.server.sip_uri);
  }

  // Via
  // Empty Via header. Will be filled by the client transaction.
  this.setHeader('via', '');

  // Max-Forwards
  this.setHeader('max-forwards', ExSIP.UA.C.MAX_FORWARDS);

  // To
  to = (params.to_display_name || params.to_display_name === 0) ? '"' + params.to_display_name + '" ' : '';
  var toUri = (params.to_uri || ruri);
  to += '<' + (ua.configuration.enable_ims && toUri.isPhoneNumber() && toUri.toString().indexOf(';user=phone') === -1 ? toUri +";user=phone" : toUri) + '>';
  to += params.to_tag ? ';tag=' + params.to_tag : '';
  this.to = new ExSIP.NameAddrHeader.parse(to);
  this.setHeader('to', to);

  // From
  if (params.from_display_name || params.from_display_name === 0) {
    fromName = '"' + params.from_display_name + '" ';
  } else if (ua.configuration.display_name) {
    fromName = '"' + ua.configuration.display_name + '" ';
  } else {
    fromName = '';
  }
  var fromUri = (params.from_uri || ua.configuration.uri);
  fromName += '<' + (ua.configuration.enable_ims && fromUri.isPhoneNumber() && fromUri.toString().indexOf(';user=phone') === -1 ? fromUri +";user=phone" : fromUri) + '>';
  fromTag = ';tag=' + (params.from_tag || ExSIP.Utils.newTag());
  from = fromName + fromTag;
  this.from = new ExSIP.NameAddrHeader.parse(from);
  this.setHeader('from', from);

  // Call-ID
  call_id = params.call_id || (ua.configuration.exsip_id + ExSIP.Utils.createRandomToken(15));
  this.call_id = call_id;
  this.setHeader('call-id', call_id);

  // CSeq
  cseq = params.cseq || Math.floor(Math.random() * 10000);
  this.cseq = cseq;
  this.setHeader('cseq', cseq + ' ' + method);

  // P-Asserted-Identity
  if(ua.configuration.enable_ims) {
    this.setHeader('P-Asserted-Identity', fromName);
  } else if(ua.configuration.p_asserted_identity) {
    this.setHeader('P-Asserted-Identity', ua.configuration.p_asserted_identity);
  }
};

OutgoingRequest.prototype = new SIPMessage();

OutgoingRequest.prototype.toString = function() {
  var msg = '', header, length, idx;

  msg += this.method + ' ' + (this.ua.configuration.enable_ims && this.ruri.isPhoneNumber() ? this.ruri + ";user=phone" : this.ruri) + ' SIP/2.0\r\n';

  for (header in this.headers) {
    length = this.headers[header].length;
    for (idx = 0; idx < length; idx++) {
      msg += header + ': ' + this.headers[header][idx].raw + '\r\n';
    }
  }

  length = this.extraHeaders.length;
  for (idx = 0; idx < length; idx++) {
    msg += this.extraHeaders[idx] +'\r\n';
  }

  msg += 'Supported: ' +  ExSIP.UA.C.SUPPORTED +'\r\n';
  msg += 'User-Agent: ' + ExSIP.C.USER_AGENT +'\r\n';

  if(this.body) {
    length = ExSIP.Utils.str_utf8_length(this.body);
    msg += 'Content-Length: ' + length + '\r\n\r\n';
    msg += this.body;
  } else {
    msg += 'Content-Length: 0\r\n\r\n';
  }

  return msg;
};


  /**
 * @augments ExSIP
 * @class Class for incoming SIP message.
 */
IncomingMessage = function(){
  SIPMessage.call(this);
  this.data = null;
  this.method =  null;
  this.via = null;
  this.via_branch = null;
  this.call_id = null;
  this.cseq = null;
  this.from = null;
  this.from_tag = null;
  this.to = null;
  this.to_tag = null;
  this.body = null;
};

IncomingMessage.prototype.toString = function(){
  return this.data;
};
IncomingMessage.prototype = new SIPMessage();

  /**
 * @augments IncomingMessage
 * @class Class for incoming SIP request.
 */
IncomingRequest = function(ua) {
  IncomingMessage.call(this);
  this.ua = ua;
  this.ruri = null;
  this.transport = null;
  this.server_transaction = null;
};
IncomingRequest.prototype = new IncomingMessage();

/**
* Stateful reply.
* @param {Number} code status code
* @param {String} reason reason phrase
* @param {Object} headers extra headers
* @param {String} body body
* @param {Function} [onSuccess] onSuccess callback
* @param {Function} [onFailure] onFailure callback
*/
IncomingRequest.prototype.reply = function(code, reason, extraHeaders, body, onSuccess, onFailure) {
  var rr, vias, length, idx, response,
    to = this.getHeader('To'),
    r = 0,
    v = 0;

  code = code || null;
  reason = reason || null;

  // Validate code and reason values
  if (!code || (code < 100 || code > 699)) {
    throw new TypeError('Invalid status_code: '+ code);
  } else if (reason && typeof reason !== 'string' && !(reason instanceof String)) {
    throw new TypeError('Invalid reason_phrase: '+ reason);
  }

  reason = reason || ExSIP.C.REASON_PHRASE[code] || '';
  extraHeaders = extraHeaders || [];

  response = 'SIP/2.0 ' + code + ' ' + reason + '\r\n';

  if(this.method === ExSIP.C.INVITE && code > 100 && code <= 200) {
    rr = this.countHeader('record-route');

    for(r; r < rr; r++) {
      response += 'Record-Route: ' + this.getHeader('record-route', r) + '\r\n';
    }
  }

  vias = this.countHeader('via');

  for(v; v < vias; v++) {
    response += 'Via: ' + this.getHeader('via', v) + '\r\n';
  }

  if(!this.to_tag && code > 100) {
    to += ';tag=' + ExSIP.Utils.newTag();
  } else if(this.to_tag && !this.s('to').hasParam('tag')) {
    to += ';tag=' + this.to_tag;
  }

  response += 'To: ' + to + '\r\n';
  response += 'From: ' + this.getHeader('From') + '\r\n';
  response += 'Call-ID: ' + this.call_id + '\r\n';
  response += 'CSeq: ' + this.cseq + ' ' + this.method + '\r\n';

  length = extraHeaders.length;
  for (idx = 0; idx < length; idx++) {
    response += extraHeaders[idx] +'\r\n';
  }

  if(body) {
    length = ExSIP.Utils.str_utf8_length(body);
    response += 'Content-Type: application/sdp\r\n';
    response += 'Content-Length: ' + length + '\r\n\r\n';
    response += body;
  } else {
    response += 'Content-Length: ' + 0 + '\r\n\r\n';
  }

  this.server_transaction.receiveResponse(code, response, onSuccess, onFailure);
};

/**
* Stateless reply.
* @param {Number} code status code
* @param {String} reason reason phrase
*/
IncomingRequest.prototype.reply_sl = function(code, reason) {
  var to, response,
    vias = this.countHeader('via');

  code = code || null;
  reason = reason || null;

  // Validate code and reason values
  if (!code || (code < 100 || code > 699)) {
    throw new TypeError('Invalid status_code: '+ code);
  } else if (reason && typeof reason !== 'string' && !(reason instanceof String)) {
    throw new TypeError('Invalid reason_phrase: '+ reason);
  }

  reason = reason || ExSIP.C.REASON_PHRASE[code] || '';

  response = 'SIP/2.0 ' + code + ' ' + reason + '\r\n';

  for(var v = 0; v < vias; v++) {
    response += 'Via: ' + this.getHeader('via', v) + '\r\n';
  }

  to = this.getHeader('To');

  if(!this.to_tag && code > 100) {
    to += ';tag=' + ExSIP.Utils.newTag();
  } else if(this.to_tag && !this.s('to').hasParam('tag')) {
    to += ';tag=' + this.to_tag;
  }

  response += 'To: ' + to + '\r\n';
  response += 'From: ' + this.getHeader('From') + '\r\n';
  response += 'Call-ID: ' + this.call_id + '\r\n';
  response += 'CSeq: ' + this.cseq + ' ' + this.method + '\r\n';
  response += 'Content-Length: ' + 0 + '\r\n\r\n';

  this.transport.send(response);
};

/**
 * @augments IncomingMessage
 * @class Class for incoming SIP response.
 */
IncomingResponse = function() {
  IncomingMessage.call(this);
  this.status_code = null;
  this.reason_phrase = null;
};
IncomingResponse.prototype = new IncomingMessage();

ExSIP.OutgoingRequest = OutgoingRequest;
ExSIP.IncomingRequest = IncomingRequest;
ExSIP.IncomingResponse = IncomingResponse;
}(ExSIP));




/**
 * @fileoverview SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 */


/**
 * @augments ExSIP
 * @class Class creating a SIP Subscriber.
 */

ExSIP.Subscriber = function() {};
ExSIP.Subscriber.prototype = {
  /**
   * @private
   */
  initSubscriber: function(ua){
    this.ua = ua;
    this.N = null;
    this.subscriptions = {};

    // Call-ID and CSeq values RFC3261 10.2
    this.call_id = ExSIP.Utils.createRandomToken(22);
    this.cseq = 80;

    // this.to_uri
    this.to_uri = ua.configuration.uri;
    this.contact = ua.contact.toString();
  },

  /**
  * @private
  */
  timer_N: function(){
    this.close();
  },

  /**
  * @private
  */
  close: function() {
    var subscription;

    if (this.state !== 'terminated') {
      if(this.ua.isDebug()) {
        console.log(ExSIP.C.LOG_SUBSCRIBER,'terminating Subscriber');
      }

      this.state = 'terminated';
      window.clearTimeout(this.N);

      for (subscription in this.subscriptions) {
        this.subscriptions[subscription].unsubscribe();
      }

      //Delete subscriber from ua.sessions
      delete this.ua.sessions[this.id];

      this.onTerminate();
    }
  },

  /**
  * @private
  */
  onSubscriptionTerminate: function(subscription) {

    delete this.subscriptions[subscription.id];

    if (Object.keys(this.subscriptions).length === 0) {
      this.close();
    }
  },

  createSubscribeRequest: function(dialog, params) {
    params = params || {};
    params.to_uri = this.to_uri;
    params.call_id = this.call_id;
    params.cseq = this.cseq += 1;
    var extraHeaders = [];
    extraHeaders.push('Contact: '+ this.contact);
    extraHeaders.push('Event: message-summary');
    extraHeaders.push('Date: '+new Date());
    extraHeaders.push('Accept: application/simple-message-summary');
    extraHeaders.push('Allow: '+ ExSIP.Utils.getAllowedMethods(this.ua));

    var request = new ExSIP.OutgoingRequest(ExSIP.C.SUBSCRIBE, this.ua.configuration.registrar_server, this.ua,
      params, extraHeaders);

    return request;
  },

  subscribe: function() {
    var subscriber, from_tag, expires, self = this;

    if (['notify_wait', 'pending', 'active', 'terminated'].indexOf(this.state) !== -1) {
      console.error(ExSIP.C.LOG_SUBSCRIBER,'subscription is already on');
      return;
    }

    subscriber = this;
    from_tag = ExSIP.Utils.newTag();

    new function() {
      this.request = subscriber.createSubscribeRequest(null,{from_tag:from_tag});
      var request_sender = new ExSIP.RequestSender(this, subscriber.ua);

      this.receiveResponse = function(response) {
        switch(true) {
          case /^1[0-9]{2}$/.test(response.status_code): // Ignore provisional responses.
            break;
          case /^2[0-9]{2}$/.test(response.status_code):
            expires = response.s('Expires');

            if (expires && expires <= subscriber.expires) {
              window.clearTimeout(subscriber.N);
              subscriber.N = window.setTimeout(
                function() {subscriber.timer_N();},
                (expires * 1000)
              );
              // Save route set and to tag for backwards compatibility (3265)
              subscriber.route_set_2xx =  response.getHeaderAll('record-route').reverse();
              subscriber.to_tag_2xx = response.s('to').tag;
              subscriber.initial_local_seqnum = parseInt(response.s('cseq').value,10);
            }
            else {
              subscriber.close();

              if (!expires) {
                if(self.ua.isDebug()) {
                  console.warn(ExSIP.C.LOG_SUBSCRIBER,'Expires header missing in a 200-class response to SUBSCRIBE');
                }
                subscriber.onFailure(null, ExSIP.C.EXPIRES_HEADER_MISSING);
              } else {
                if(self.ua.isDebug()) {
                  console.warn(ExSIP.C.LOG_SUBSCRIBER,'Expires header in a 200-class response to SUBSCRIBE with a higher value than the indicated in the request');
                }
                subscriber.onFailure(null, ExSIP.C.INVALID_EXPIRES_HEADER);
              }
            }
            break;
          default:
            subscriber.close();
            subscriber.onFailure(response,null);
            break;
        }
      };

      this.onRequestTimeout = function() {
        subscriber.onFailure(null, ExSIP.C.causes.REQUEST_TIMEOUT);
      };

      this.onTransportError = function() {
        subscriber.onFailure(null, ExSIP.C.causes.CONNECTION_ERROR);
      };

      this.send = function() {
        subscriber.id = this.request.headers['Call-ID'] + from_tag;
        subscriber.ua.sessions[subscriber.id] = subscriber;
        subscriber.state = 'notify_wait';
        subscriber.N = window.setTimeout(
          function() {subscriber.timer_N();},
          (ExSIP.Timers.T1 * 64)
        );
        request_sender.send();
      };
      this.send();
    };

  },

  unsubscribe: function() {
    this.close();
  },

  /**
  * Every Session needs a 'terminate' method in order to be called by ExSIP.UA
  * when user fires ExSIP.UA.close()
  * @private
  */
  terminate: function() {
    this.unsubscribe();
  },

  refresh: function() {
    var subscription;

    for (subscription in this.subscriptions) {
      this.subscriptions[subscription].subscribe();
    }
  },

  /**
  * @private
  */
  receiveRequest: function(request) {
    var subscription_state, expires;

    if (!this.matchEvent(request)) {
      return;
    }

    subscription_state = request.s('Subscription-State');
    expires = subscription_state.expires || this.expires;

    switch (subscription_state.state) {
      case 'pending':
      case 'active':
        //create the subscription.
        window.clearTimeout(this.N);
        new ExSIP.Subscription(this, request, subscription_state.state, expires);
        break;
      case 'terminated':
        if (subscription_state.reason) {
          if(this.ua.isDebug()) {
            console.log(ExSIP.C.LOG_SUBSCRIBER,'terminating subscription with reason '+ subscription_state.reason);
          }
        }
        window.clearTimeout(this.N);
        this.close();
        break;
    }
  },

  /**
  * @private
  */
  matchEvent: function(request) {
    var event;

    // Check mandatory header Event
    if (!request.hasHeader('Event')) {
      if(this.ua.isDebug()) {
        console.warn(ExSIP.C.LOG_SUBSCRIBER,'missing Event header');
      }
      return false;
    }
    // Check mandatory header Subscription-State
    if (!request.hasHeader('Subscription-State')) {
      if(this.ua.isDebug()) {
        console.warn(ExSIP.C.LOG_SUBSCRIBER,'missing Subscription-State header');
      }
      return false;
    }

    // Check whether the event in NOTIFY matches the event in SUBSCRIBE
    event = request.s('event').event;

    if (this.event !== event) {
      if(this.ua.isDebug()) {
        console.warn(ExSIP.C.LOG_SUBSCRIBER,'event match failed');
      }
      request.reply(481, 'Event Match Failed');
      return false;
    } else {
      return true;
    }
  }
};

/**
 * @augments ExSIP
 * @class Class creating a SIP Subscription.
 */
ExSIP.Subscription = function (subscriber, request, state, expires) {

    this.id = null;
    this.subscriber = subscriber;
    this.ua = subscriber.ua;
    this.state = state;
    this.expires = expires;
    this.dialog = null;
    this.N = null;
    this.error_codes  = [404,405,410,416,480,481,482,483,484,485,489,501,604];

    //Create dialog and pass the request to receiveRequest method.
    if (this.createConfirmedDialog(request,'UAS')) {
      this.id = this.dialog.id.toString();
      this.subscriber.subscriptions[this.id] = this;

      /* Update the route_set
      * If the endpoint responded with a 2XX to the initial subscribe
      */
      if (request.from_tag === this.subscriber.to_tag_2xx) {
        this.dialog.route_set = this.subscriber.route_set_2xx;
      }

      this.dialog.local_seqnum = this.subscriber.initial_local_seqnum;

      this.receiveRequest(request, true);
    }
};

ExSIP.Subscription.prototype = {
  /**
  * @private
  */
  timer_N: function(){
    if (this.state === 'terminated') {
      this.close();
    } else if (this.state === 'pending') {
      this.state = 'terminated';
      this.close();
    } else {
      this.subscribe();
    }
  },

  /**
  * @private
  */
  close: function() {
    this.state = 'terminated';
    this.terminateDialog();
    window.clearTimeout(this.N);
    this.subscriber.onSubscriptionTerminate(this);
  },

  /**
  * @private
  */
  createConfirmedDialog: function(message, type) {
    var local_tag, remote_tag, id, dialog;

    // Create a confirmed dialog given a message and type ('UAC' or 'UAS')
    local_tag = (type === 'UAS') ? message.to_tag : message.from_tag;
    remote_tag = (type === 'UAS') ? message.from_tag : message.to_tag;
    id = message.call_id + local_tag + remote_tag;

    dialog = new ExSIP.Dialog(this, message, type);

    if(dialog) {
      this.dialog = dialog;
      return true;
    }
    // Dialog not created due to an error
    else {
      return false;
    }
  },

  /**
  * @private
  */
  terminateDialog: function() {
    if(this.dialog) {
      this.dialog.terminate();
      delete this.dialog;
    }
  },

  /**
  * @private
  */
  receiveRequest: function(request, initial) {
    var subscription_state,
      subscription = this;

    if (!initial && !this.subscriber.matchEvent(request)) {
      if(this.ua.isDebug()) {
        console.warn(ExSIP.C.LOG_SUBSCRIBER,'NOTIFY request does not match event');
      }
      return;
    }

    request.reply(200, ExSIP.C.REASON_200, [
      'Contact: <'+ this.subscriber.contact +'>'
    ]);

    subscription_state = request.s('Subscription-State');

    switch (subscription_state.state) {
      case 'active':
        this.state = 'active';
        this.subscriber.receiveInfo(request);
        /* falls through */
      case 'pending':
        this.expires = subscription_state.expires || this.expires;
        window.clearTimeout(subscription.N);
        subscription.N = window.setTimeout(
          function() {subscription.timer_N();},
          (this.expires * 1000)
        );
        break;
      case 'terminated':
        if (subscription_state.reason) {
          if(this.ua.isDebug()) {
            console.log(ExSIP.C.LOG_SUBSCRIBER,'terminating subscription with reason '+ subscription_state.reason);
          }
        }
        this.close();
        this.subscriber.receiveInfo(request);
        break;
    }
  },

  subscribe: function() {
    var expires,
      subscription = this;

    new function() {
      this.request = subscription.subscriber.createSubscribeRequest(subscription.dialog);

      var request_sender = new ExSIP.RequestSender(this, subscription.subscriber.ua);

      this.receiveResponse = function(response) {
        if (subscription.error_codes.indexOf(response.status_code) !== -1) {
          subscription.close();
          subscription.subscriber.onFailure(response, null);
        } else {
          switch(true) {
            case /^1[0-9]{2}$/.test(response.status_code): // Ignore provisional responses.
              break;
            case /^2[0-9]{2}$/.test(response.status_code):
              expires = response.s('Expires');

              if (expires && expires <= subscription.expires) {
                window.clearTimeout(subscription.N);
                subscription.N = window.setTimeout(
                  function() {subscription.timer_N();},
                  (expires * 1000)
                );
              }else {
                subscription.close();

                if (!expires) {
                  if(subscription.ua.isDebug()) {
                    console.warn(ExSIP.C.LOG_SUBSCRIBER,'Expires header missing in a 200-class response to SUBSCRIBE');
                  }
                  subscription.subscriber.onFailure(null, ExSIP.C.EXPIRES_HEADER_MISSING);
                } else {
                  if(subscription.ua.isDebug()) {
                    console.warn(ExSIP.C.LOG_SUBSCRIBER,'Expires header in a 200-class response to SUBSCRIBE with a higher value than the indicated in the request');
                  }
                  subscription.subscriber.onFailure(null, ExSIP.C.INVALID_EXPIRES_HEADER);
                }
              }
              break;
            default:
              subscription.close();
              subscription.subscriber.onFailure(response,null);
              break;
          }
        }
      };

      this.send = function() {
        window.clearTimeout(subscription.N);
        subscription.N = window.setTimeout(
          function() {subscription.timer_N();},
          (ExSIP.Timers.T1 * 64)
        );
        request_sender.send();
      };

      this.onRequestTimeout = function() {
        subscription.subscriber.onFailure(null, ExSIP.C.causes.REQUEST_TIMEOUT);
      };

      this.onTransportError = function() {
        subscription.subscriber.onFailure(null, ExSIP.C.causes.CONNECTION_ERROR);
      };

      this.send();
    };
  },

  unsubscribe: function() {
    var subscription = this;

    this.state = 'terminated';

    new function() {
      this.request = subscription.subscriber.createSubscribeRequest(subscription.dialog);
      this.request.setHeader('Expires', 0);

      var request_sender = new ExSIP.RequestSender(this, subscription.subscriber.ua);

      //Don't care about response.
      this.receiveResponse = function(){};

      this.send = function() {
        window.clearTimeout(subscription.N);
        subscription.N = window.setTimeout(
          function() {subscription.timer_N();},
          (ExSIP.Timers.T1 * 64)
        );
        request_sender.send();
      };

      this.onRequestTimeout = function() {
        subscription.subscriber.onFailure(null, ExSIP.C.causes.REQUEST_TIMEOUT);
      };
      this.onTransportError = function() {
        subscription.subscriber.onFailure(null, ExSIP.C.causes.CONNECTION_ERROR);
      };

      this.send();
    };
  }
};


/**
 * @fileoverview SIP URI
 */

/**
 * @augments ExSIP
 * @class Class creating a SIP URI.
 *
 * @param {String} [scheme]
 * @param {String} [user]
 * @param {String} host
 * @param {String} [port]
 * @param {Object} [parameters]
 * @param {Object} [headers]
 *
 */
(function(ExSIP) {
var URI;

URI = function(scheme, user, host, port, parameters, headers) {
  var param, header;

  // Checks
  if(!host) {
    throw new TypeError('missing or invalid "host" parameter');
  }

  // Initialize parameters
  scheme = scheme || ExSIP.C.SIP;
  this.parameters = {};
  this.headers = {};

  for (param in parameters) {
    this.setParam(param, parameters[param]);
  }

  for (header in headers) {
    this.setHeader(header, headers[header]);
  }

  Object.defineProperties(this, {
    scheme: {
      get: function(){ return scheme; },
      set: function(value){
        scheme = value.toLowerCase();
      }
    },

    user: {
      get: function(){ return user; },
      set: function(value){
        user = value;
      }
    },

    host: {
      get: function(){ return host; },
      set: function(value){
        host = value.toLowerCase();
      }
    },

    port: {
      get: function(){ return port; },
      set: function(value){
        port = value === 0 ? value : (parseInt(value,10) || null);
      }
    }
  });
};
URI.prototype = {
  setParam: function(key, value) {
    if(key) {
      this.parameters[key.toLowerCase()] = (typeof value === 'undefined' || value === null) ? null : value.toString().toLowerCase();
    }
  },

  getParam: function(key) {
    if(key) {
      return this.parameters[key.toLowerCase()];
    }
  },

  hasParam: function(key) {
    if(key) {
      return (this.parameters.hasOwnProperty(key.toLowerCase()) && true) || false;
    }
  },

  deleteParam: function(parameter) {
    var value;
    parameter = parameter.toLowerCase();
    if (this.parameters.hasOwnProperty(parameter)) {
      value = this.parameters[parameter];
      delete this.parameters[parameter];
      return value;
    }
  },

  clearParams: function() {
    this.parameters = {};
  },

  setHeader: function(name, value) {
    this.headers[ExSIP.Utils.headerize(name)] = (value instanceof Array) ? value : [value];
  },

  getHeader: function(name) {
    if(name) {
      return this.headers[ExSIP.Utils.headerize(name)];
    }
  },

  hasHeader: function(name) {
    if(name) {
      return (this.headers.hasOwnProperty(ExSIP.Utils.headerize(name)) && true) || false;
    }
  },

  deleteHeader: function(header) {
    var value;
    header = ExSIP.Utils.headerize(header);
    if(this.headers.hasOwnProperty(header)) {
      value = this.headers[header];
      delete this.headers[header];
      return value;
    }
  },

  clearHeaders: function() {
    this.headers = {};
  },

  isPhoneNumber: function() {
    return this.user && this.user.match(/^\+?\d+$/) !== null;
  },

  clone: function() {
    return new URI(
      this.scheme,
      this.user,
      this.host,
      this.port,
      window.JSON.parse(window.JSON.stringify(this.parameters)),
      window.JSON.parse(window.JSON.stringify(this.headers)));
  },

  toString: function(){
    var header, parameter, idx, uri,
      headers = [];

    uri  = this.scheme + ':';
    if (this.user) {
      uri += ExSIP.Utils.escapeUser(this.user) + '@';
    }
    uri += this.host;
    if (this.port || this.port === 0) {
      uri += ':' + this.port;
    }

    for (parameter in this.parameters) {
      uri += ';' + parameter;

      if (this.parameters[parameter] !== null) {
        uri += '='+ this.parameters[parameter];
      }
    }

    for(header in this.headers) {
      for(idx in this.headers[header]) {
        headers.push(header + '=' + this.headers[header][idx]);
      }
    }

    if (headers.length > 0) {
      uri += '?' + headers.join('&');
    }

    return uri;
  },

  toAor: function(show_port){
      var aor;

      aor  = this.scheme + ':';
      if (this.user) {
        aor += ExSIP.Utils.escapeUser(this.user) + '@';
      }
      aor += this.host;
      if (show_port && (this.port || this.port === 0)) {
        aor += ':' + this.port;
      }

      return aor;
  }
};


/**
  * Parse the given string and returns a ExSIP.URI instance or undefined if
  * it is an invalid URI.
  * @public
  * @param {String} uri
  */
URI.parse = function(uri) {
  uri = ExSIP.Grammar.parse(uri,'SIP_URI');

  if (uri !== -1) {
    return uri;
  } else {
    return undefined;
  }
};

ExSIP.URI = URI;
}(ExSIP));



/**
 * @fileoverview ExSIP NameAddrHeader
 */

/**
 * @augments ExSIP
 * @class Class creating a Name Address SIP header.
 *
 * @param {ExSIP.URI} uri
 * @param {String} [display_name]
 * @param {Object} [parameters]
 *
 */
(function(ExSIP) {
var NameAddrHeader;

NameAddrHeader = function(uri, display_name, parameters) {
  var param;

  // Checks
  if(!uri || !(uri instanceof ExSIP.URI)) {
    throw new TypeError('missing or invalid "uri" parameter');
  }

  // Initialize parameters
  this.uri = uri;
  this.parameters = {};

  for (param in parameters) {
    this.setParam(param, parameters[param]);
  }

  Object.defineProperties(this, {
    display_name: {
      get: function() { return display_name; },
      set: function(value) {
        display_name = (value === 0) ? '0' : value;
      }
    }
  });
};
NameAddrHeader.prototype = {
  setParam: function(key, value) {
    if (key) {
      this.parameters[key.toLowerCase()] = (typeof value === 'undefined' || value === null) ? null : value.toString();
    }
  },

  getParam: function(key) {
    if(key) {
      return this.parameters[key.toLowerCase()];
    }
  },

  hasParam: function(key) {
    if(key) {
      return (this.parameters.hasOwnProperty(key.toLowerCase()) && true) || false;
    }
  },

  deleteParam: function(parameter) {
    var value;
    parameter = parameter.toLowerCase();
    if (this.parameters.hasOwnProperty(parameter)) {
      value = this.parameters[parameter];
      delete this.parameters[parameter];
      return value;
    }
  },

  clearParams: function() {
    this.parameters = {};
  },

  clone: function() {
    return new NameAddrHeader(
      this.uri.clone(),
      this.display_name,
      window.JSON.parse(window.JSON.stringify(this.parameters)));
  },

  toString: function() {
    var body, parameter;

    body  = (this.display_name || this.display_name === 0) ? '"' + this.display_name + '" ' : '';
    body += '<' + this.uri.toString() + '>';

    for (parameter in this.parameters) {
      body += ';' + parameter;

      if (this.parameters[parameter] !== null) {
        body += '='+ this.parameters[parameter];
      }
    }

    return body;
  }
};


/**
  * Parse the given string and returns a ExSIP.NameAddrHeader instance or undefined if
  * it is an invalid NameAddrHeader.
  * @public
  * @param {String} name_addr_header
  */
NameAddrHeader.parse = function(name_addr_header) {
  name_addr_header = ExSIP.Grammar.parse(name_addr_header,'Name_Addr_Header');

  if (name_addr_header !== -1) {
    return name_addr_header;
  } else {
    return undefined;
  }
};

ExSIP.NameAddrHeader = NameAddrHeader;
}(ExSIP));



/**
 * @fileoverview SIP Transactions
 */

/**
 * SIP Transactions module.
 * @augments ExSIP
 */
(function(ExSIP) {
var Transactions,
  logger =  new ExSIP.Logger(ExSIP.name +' | '+ 'TRANSACTION'),
  C = {
    // Transaction states
    STATUS_TRYING:     1,
    STATUS_PROCEEDING: 2,
    STATUS_CALLING:    3,
    STATUS_ACCEPTED:   4,
    STATUS_COMPLETED:  5,
    STATUS_TERMINATED: 6,
    STATUS_CONFIRMED:  7
  };

Transactions = {};

/**
* @class Client Transaction
* @private
*/
var ClientTransaction = function() {
  this.init = function(request_sender, request, transport) {
    var via;

    this.transport = transport;
    this.id = 'z9hG4bK' + Math.floor(Math.random() * 10000000);
    this.request_sender = request_sender;
    this.request = request;

    via = 'SIP/2.0/' + (request_sender.ua.configuration.hack_via_tcp ? 'TCP' : transport.server.scheme);
    via += ' ' + request_sender.ua.configuration.via_host + ';branch=' + this.id;

    this.request.setHeader('via', via);
  };
};

/**
* @class Non Invite Client Transaction Prototype
* @private
*/
var NonInviteClientTransactionPrototype = function() {
  this.send = function() {
    var tr = this;

    this.state = C.STATUS_TRYING;
    this.F = window.setTimeout(function() {tr.timer_F();}, ExSIP.Timers.TIMER_F);

    if(!this.transport.send(this.request)) {
      this.onTransportError();
    }
  };

  this.onTransportError = function() {
    logger.log('transport error occurred, deleting non-INVITE client transaction ' + this.id, this.request_sender.ua);
    window.clearTimeout(this.F);
    window.clearTimeout(this.K);
    delete this.request_sender.ua.transactions.nict[this.id];
    this.request_sender.onTransportError();
  };

  this.timer_F = function() {
    logger.log('Timer F expired for non-INVITE client transaction ' + this.id, this.request_sender.ua);
    this.state = C.STATUS_TERMINATED;
    this.request_sender.onRequestTimeout();
    delete this.request_sender.ua.transactions.nict[this.id];
  };

  this.timer_K = function() {
    this.state = C.STATUS_TERMINATED;
    delete this.request_sender.ua.transactions.nict[this.id];
  };

  this.receiveResponse = function(response) {
    var
      tr = this,
      status_code = response.status_code;

    if(status_code < 200) {
      switch(this.state) {
        case C.STATUS_TRYING:
        case C.STATUS_PROCEEDING:
          this.state = C.STATUS_PROCEEDING;
          this.request_sender.receiveResponse(response);
          break;
      }
    } else {
      switch(this.state) {
        case C.STATUS_TRYING:
        case C.STATUS_PROCEEDING:
          this.state = C.STATUS_COMPLETED;
          window.clearTimeout(this.F);

          if(status_code === 408) {
            this.request_sender.onRequestTimeout();
          } else {
            this.request_sender.receiveResponse(response);
          }

          this.K = window.setTimeout(function() {tr.timer_K();}, ExSIP.Timers.TIMER_K);
          break;
        case C.STATUS_COMPLETED:
          break;
      }
    }
  };
};
NonInviteClientTransactionPrototype.prototype = new ClientTransaction();


/**
 * @class Invite Client Transaction Prototype
 * @private
 */
var InviteClientTransactionPrototype = function() {

  this.send = function() {
    var tr = this;
    this.state = C.STATUS_CALLING;
    this.B = window.setTimeout(function() {
      tr.timer_B();
    }, ExSIP.Timers.TIMER_B);

    if(!this.transport.send(this.request)) {
      this.onTransportError();
    }
  };

  this.onTransportError = function() {
    logger.log('transport error occurred, deleting INVITE client transaction ' + this.id, this.request_sender.ua);
    window.clearTimeout(this.B);
    window.clearTimeout(this.D);
    window.clearTimeout(this.M);
    delete this.request_sender.ua.transactions.ict[this.id];

    if (this.state !== C.STATUS_ACCEPTED) {
      this.request_sender.onTransportError();
    }
  };

  // RFC 6026 7.2
  this.timer_M = function() {
    logger.log('Timer M expired for INVITE client transaction ' + this.id, this.request_sender.ua);

    if(this.state === C.STATUS_ACCEPTED) {
      this.state = C.STATUS_TERMINATED;
      window.clearTimeout(this.B);
      delete this.request_sender.ua.transactions.ict[this.id];
    }
  };

  // RFC 3261 17.1.1
  this.timer_B = function() {
    logger.log('Timer B expired for INVITE client transaction ' + this.id, this.request_sender.ua);
    if(this.state === C.STATUS_CALLING) {
      this.state = C.STATUS_TERMINATED;
      this.request_sender.onRequestTimeout();
      delete this.request_sender.ua.transactions.ict[this.id];
    }
  };

  this.timer_D = function() {
    logger.log('Timer D expired for INVITE client transaction ' + this.id, this.request_sender.ua);
    this.state = C.STATUS_TERMINATED;
    window.clearTimeout(this.B);
    delete this.request_sender.ua.transactions.ict[this.id];
  };

  this.sendACK = function(response) {
    var tr = this;

    this.ack = 'ACK ' + this.request.ruri + ' SIP/2.0\r\n';
    this.ack += 'Via: ' + this.request.getHeader('Via').toString() + '\r\n';

    if(this.request.getHeader('Route') && this.request.getHeader('Route').toString() !== "") {
      this.ack += 'Route: ' + this.request.getHeader('Route').toString() + '\r\n';
    }

    this.ack += 'To: ' + response.getHeader('to') + '\r\n';
    this.ack += 'From: ' + this.request.getHeader('From').toString() + '\r\n';
    this.ack += 'Call-ID: ' + this.request.getHeader('Call-ID').toString() + '\r\n';
    this.ack += 'CSeq: ' + this.request.getHeader('CSeq').toString().split(' ')[0];
    this.ack += ' ACK\r\n\r\n';

    this.D = window.setTimeout(function() {tr.timer_D();}, ExSIP.Timers.TIMER_D);

    this.transport.send(this.ack);
  };

  this.cancel_request = function(tr, reason) {
    var request = tr.request;

    this.cancel = ExSIP.C.CANCEL + ' ' + request.ruri + ' SIP/2.0\r\n';
    this.cancel += 'Via: ' + request.getHeader('Via').toString() + '\r\n';

    if(this.request.getHeader('Route')) {
      this.cancel += 'Route: ' + request.getHeader('Route').toString() + '\r\n';
    }

    this.cancel += 'To: ' + request.getHeader('To').toString() + '\r\n';
    this.cancel += 'From: ' + request.getHeader('From').toString() + '\r\n';
    this.cancel += 'Call-ID: ' + request.getHeader('Call-ID').toString() + '\r\n';
    this.cancel += 'CSeq: ' + request.getHeader('CSeq').toString().split(' ')[0] +
    ' CANCEL\r\n';

    if(reason) {
      this.cancel += 'Reason: ' + reason + '\r\n';
    }

    this.cancel += 'Content-Length: 0\r\n\r\n';

    // Send only if a provisional response (>100) has been received.
    if(this.state === C.STATUS_PROCEEDING) {
      this.transport.send(this.cancel);
    }
  };

  this.receiveResponse = function(response) {
    var
      tr = this,
      status_code = response.status_code;

    if(status_code >= 100 && status_code <= 199) {
      switch(this.state) {
        case C.STATUS_CALLING:
          this.state = C.STATUS_PROCEEDING;
          this.request_sender.receiveResponse(response);
          if(this.cancel) {
            this.transport.send(this.cancel);
          }
          break;
        case C.STATUS_PROCEEDING:
          this.request_sender.receiveResponse(response);
          break;
      }
    } else if(status_code >= 200 && status_code <= 299) {
      switch(this.state) {
        case C.STATUS_CALLING:
        case C.STATUS_PROCEEDING:
          this.state = C.STATUS_ACCEPTED;
          this.M = window.setTimeout(function() {
            tr.timer_M();
          }, ExSIP.Timers.TIMER_M);
          this.request_sender.receiveResponse(response);
          break;
        case C.STATUS_ACCEPTED:
          this.request_sender.receiveResponse(response);
          break;
      }
    } else if(status_code >= 300 && status_code <= 699) {
      switch(this.state) {
        case C.STATUS_CALLING:
        case C.STATUS_PROCEEDING:
          this.state = C.STATUS_COMPLETED;
          this.sendACK(response);
          if(status_code === 503) {
            var options = {code: 503, reason: 'Service Unavailable', retryCallback: function(transport){
              transport.ua.once("connected", function(e){
                if(transport === e.data.transport) {
                  tr.send();
                }
              });
            }};
            this.request_sender.ua.onTransportError(this.request_sender.ua.transport, options);
          } else {
            this.request_sender.receiveResponse(response);
          }
          break;
        case C.STATUS_COMPLETED:
          this.sendACK(response);
          break;
      }
    }
  };
};
InviteClientTransactionPrototype.prototype = new ClientTransaction();

/**
 * @class Server Transaction
 * @private
 */
var ServerTransaction = function() {
  this.init = function(request, ua) {
    this.id = request.via_branch;
    this.request = request;
    this.transport = request.transport;
    this.ua = ua;
    this.last_response = '';
    request.server_transaction = this;
  };
};

/**
 * @class Non Invite Server Transaction Prototype
 * @private
 */
var NonInviteServerTransactionPrototype = function() {
  this.timer_J = function() {
    logger.log('Timer J expired for non-INVITE server transaction ' + this.id, this.ua);
    this.state = C.STATUS_TERMINATED;
    delete this.ua.transactions.nist[this.id];
  };

  this.onTransportError = function() {
    if (!this.transportError) {
      this.transportError = true;

      logger.log('transport error occurred, deleting non-INVITE server transaction ' + this.id, this.ua);

      window.clearTimeout(this.J);
      delete this.ua.transactions.nist[this.id];
    }
  };

  this.receiveResponse = function(status_code, response, onSuccess, onFailure) {
    var tr = this;

    if(status_code === 100) {
      /* RFC 4320 4.1
       * 'A SIP element MUST NOT
       * send any provisional response with a
       * Status-Code other than 100 to a non-INVITE request.'
       */
      switch(this.state) {
        case C.STATUS_TRYING:
          this.state = C.STATUS_PROCEEDING;
          if(!this.transport.send(response))  {
            this.onTransportError();
          }
          break;
        case C.STATUS_PROCEEDING:
          this.last_response = response;
          if(!this.transport.send(response)) {
            this.onTransportError();
            if (onFailure) {
              onFailure();
            }
          } else if (onSuccess) {
            onSuccess();
          }
          break;
      }
    } else if(status_code >= 200 && status_code <= 699) {
      switch(this.state) {
        case C.STATUS_TRYING:
        case C.STATUS_PROCEEDING:
          this.state = C.STATUS_COMPLETED;
          this.last_response = response;
          if(ExSIP.Timers.TIMER_J === 0) {
              tr.timer_J();
          } else {
            this.J = window.setTimeout(function() {
              tr.timer_J();
            }, ExSIP.Timers.TIMER_J);
          }
          if(!this.transport.send(response)) {
            this.onTransportError();
            if (onFailure) {
              onFailure();
            }
          } else if (onSuccess) {
            onSuccess();
          }
          break;
        case C.STATUS_COMPLETED:
          break;
      }
    }
  };
};
NonInviteServerTransactionPrototype.prototype = new ServerTransaction();

/**
 * @class Invite Server Transaction Prototype
 * @private
 */
var InviteServerTransactionPrototype = function() {
  this.timer_H = function() {
    logger.log('Timer H expired for INVITE server transaction ' + this.id, this.ua);

    if(this.state === C.STATUS_COMPLETED) {
      logger.warn('transactions', 'ACK for INVITE server transaction was never received, call will be terminated', this.ua);
      this.state = C.STATUS_TERMINATED;
    }

    delete this.ua.transactions.ist[this.id];
  };

  this.timer_I = function() {
    this.state = C.STATUS_TERMINATED;
    delete this.ua.transactions.ist[this.id];
  };

  // RFC 6026 7.1
  this.timer_L = function() {
    logger.log('Timer L expired for INVITE server transaction ' + this.id, this.ua);

    if(this.state === C.STATUS_ACCEPTED) {
      this.state = C.STATUS_TERMINATED;
      delete this.ua.transactions.ist[this.id];
    }
  };

  this.onTransportError = function() {
    if (!this.transportError) {
      this.transportError = true;

      logger.log('transport error occurred, deleting INVITE server transaction ' + this.id, this.ua);

      if (this.resendProvisionalTimer !== null) {
        window.clearInterval(this.resendProvisionalTimer);
        this.resendProvisionalTimer = null;
      }
      window.clearTimeout(this.L);
      window.clearTimeout(this.H);
      window.clearTimeout(this.I);
      delete this.ua.transactions.ist[this.id];
    }
  };

  this.resend_provisional = function() {
    if(!this.transport.send(this.last_response)) {
      this.onTransportError();
    }
  };

  this.cancel_request = function(tr, reason) {
    var request = tr.request;

    this.cancel = ExSIP.C.CANCEL + ' ' + request.ruri + ' SIP/2.0\r\n';
    this.cancel += 'Via: ' + request.getHeader('Via').toString() + '\r\n';

    if(this.request.getHeader('Route')) {
      this.cancel += 'Route: ' + request.getHeader('Route').toString() + '\r\n';
    }

    this.cancel += 'To: ' + request.getHeader('From').toString() + '\r\n';
    this.cancel += 'From: ' + request.getHeader('To').toString() + '\r\n';
    this.cancel += 'Call-ID: ' + request.getHeader('Call-ID').toString() + '\r\n';
    this.cancel += 'CSeq: ' + request.getHeader('CSeq').toString().split(' ')[0] +
      ' CANCEL\r\n';

    if(reason) {
      this.cancel += 'Reason: ' + reason + '\r\n';
    }

    this.cancel += 'Content-Length: 0\r\n\r\n';

    this.transport.send(this.cancel);
  };

  // INVITE Server Transaction RFC 3261 17.2.1
  this.receiveResponse = function(status_code, response, onSuccess, onFailure) {
    var tr = this;

    if(status_code >= 100 && status_code <= 199) {
      switch(this.state) {
        case C.STATUS_PROCEEDING:
          if(!this.transport.send(response)) {
            this.onTransportError();
          }
          this.last_response = response;
          break;
      }
    }

    if(status_code > 100 && status_code <= 199 && this.state === C.STATUS_PROCEEDING) {
      // Trigger the resendProvisionalTimer only for the first non 100 provisional response.
      if(this.resendProvisionalTimer === null) {
        this.resendProvisionalTimer = window.setInterval(function() {
          tr.resend_provisional();}, ExSIP.Timers.PROVISIONAL_RESPONSE_INTERVAL);
      }
    } else if(status_code >= 200 && status_code <= 299) {
      switch(this.state) {
        case C.STATUS_PROCEEDING:
          this.state = C.STATUS_ACCEPTED;
          this.last_response = response;
          this.L = window.setTimeout(function() {
            tr.timer_L();
          }, ExSIP.Timers.TIMER_L);
          if (this.resendProvisionalTimer !== null) {
            window.clearInterval(this.resendProvisionalTimer);
            this.resendProvisionalTimer = null;
          }
          /* falls through */
        case C.STATUS_ACCEPTED:
          // Note that this point will be reached for proceeding tr.state also.
          if(!this.transport.send(response)) {
            this.onTransportError();
            if (onFailure) {
              onFailure();
            }
          } else if (onSuccess) {
            onSuccess();
          }
          break;
      }
    } else if(status_code >= 300 && status_code <= 699) {
      switch(this.state) {
        case C.STATUS_PROCEEDING:
          if (this.resendProvisionalTimer !== null) {
            window.clearInterval(this.resendProvisionalTimer);
            this.resendProvisionalTimer = null;
          }
          if(!this.transport.send(response)) {
            this.onTransportError();
            if (onFailure) {
              onFailure();
            }
          } else {
            this.state = C.STATUS_COMPLETED;
            this.H = window.setTimeout(function() {
              tr.timer_H();
            }, ExSIP.Timers.TIMER_H);
            if (onSuccess) {
              onSuccess();
            }
          }
          break;
      }
    }
  };
};
InviteServerTransactionPrototype.prototype = new ServerTransaction();

/**
* @augments ExSIP.Transactions
* @class Non Invite Client Transaction
* @param {ExSIP.RequestSender} request_sender
* @param {ExSIP.OutgoingRequest} request
* @param {ExSIP.Transport} transport
*/
Transactions.NonInviteClientTransaction = function(request_sender, request, transport) {
  this.init(request_sender, request, transport);
  this.request_sender.ua.transactions.nict[this.id] = this;
};
Transactions.NonInviteClientTransaction.prototype = new NonInviteClientTransactionPrototype();

/**
* @augments ExSIP.Transactions
* @class Invite Client Transaction
* @param {ExSIP.RequestSender} request_sender
* @param {ExSIP.OutgoingRequest} request
* @param {ExSIP.Transport} transport
*/
Transactions.InviteClientTransaction = function(request_sender, request, transport) {
  var tr = this;

  this.init(request_sender, request, transport);
  this.request_sender.ua.transactions.ict[this.id] = this;

  // Add the cancel property to the request.
  //Will be called from the request instance, not the transaction itself.
  this.request.cancel = function(reason) {
    tr.cancel_request(tr, reason);
  };
};
Transactions.InviteClientTransaction.prototype = new InviteClientTransactionPrototype();

Transactions.AckClientTransaction = function(request_sender, request, transport) {
  this.init(request_sender, request, transport);
  this.send = function() {
    this.transport.send(request);
  };
};
Transactions.AckClientTransaction.prototype = new NonInviteClientTransactionPrototype();


/**
* @augments ExSIP.Transactions
* @class Non Invite Server Transaction
* @param {ExSIP.IncomingRequest} request
* @param {ExSIP.UA} ua
*/
Transactions.NonInviteServerTransaction = function(request, ua) {
  this.init(request, ua);
  this.state = C.STATUS_TRYING;

  ua.transactions.nist[this.id] = this;
};
Transactions.NonInviteServerTransaction.prototype = new NonInviteServerTransactionPrototype();



/**
* @augments ExSIP.Transactions
* @class Invite Server Transaction
* @param {ExSIP.IncomingRequest} request
* @param {ExSIP.UA} ua
*/
Transactions.InviteServerTransaction = function(request, ua) {
  var tr = this;
  this.init(request, ua);
  this.state = C.STATUS_PROCEEDING;

  ua.transactions.ist[this.id] = this;

  this.resendProvisionalTimer = null;

  // Add the cancel property to the request.
  //Will be called from the request instance, not the transaction itself.
  request.cancel = function(reason) {
    tr.cancel_request(tr, reason);
  };

  request.reply(100);
};
Transactions.InviteServerTransaction.prototype = new InviteServerTransactionPrototype();

/**
 * @function
 * @param {ExSIP.UA} ua
 * @param {ExSIP.IncomingRequest} request
 *
 * @return {boolean}
 * INVITE:
 *  _true_ if retransmission
 *  _false_ new request
 *
 * ACK:
 *  _true_  ACK to non2xx response
 *  _false_ ACK must be passed to TU (accepted state)
 *          ACK to 2xx response
 *
 * CANCEL:
 *  _true_  no matching invite transaction
 *  _false_ matching invite transaction and no final response sent
 *
 * OTHER:
 *  _true_  retransmission
 *  _false_ new request
 */
Transactions.checkTransaction = function(ua, request) {
  var tr;

  switch(request.method) {
    case ExSIP.C.INVITE:
      tr = ua.transactions.ist[request.via_branch];
      if(tr) {
        switch(tr.state) {
          case C.STATUS_PROCEEDING:
            tr.transport.send(tr.last_response);
            break;

            // RFC 6026 7.1 Invite retransmission
            //received while in C.STATUS_ACCEPTED state. Absorb it.
          case C.STATUS_ACCEPTED:
            break;
        }
        logger.log("checkTransaction failed for INVITE request and server transaction in state : "+tr.state, ua);
        return true;
      }
      break;
    case ExSIP.C.ACK:
      tr = ua.transactions.ist[request.via_branch];

      // RFC 6026 7.1
      if(tr) {
        if(tr.state === C.STATUS_ACCEPTED) {
          return false;
        } else if(tr.state === C.STATUS_COMPLETED) {
          tr.state = C.STATUS_CONFIRMED;
          tr.I = window.setTimeout(function() {tr.timer_I();}, ExSIP.Timers.TIMER_I);
          logger.log("checkTransaction failed for ACK request and server transaction in state : "+tr.state, ua);
          return true;
        }
      }

      // ACK to 2XX Response.
      else {
        return false;
      }
      break;
    case ExSIP.C.CANCEL:
      tr = ua.transactions.ist[request.via_branch];
      if(tr) {
        request.reply_sl(200);
        if(tr.state === C.STATUS_PROCEEDING) {
          return false;
        } else {
          logger.log("checkTransaction failed for CANCEL request and server transaction in state : "+tr.state, ua);
          return true;
        }
      } else {
        request.reply_sl(481);
        logger.log("checkTransaction failed for CANCEL request and no server transaction", ua);
        return true;
      }
      break;
    default:

      // Non-INVITE Server Transaction RFC 3261 17.2.2
      tr = ua.transactions.nist[request.via_branch];
      if(tr) {
        switch(tr.state) {
          case C.STATUS_TRYING:
            break;
          case C.STATUS_PROCEEDING:
          case C.STATUS_COMPLETED:
            tr.transport.send(tr.last_response);
            break;
        }
        logger.log("checkTransaction failed for non invite server transaction in state : "+tr.state, ua);
        return true;
      }
      break;
  }
};

Transactions.C = C;
ExSIP.Transactions = Transactions;
}(ExSIP));



/**
 * @fileoverview SIP Dialog
 */

/**
 * @augments ExSIP
 * @class Class creating a SIP dialog.
 * @param {ExSIP.Session} session
 * @param {ExSIP.IncomingRequest|ExSIP.IncomingResponse} message
 * @param {Enum} type UAC / UAS
 * @param {Enum} state ExSIP.Dialog.C.STATUS_EARLY / ExSIP.Dialog.C.STATUS_CONFIRMED
 */
(function(ExSIP) {
var Dialog,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'DIALOG'),
  C = {
    // Dialog states
    STATUS_EARLY:        1,
    STATUS_CONFIRMED:    2
  };

// RFC 3261 12.1
Dialog = function(session, message, type, state) {
  var contact;

  if(!message.hasHeader('contact')) {
    logger.error('unable to create a Dialog without Contact header field');
    return false;
  }

  if(message instanceof ExSIP.IncomingResponse) {
    state = (message.status_code < 200) ? C.STATUS_EARLY : C.STATUS_CONFIRMED;
  } else {
    // Create confirmed dialog if state is not defined
    state = state || C.STATUS_CONFIRMED;
  }

  contact = message.parseHeader('contact');

  this.is_acknowledged = false;
  this.type = type;
  // RFC 3261 12.1.1
  if(type === 'UAS') {
    this.id = {
      call_id: message.call_id,
      local_tag: message.to_tag,
      remote_tag: message.from_tag,
      toString: function() {
        return this.call_id + this.local_tag + this.remote_tag;
      }
    };
    this.state = state;
    this.remote_seqnum = message.cseq;
    this.local_uri = message.parseHeader('to').uri;
    this.remote_uri = message.parseHeader('from').uri;
    this.remote_target = contact.uri;
    this.route_set = message.getHeaderAll('record-route');
  }
  // RFC 3261 12.1.2
  else if(type === 'UAC') {
    this.id = {
      call_id: message.call_id,
      local_tag: message.from_tag,
      remote_tag: message.to_tag,
      toString: function() {
        return this.call_id + this.local_tag + this.remote_tag;
      }
    };
    this.state = state;
    this.local_seqnum = message.cseq;
    this.local_uri = message.parseHeader('from').uri;
    this.remote_uri = message.parseHeader('to').uri;
    this.remote_target = contact.uri;
    this.route_set = message.getHeaderAll('record-route').reverse();
  }

  this.session = session;
  session.ua.dialogs[this.id.toString()] = this;
  logger.log('new ' + type + ' dialog created with status ' + (this.state === C.STATUS_EARLY ? 'EARLY': 'CONFIRMED'), session.ua);
};

Dialog.prototype = {
  /**
   * @param {ExSIP.IncomingMessage} message
   * @param {Enum} UAC/UAS
   */
  isUAS: function() {
    return this.type === "UAS";
  },

  isUAC: function() {
    return this.type === "UAC";
  },

  update: function(message, type) {
    this.state = C.STATUS_CONFIRMED;

    logger.log('dialog '+ this.id.toString() +'  changed to CONFIRMED state', this.session.ua);

    if(type === 'UAC') {
      // RFC 3261 13.2.2.4
      this.route_set = message.getHeaderAll('record-route').reverse();
    }
  },

  terminate: function() {
    logger.log('dialog ' + this.id.toString() + ' deleted', this.session.ua);
    delete this.session.ua.dialogs[this.id.toString()];
  },

  /**
  * @param {String} method request method
  * @param {Object} extraHeaders extra headers
  * @returns {ExSIP.OutgoingRequest}
  */

  // RFC 3261 12.2.1.1
  createRequest: function(method, extraHeaders) {
    var cseq, request;
    extraHeaders = extraHeaders || [];

    if(!this.local_seqnum) { this.local_seqnum = Math.floor(Math.random() * 10000); }

    cseq = (method === ExSIP.C.CANCEL || method === ExSIP.C.ACK) ? this.local_seqnum : this.local_seqnum += 1;

    request = new ExSIP.OutgoingRequest(
      method,
      this.remote_target,
      this.session.ua, {
        'cseq': cseq,
        'call_id': this.id.call_id,
        'from_uri': this.local_uri,
        'from_tag': this.id.local_tag,
        'to_uri': this.remote_uri,
        'to_tag': this.id.remote_tag,
        'route_set': this.route_set
      }, extraHeaders);

    request.dialog = this;

    return request;
  },

  /**
  * @param {ExSIP.IncomingRequest} request
  * @returns {Boolean}
  */

  // RFC 3261 12.2.2
  checkInDialogRequest: function(request) {
    switch(request.method) {
      // RFC3261 14.2 Modifying an Existing Session -UAS BEHAVIOR-
      case ExSIP.C.INVITE:
        var retryAfter = (Math.random() * 10 | 0) + 1;
        if(request.cseq < this.remote_seqnum) {
          if(this.state === C.STATUS_EARLY) {
            request.reply(500, null, ['Retry-After:'+ retryAfter]);
          } else {
            request.reply(500);
          }
          return false;
        }
        // RFC3261 14.2
        if(this.state === C.STATUS_EARLY) {
          request.reply(491);
          return false;
        }
        if(this.type === 'UAS' && !this.is_acknowledged) {
          request.reply(500, null, ['Retry-After:'+ retryAfter]);
          return false;
        }
        // RFC3261 12.2.2 Replace the dialog`s remote target URI
        if(request.hasHeader('contact')) {
          this.remote_target = request.parseHeader('contact').uri;
        }
        break;
      case ExSIP.C.NOTIFY:
        // RFC6655 3.2 Replace the dialog`s remote target URI
        if(request.hasHeader('contact')) {
          this.remote_target = request.parseHeader('contact').uri;
        }
        break;
      case ExSIP.C.ACK:
        this.is_acknowledged = true;
        break;
    }

    if(!this.remote_seqnum) {
      this.remote_seqnum = request.cseq;
    } else if(request.method !== ExSIP.C.INVITE && request.cseq < this.remote_seqnum) {
        //Do not try to reply to an ACK request.
        if (request.method !== ExSIP.C.ACK) {
          request.reply(500);
        }
        return false;
    } else if(request.cseq > this.remote_seqnum) {
      this.remote_seqnum = request.cseq;
    }

    return true;
  },

  /**
  * @param {ExSIP.IncomingRequest} request
  */
  receiveRequest: function(request) {
    //Check in-dialog request
    if(!this.checkInDialogRequest(request)) {
      return;
    }

    this.session.receiveRequest(request);
  }
};

Dialog.C = C;
ExSIP.Dialog = Dialog;
}(ExSIP));




/**
 * @fileoverview Request Sender
 */

/**
 * @augments ExSIP
 * @class Class creating a request sender.
 * @param {Object} applicant
 * @param {ExSIP.UA} ua
 */
(function(ExSIP) {
var RequestSender,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'REQUEST SENDER');

RequestSender = function(applicant, ua) {
  this.ua = ua;
  this.applicant = applicant;
  this.method = applicant.request.method;
  this.request = applicant.request;
  this.credentials = null;
  this.challenged = false;
  this.staled = false;

  // If ua is in closing process or even closed just allow sending Bye and ACK
  if (ua.status === ExSIP.UA.C.STATUS_USER_CLOSED && (this.method !== ExSIP.C.BYE || this.method !== ExSIP.C.ACK)) {
    this.onTransportError();
  }
};

/**
* Create the client transaction and send the message.
*/
RequestSender.prototype = {
  send: function() {
    switch(this.method) {
      case "INVITE":
        this.clientTransaction = new ExSIP.Transactions.InviteClientTransaction(this, this.request, this.ua.transport);
        break;
      case "ACK":
        this.clientTransaction = new ExSIP.Transactions.AckClientTransaction(this, this.request, this.ua.transport);
        break;
      default:
        this.clientTransaction = new ExSIP.Transactions.NonInviteClientTransaction(this, this.request, this.ua.transport);
    }
    this.clientTransaction.send();
  },

  /**
  * Callback fired when receiving a request timeout error from the client transaction.
  * To be re-defined by the applicant.
  * @event
  */
  onRequestTimeout: function() {
    this.applicant.onRequestTimeout();
  },

  /**
  * Callback fired when receiving a transport error from the client transaction.
  * To be re-defined by the applicant.
  * @event
  */
  onTransportError: function() {
    this.applicant.onTransportError();
  },

  /**
  * Called from client transaction when receiving a correct response to the request.
  * Authenticate request if needed or pass the response back to the applicant.
  * @param {ExSIP.IncomingResponse} response
  */
  receiveResponse: function(response) {
    var cseq, challenge, authorization_header_name,
      status_code = response.status_code;

    /*
    * Authentication
    * Authenticate once. _challenged_ flag used to avoid infinite authentications.
    */
    if ((status_code === 401 || status_code === 407)) {

      // Get and parse the appropriate WWW-Authenticate or Proxy-Authenticate header.
      if (response.status_code === 401) {
        challenge = response.parseHeader('www-authenticate');
        authorization_header_name = 'authorization';
      } else {
        challenge = response.parseHeader('proxy-authenticate');
        authorization_header_name = 'proxy-authorization';
      }

      // Verify it seems a valid challenge.
      if (! challenge) {
        logger.warn(response.status_code + ' with wrong or missing challenge, cannot authenticate', this.ua);
        this.applicant.receiveResponse(response);
        return;
      }

      if (!this.challenged || (!this.staled && challenge.stale === true)) {
        if (!this.credentials) {
          this.credentials = new ExSIP.DigestAuthentication(this.ua);
        }

        // Verify that the challenge is really valid.
        if (!this.credentials.authenticate(this.request, challenge)) {
          this.applicant.receiveResponse(response);
          return;
        }
        this.challenged = true;

        if (challenge.stale) {
          this.staled = true;
        }

        if (response.method === ExSIP.C.REGISTER) {
          cseq = this.applicant.cseq += 1;
        } else if (this.request.dialog){
          cseq = this.request.dialog.local_seqnum += 1;
        } else {
          cseq = this.request.cseq + 1;
          this.request.cseq = cseq;
        }
        this.request.setHeader('cseq', cseq +' '+ this.method);

        this.request.setHeader(authorization_header_name, this.credentials.toString());
        this.send();
      } else {
        this.applicant.receiveResponse(response);
      }
    } else {
      this.applicant.receiveResponse(response);
    }
  }
};

ExSIP.RequestSender = RequestSender;
}(ExSIP));



/**
 * @fileoverview In-Dialog Request Sender
 */

/**
 * @augments ExSIP
 * @class Class creating an In-dialog request sender.
 * @param {Object} applicant
 */
/**
 * @fileoverview in-Dialog Request Sender
 */

(function(ExSIP) {
var InDialogRequestSender;

InDialogRequestSender = function(applicant) {
  this.applicant = applicant;
  this.request = applicant.request;
};

InDialogRequestSender.prototype = {
  send: function() {
    var request_sender = new ExSIP.RequestSender(this, this.applicant.session.ua);
    request_sender.send();
  },

  onRequestTimeout: function() {
    this.applicant.session.onRequestTimeout();
    this.applicant.onRequestTimeout();
  },

  onTransportError: function() {
    this.applicant.session.onTransportError();
    this.applicant.onTransportError();
  },

  receiveResponse: function(response) {
    // RFC3261 14.1. Terminate the dialog if a 408 or 481 is received from a re-Invite.
    if (response.status_code === 408 || response.status_code === 481) {
      this.applicant.session.ended('remote', response, ExSIP.C.causes.DIALOG_ERROR);
    }
    this.applicant.receiveResponse(response);
  }
};

ExSIP.InDialogRequestSender = InDialogRequestSender;
}(ExSIP));



/**
 * @fileoverview Registrator Agent
 */

/**
 * @augments ExSIP
 * @class Class creating a registrator agent.
 * @param {ExSIP.UA} ua
 * @param {ExSIP.Transport} transport
 */
(function(ExSIP) {
var Registrator,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'REGISTRATOR');

Registrator = function(ua, transport) {
  var reg_id=1; //Force reg_id to 1.

  this.ua = ua;
  this.transport = transport;

  this.registrar = ua.configuration.registrar_server;
  this.expires = ua.configuration.register_expires;

  // Call-ID and CSeq values RFC3261 10.2
  this.call_id = ExSIP.Utils.createRandomToken(22);
  this.cseq = 80;

  // this.to_uri
  this.to_uri = ua.configuration.uri;

  this.registrationTimer = null;

  // Set status
  this.registered = this.registered_before = false;

  // Save into ua instance
  this.ua.registrator = this;

  // Contact header
  this.contact = this.ua.contact.toString();

  if(reg_id) {
    this.contact += ';reg-id='+ reg_id;
    this.contact += ';+sip.instance="<urn:uuid:'+ this.ua.configuration.instance_id+'>"';
  }
};

Registrator.prototype = {
  /**
   * @param {Object} [options]
   */
  register: function(options) {
    var request_sender, cause, extraHeaders,
      self = this;

    options = options || {};
    extraHeaders = options.extraHeaders || [];
    extraHeaders.push('Contact: '+ this.contact + ';expires=' + this.expires);
    extraHeaders.push('Allow: '+ ExSIP.Utils.getAllowedMethods(this.ua));

    this.request = new ExSIP.OutgoingRequest(ExSIP.C.REGISTER, this.registrar, this.ua, {
        'to_uri': this.to_uri,
        'call_id': this.call_id,
        'cseq': (this.cseq += 1)
      }, extraHeaders);

    request_sender = new ExSIP.RequestSender(this, this.ua);

    /**
    * @private
    */
    this.receiveResponse = function(response) {
      var contact, expires,
        contacts = response.countHeader('contact');

      // Discard responses to older REGISTER/un-REGISTER requests.
      if(response.cseq !== this.cseq) {
        return;
      }

      // Clear registration timer
      if (this.registrationTimer !== null) {
        window.clearTimeout(this.registrationTimer);
        this.registrationTimer = null;
      }

      switch(true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          // Ignore provisional responses.
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          if(response.hasHeader('expires')) {
            expires = response.getHeader('expires');
          }

          // Search the Contact pointing to us and update the expires value accordingly.
          if (!contacts) {
            logger.warn('no Contact header in response to REGISTER, response ignored', this.ua);
            break;
          }

          while(contacts--) {
            contact = response.parseHeader('contact', contacts);
            if(contact.uri.user === this.ua.contact.uri.user) {
              expires = contact.getParam('expires');
              break;
            } else {
              contact = null;
            }
          }

          if (!contact) {
            logger.warn('no Contact header pointing to us, response ignored', this.ua);
            break;
          }

          if(!expires) {
            expires = this.expires;
          }

          // Re-Register before the expiration interval has elapsed.
          // For that, decrease the expires value. ie: 3 seconds
          this.registrationTimer = window.setTimeout(function() {
            self.registrationTimer = null;
            self.register();
          }, (expires * 1000) - 3000);

          //Save gruu values
          if (contact.hasParam('temp-gruu')) {
            this.ua.contact.temp_gruu = contact.getParam('temp-gruu').replace(/"/g,'');
          }
          if (contact.hasParam('pub-gruu')) {
            this.ua.contact.pub_gruu = contact.getParam('pub-gruu').replace(/"/g,'');
          }

          this.registered = true;
          this.ua.emit('registered', this.ua, {
            response: response
          });
          break;
        // Interval too brief RFC3261 10.2.8
        case /^423$/.test(response.status_code):
          if(response.hasHeader('min-expires')) {
            // Increase our registration interval to the suggested minimum
            this.expires = response.getHeader('min-expires');
            // Attempt the registration again immediately 
            this.register();
          } else { //This response MUST contain a Min-Expires header field
            logger.warn('423 response received for REGISTER without Min-Expires', this.ua);
            this.registrationFailure(response, ExSIP.C.causes.SIP_FAILURE_CODE);
          }
          break;
        default:
          cause = ExSIP.Utils.sipErrorCause(response.status_code);
          this.registrationFailure(response, cause);
      }
    };

    /**
    * @private
    */
    this.onRequestTimeout = function() {
      this.registrationFailure(null, ExSIP.C.causes.REQUEST_TIMEOUT);
    };

    /**
    * @private
    */
    this.onTransportError = function() {
      this.registrationFailure(null, ExSIP.C.causes.CONNECTION_ERROR);
    };

    request_sender.send();
  },

  /**
  * @param {Object} [options]
  */
  unregister: function(options) {
    var extraHeaders;

    if(!this.registered) {
      logger.warn('already unregistered', this.ua);
      return;
    }

    options = options || {};
    extraHeaders = options.extraHeaders || [];

    this.registered = false;

    // Clear the registration timer.
    if (this.registrationTimer !== null) {
      window.clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
    }

    if(options.all) {
      extraHeaders.push('Contact: *');
      extraHeaders.push('Expires: 0');

      this.request = new ExSIP.OutgoingRequest(ExSIP.C.REGISTER, this.registrar, this.ua, {
          'to_uri': this.to_uri,
          'call_id': this.call_id,
          'cseq': (this.cseq += 1)
        }, extraHeaders);
    } else {
      extraHeaders.push('Contact: '+ this.contact + ';expires=0');

      this.request = new ExSIP.OutgoingRequest(ExSIP.C.REGISTER, this.registrar, this.ua, {
          'to_uri': this.to_uri,
          'call_id': this.call_id,
          'cseq': (this.cseq += 1)
        }, extraHeaders);
    }

    var request_sender = new ExSIP.RequestSender(this, this.ua);

    /**
    * @private
    */
    this.receiveResponse = function(response) {
      var cause;

      switch(true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          // Ignore provisional responses.
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          this.unregistered(response);
          break;
        default:
          cause = ExSIP.Utils.sipErrorCause(response.status_code);
          this.unregistered(response, cause);
      }
    };

    /**
    * @private
    */
    this.onRequestTimeout = function() {
      this.unregistered(null, ExSIP.C.causes.REQUEST_TIMEOUT);
    };

    /**
    * @private
    */
    this.onTransportError = function() {
      this.unregistered(null, ExSIP.C.causes.CONNECTION_ERROR);
    };

    request_sender.send();
  },

  /**
  * @private
  */
  registrationFailure: function(response, cause) {
    this.ua.emit('registrationFailed', this.ua, {
      response: response || null,
      cause: cause
    });

    if (this.registered) {
      this.registered = false;
      this.ua.emit('unregistered', this.ua, {
        response: response || null,
        cause: cause
      });
    }
  },

  /**
   * @private
   */
  unregistered: function(response, cause) {
    this.registered = false;
    this.ua.emit('unregistered', this.ua, {
      response: response || null,
      cause: cause || null
    });
  },

  /**
  * @private
  */
  onTransportClosed: function() {
    this.registered_before = this.registered;
    if (this.registrationTimer !== null) {
      window.clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
    }

    if(this.registered) {
      this.registered = false;
      this.ua.emit('unregistered', this.ua);
    }
  },

  /**
  * @private
  */
  onTransportConnected: function() {
    this.register();
  },

  /**
  * @private
  */
  close: function() {
    this.registered_before = this.registered;
    this.unregister();
  }
};

ExSIP.Registrator = Registrator;
}(ExSIP));


/**
 * @fileoverview Session
 */

/**
 * @augments ExSIP
 * @class Invite Session
 */
(function(ExSIP) {

// Load dependencies
  var RequestSender   = /**
 * @fileoverview RequestSender
 */

/**
 * @class Session RequestSender
 * @param {ExSIP.RTCSession | RTCSession applicant} applicant
 * @param {ExSIP.OutgoingRequest} [request]
 */
(function(ExSIP){

var RequestSender = function(applicant, request, callbacks) {
  this.applicant = applicant;
  this.request = request || applicant.request;
  this.session = (applicant instanceof ExSIP.RTCSession)? applicant : applicant.session;
  this.reattempt = false;
  this.reatemptTimer = null;
  this.callbacks = callbacks || {};
  this.request_sender = new ExSIP.InDialogRequestSender(this);
};

RequestSender.prototype = {
  receiveResponse: function(response) {
    var
      self = this,
      status_code = response.status_code;

    if (response.method === ExSIP.C.INVITE && status_code === 491) {
      if (!this.reattempt) {
        this.request.cseq.value = this.request.dialog.local_seqnum += 1;
        this.reatemptTimer = window.setTimeout(
          function() {
            if (self.session.status !== ExSIP.RTCSession.C.STATUS_TERMINATED) {
              self.reattempt = true;
              self.request_sender.send();
            }
          },
          this.getReattemptTimeout()
        );
      } else {
        this.applicant.receiveResponse(response, this.callbacks);
      }
    } else {
      this.applicant.receiveResponse(response, this.callbacks);
      if(response.status_code >= 200 && response.status_code < 299) {
        if(this.callbacks["success"]) {
          this.callbacks["success"]();
        }
      } else if(response.status_code >= 400) {
        if(this.callbacks["failure"]) {
          this.callbacks["failure"]();
        }
      }
    }
  },

  send: function() {
    this.request_sender.send();
  },

  onRequestTimeout: function() {
    this.applicant.onRequestTimeout();
  },

  onTransportError: function() {
    this.applicant.onTransportError();
  },

  // RFC3261 14.1
  getReattemptTimeout: function() {
    if(this.session.direction === 'outgoing') {
      return (Math.random() * (4 - 2.1) + 2.1).toFixed(2);
    } else {
      return (Math.random() * 2).toFixed(2);
    }
  }
};

return RequestSender;
}(ExSIP));

  var RTCMediaHandler = /**
 * @fileoverview RTCMediaHandler
 */

/* RTCMediaHandler
 * @class PeerConnection helper Class.
 * @param {ExSIP.RTCSession} session
 * @param {Object} [contraints]
 */
(function(ExSIP){

  var logger = new ExSIP.Logger(ExSIP.name +' | '+ 'RTCMediaHandler');

var RTCMediaHandler = function(session, constraints) {
  constraints = constraints || {};
  logger.log('constraints : '+ExSIP.Utils.toString(constraints), session.ua);

  this.session = session;
  this.localMedia = null;
  this.peerConnection = null;
  this.createOfferConstraints = null;
  this.dataChannel = null;

  this.init(constraints);
};

RTCMediaHandler.prototype = {

  copy: function(rtcMediaHandler) {
    var self = this;

    var streamAdditionSucceeded = function() {
    };
    var streamAdditionFailed = function() {
      if (self.session.status === C.STATUS_TERMINATED) {
        return;
      }

      self.session.failed('local', null, ExSIP.C.causes.WEBRTC_ERROR);
    };

    var description = new ExSIP.WebRTC.RTCSessionDescription({type: this.getSetLocalDescriptionType(), sdp: rtcMediaHandler.peerConnection.localDescription.sdp});
    this.setLocalDescription(description);

    this.addStream(rtcMediaHandler.localMedia, streamAdditionSucceeded, streamAdditionFailed);
  },

  connect: function(stream, connectSucceeded, connectFailed, options) {
    var self = this;
    options = options || {};
    logger.log('connect with isAnswer : '+options.isAnswer+" and remoteSdp : "+options.remoteSdp, self.session.ua);

    var setLocalDescription = function(callback) {
      self.setLocalDescription(options.localDescription, callback || connectSucceeded, connectFailed);
    };

    var setRemoteDescription = function(successCallback) {
      self.onMessage(
        options.remoteSdp,
        successCallback || connectSucceeded, function(e){
          logger.error("setRemoteDescription failed");
          logger.error(ExSIP.Utils.toString(e));
          connectFailed();
        }
      );
    };

    var createAnswer = function(){
      self.createAnswer(connectSucceeded, connectFailed, options.mediaConstraints);
    };

    var createOffer = function(){
      self.createOffer(function(sdp){
        if(options.remoteSdp && options.remoteSdp !== "") {
          setRemoteDescription(connectSucceeded);
        } else {
          connectSucceeded(sdp);
        }
      }, connectFailed, options);
    };

    var streamAdditionSucceeded = function() {
      var hasRemoteSdp = options.remoteSdp && options.remoteSdp.length > 0;
      var isRemote = options.isAnswer && hasRemoteSdp;
      logger.log("isRemote : "+isRemote+", isAnswer : "+options.isAnswer+", hasRemoteSdp :"+hasRemoteSdp, self.session.ua);
      if(isRemote) {
        if(options.localDescription) {
          setRemoteDescription(setLocalDescription);
        } else {
          setRemoteDescription(createAnswer);
        }
      } else {
        if(options.remoteSdp) {
          setLocalDescription(setRemoteDescription);
        } else {
          createOffer();
        }
      }
    };

    var streamAdditionFailed = function() {
      if (self.session.status === C.STATUS_TERMINATED) {
        return;
      }

      self.session.failed('local', null, ExSIP.C.causes.WEBRTC_ERROR);
      connectFailed();
    };

    this.addStream(
      stream,
      streamAdditionSucceeded,
      streamAdditionFailed
    );
  },

  createOffer: function(onSuccess, onFailure, options) {
    var self = this;
    options = options || {};

    this.onIceCompleted = function() {
      logger.log('createOffer : onIceCompleted', self.session.ua);
      if (self.peerConnection.localDescription) {
        onSuccess(self.peerConnection.localDescription.sdp);
      }
    };

    this.createOfferConstraints = options.createOfferConstraints;
    logger.log("createOffer with createOfferConstraints : "+ExSIP.Utils.toString(this.createOfferConstraints), this.session.ua);
    this.peerConnection.createOffer(
      function(sessionDescription){
        if(options.videoMode) {
          sessionDescription.setVideoMode(options.videoMode);
        }
        if(options.videoPort) {
          sessionDescription.setVideoPort(options.videoPort);
        }
        if(options.audioMode) {
          sessionDescription.setAudioMode(options.audioMode);
        }
        if(options.audioPort) {
          sessionDescription.setAudioPort(options.audioPort);
        }
        self.setLocalDescription(
          sessionDescription,
          function(){
            if(!sessionDescription.isActive()) {
              onSuccess(self.peerConnection.localDescription.sdp);
            }
          },
          onFailure
        );
      },
      function(e) {
        logger.error('unable to create offer');
        logger.error(e);
        onFailure(e);
      },
      this.createOfferConstraints);
  },

  createAnswer: function(onSuccess, onFailure, constraints) {
    var self = this;

    this.onIceCompleted = function() {
      logger.log('createAnswer : onIceCompleted', self.session.ua);
      onSuccess(self.peerConnection.localDescription.sdp);
    };

    constraints = constraints ||  this.createOfferConstraints;
    logger.log("createAnswer with constraints : "+constraints, this.session.ua);
    this.peerConnection.createAnswer(
      function(sessionDescription){
        self.setLocalDescription(
          sessionDescription,
          function(){
            if(!sessionDescription.isActive()) {
              onSuccess(self.peerConnection.localDescription.sdp);
            }
          },
          onFailure
        );
      },
      function(e) {
        logger.error('unable to create answer');
        logger.error(e);
        onFailure(e);
      },
      constraints);
  },

  getRemoteDescriptionSdp: function() {
    return this.peerConnection.remoteDescription ? this.peerConnection.remoteDescription.sdp : undefined;
  },

  setLocalDescription: function(sessionDescription, onSuccess, onFailure) {
    var self = this;
    sessionDescription.type = this.getSetLocalDescriptionType();
    logger.log('peerConnection.setLocalDescription with type '+sessionDescription.type +' : '+sessionDescription.sdp, this.session.ua);
    this.peerConnection.setLocalDescription(
      sessionDescription,
      function(){
        logger.log('setLocalDescription successful', self.session.ua);
        if(onSuccess) {
          onSuccess();
        }
      },
      function(e) {
        logger.error('unable to set local description', self.session.ua);
        logger.error(e);
        onFailure();
      }
    );
  },

  addStream: function(stream, onSuccess, onFailure, constraints) {
    try {
      logger.log("add stream : "+ExSIP.Utils.toString(stream), this.session.ua);
      this.peerConnection.addStream(stream, constraints);
    } catch(e) {
      logger.error('error adding stream');
      logger.error(e);
      onFailure(e);
      return;
    }

    onSuccess();
  },

  clearStreams: function() {
    if(!this.localMedia) {
      return;
    }
    if(this.removeStream(this.localMedia)) {
      this.localMedia = null;
    }
    return;
  },

  removeStream: function(stream) {
    try {
      logger.log("remove stream : "+ExSIP.Utils.toString(stream), this.session.ua);
      this.peerConnection.removeStream(stream);
    } catch(e) {
      logger.error('error removing stream');
      logger.error(e);
      return false;
    }

    return true;
  },

  /**
  * peerConnection creation.
  * @param {Function} onSuccess Fired when there are no more ICE candidates
  */
  init: function(constraints) {
    var idx, length, server, scheme, url,
      self = this,
      servers = [],
      config = this.session.ua.configuration;

    length = config.stun_servers.length;
    for (idx = 0; idx < length; idx++) {
      server = config.stun_servers[idx];
      servers.push({'url': server});
    }

    length = config.turn_servers.length;
    for (idx = 0; idx < length; idx++) {
      server = config.turn_servers[idx];
      url = server.server;
      scheme = url.substr(0, url.indexOf(':'));
      servers.push({
        'url': scheme + ':' + server.username + '@' + url.substr(scheme.length+1),
        'credential': server.password
      });
    }

    logger.log("servers : "+ExSIP.Utils.toString(servers), this.session.ua);
    this.peerConnection = new ExSIP.WebRTC.RTCPeerConnection({'iceServers': servers}, constraints);

    this.peerConnection.onaddstream = function(e) {
      logger.log('stream added: '+ e.stream.id, self.session.ua);
    };

    this.peerConnection.onremovestream = function(e) {
      logger.log('stream removed: '+ e.stream.id, self.session.ua);
    };

    this.peerConnection.oniceconnectionstatechange = function() {
      logger.log('oniceconnectionstatechange : '+ this.iceConnectionState, self.session.ua);
      if(this.iceConnectionState === 'connected') {
        self.session.iceConnected();
      }
      else if(this.iceConnectionState === 'completed') {
        self.session.iceCompleted();
      }
      else if(this.iceConnectionState === 'closed') {
        self.session.iceClosed();
      }
    };

    this.peerConnection.onnegotiationneeded = function(e) {
      logger.log('onnegotiationneeded : '+ e.type, self.session.ua);
    };

    this.peerConnection.onsignalingstatechange = function() {
      logger.log('onsignalingstatechange : '+ this.signalingState, self.session.ua);
    };

    this.setOnIceCandidateCallback();

    // To be deprecated as per https://code.google.com/p/webrtc/issues/detail?id=1393
    this.peerConnection.ongatheringchange = function(e) {
      var state = (typeof e === 'string' || e instanceof String) ? e : e.currentTarget.iceGatheringState;
      logger.log('ongatheringchange for state : '+ state+'"', self.session.ua);
      if (state === 'complete' && this.iceConnectionState !== 'closed' && self.onIceCompleted !== undefined) {
        self.onIceCompleted();
      }
    };

    this.peerConnection.onicechange = function() {
      logger.log('ICE connection state changed to "'+ this.iceConnectionState +'"', self.session.ua);
    };

    this.peerConnection.onstatechange = function() {
      logger.log('PeerConnection state changed to "'+ this.readyState +'"', self.session.ua);
    };

    if(self.session.ua.configuration.enable_datachannel) {
      this.dataChannel = new DataChannel(this.session, this.peerConnection);
    }
  },

  getSetLocalDescriptionType: function(){
    var state = this.peerConnection.signalingState;
    if(state === 'stable' || state === 'have-local-offer') {
      return "offer";
    } else if(state === 'have-remote-offer' || state === 'have-local-pr-answer'){
      return "answer";
    } else {
      logger.error("state "+state +" not implemented - returning offer");
      return "offer";
    }
  },

  getSetRemoteLocationType: function(){
    var state = this.peerConnection.signalingState;
    if(state === 'stable' || state === 'have-remote-offer') {
      return "offer";
    } else if(state === 'have-local-offer' || state === 'have-remote-pr-answer'){
      return "answer";
    } else {
      logger.error("state "+state +" not implemented - returning offer");
      return "offer";
    }
  },

  setOnIceCandidateCallback: function(){
    var sent = false, self = this;
    this.peerConnection.onicecandidate = function(e) {
      if (e.candidate && self.session.ua.rtcMediaHandlerOptions["enableICE"]) {
        logger.log('ICE candidate received: '+ e.candidate.candidate, self.session.ua);
      } else if (self.onIceCompleted !== undefined) {
//        if(e.candidate) {
//          self.peerConnection.addIceCandidate(new ExSIP.WebRTC.RTCIceCandidate(e.candidate));
//        }
        logger.log('onIceCompleted with sent : '+ sent+" and candidate : "+ExSIP.Utils.toString(e.candidate), self.session.ua);
//        if(!sent && e.srcElement.iceGatheringState === 'complete') {
        // trigger if e.candidate is not null or in FF is null
        if(!sent && self.peerConnection.isIceCandidateReady(e.candidate)) {
          sent = true;
          self.onIceCompleted();
        }
      }
    };
  },

  sendData: function(data) {
    if(this.dataChannel) {
      this.dataChannel.send(data);
    } else {
      logger.error('datachannel is not enabled - see UA.configuration.enable_datachannel');
    }
  },

  close: function(stopLocalMedia) {
    logger.log('close with stopLocalMedia '+stopLocalMedia, this.session.ua);
    if(this.peerConnection) {
      if(this.peerConnection.signalingState !== 'closed') {
        logger.log('closing PeerConnection', this.session.ua);
        this.peerConnection.close();
      }

      if(stopLocalMedia) {
        if(this.localMedia) {
          logger.log('stopping local media '+ExSIP.Utils.toString(this.localMedia), this.session.ua);
          this.localMedia.stop();
        }
      }
    }
  },

  /**
  * @param {Object} mediaConstraints
  * @param {Function} onSuccess
  * @param {Function} onFailure
  */
  getUserMedia: function(onSuccess, onFailure, constraints) {
    var self = this;

    logger.log('requesting access to local media', this.session.ua);

    ExSIP.WebRTC.getUserMedia(constraints,
      function(stream) {
        logger.log('got local media stream', self.session.ua);
        self.localMedia = stream;
        onSuccess(stream);
      },
      function(e) {
        logger.error('unable to get user media');
        logger.error(e);
        onFailure(e);
      }
    );
  },

  /**
  * Message reception.
  * @param {String} type
  * @param {String} sdp
  * @param {Function} onSuccess
  * @param {Function} onFailure
  */
  onMessage: function(body, onSuccess, onFailure) {
    var description = new ExSIP.WebRTC.RTCSessionDescription({type: this.getSetRemoteLocationType(), sdp:body});
    if(this.session.ua.rtcMediaHandlerOptions["videoBandwidth"]) {
      description.setVideoBandwidth(this.session.ua.rtcMediaHandlerOptions["videoBandwidth"]);
      logger.log("Modifying SDP with videoBandwidth : "+this.session.ua.rtcMediaHandlerOptions["videoBandwidth"], this.session.ua);
    }

//    description.sdp = "v=0\r\n"+
//      "o=mscore 1384795821 1 IN IP4 204.117.64.113\r\n"+
//    "s=d4q5no0ml0fhj4h685ur\r\n"+
//    "t=0 0\r\n"+
//    "m=audio 44476 RTP/SAVPF 111 126\r\n"+
//    "c=IN IP4 204.117.64.113\r\n"+
//    "a=rtpmap:111 opus/48000/2\r\n"+
//    "a=rtpmap:126 telephone-event/8000\r\n"+
//    "a=fmtp:111 minptime=10\r\n"+
//    "a=rtcp-mux\r\n"+
//    "a=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:iYtsHDIl+1uXQV91p04VNy/PjJk2bQ2H6lqXVlXI\r\n"+
//    "a=ice-ufrag:oHazMhXZ4VvxTk5r\r\n"+
//    "a=ice-pwd:zCO3DbLuyVpPiFodARvjgUa7\r\n"+
//    "a=ssrc:4282715684 cname:qavdWNEl8g4zsfjY\r\n"+
//    "a=candidate:0 1 udp 2113929216 204.117.64.113 44476 typ host\r\n";
//
    if(this.peerConnection) {
      // if(this.peerConnection.remoteDescription) {
      //   logger.log('remote description already exists', this.session.ua);
      //   onSuccess();
      //   return;
      // }
      if(!description.sdp) {
        logger.log('empty sdp on setRemoteDescription - calling success', this.session.ua);
        onSuccess();
        return;
      }

      var unsupportedMedia = description.removeUnsupportedMedia();
      if(unsupportedMedia) {
        logger.log('removed unsupported media : '+unsupportedMedia);
        this.peerConnection.remoteUnsupportedMedia = unsupportedMedia;
      }
      logger.log('peerConnection.setRemoteDescription for type '+description.type+' : '+description.sdp, this.session.ua);
      this.peerConnection.setRemoteDescription(
        description,
        onSuccess,
        function(e){
          console.log("----------setRemoteDescription with error : "+JSON.stringify(e));
          onFailure(e);
        }
      );
    }
  }
};

// Return since it will be assigned to a variable.
return RTCMediaHandler;
}(ExSIP));

  var DTMF            = /**
 * @fileoverview DTMF
 */

/**
 * @class DTMF
 * @param {ExSIP.RTCSession} session
 */
(function(ExSIP) {

var DTMF,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'DTMF'),
  C = {
    MIN_DURATION:            70,
    MAX_DURATION:            6000,
    DEFAULT_DURATION:        100,
    MIN_INTER_TONE_GAP:      50,
    DEFAULT_INTER_TONE_GAP:  500
  };

DTMF = function(session) {
  var events = [
  'succeeded',
  'failed'
  ];

  this.sendTimeoutId = null;
  this.queuedDTMFs = [];
  this.session = session;
  this.direction = null;
  this.tone = null;
  this.duration = null;
  this.interToneGap = null;
  this.dtmfSender = null;

  this.initEvents(events);
};
DTMF.prototype = new ExSIP.EventEmitter();

DTMF.prototype.isDebug = function() {
  return this.session.ua.isDebug();
};

DTMF.prototype.send = function(tone, options) {
  var event, eventHandlers, extraHeaders;

  if (tone === undefined) {
    throw new TypeError('Not enough arguments');
  }

  this.direction = 'outgoing';

  // Check RTCSession Status
  if (this.session.status !== ExSIP.RTCSession.C.STATUS_CONFIRMED && this.session.status !== ExSIP.RTCSession.C.STATUS_WAITING_FOR_ACK) {
    throw new ExSIP.Exceptions.InvalidStateError(this.session.status);
  }

  // Get DTMF options
  options = options || {};
  extraHeaders = options.extraHeaders ? options.extraHeaders.slice() : [];
  eventHandlers = options.eventHandlers || {};

  // Check tone type
  if (typeof tone === 'string' ) {
    tone = tone.toUpperCase();
  } else if (typeof tone === 'number') {
    tone = tone.toString();
  } else {
    throw new TypeError('Invalid tone: '+ tone);
  }

  // Check tone value
  if (!tone.match(/^[0-9A-D#*,]+$/i)) {
    throw new TypeError('Invalid tone: '+ tone);
  } else {
    this.tone = tone;
  }

  // Set event handlers
  for (event in eventHandlers) {
    this.on(event, eventHandlers[event]);
  }

  this.queueTone(this.tone, options.duration, options.interToneGap);
};

DTMF.prototype.processQueuedDTMFs = function() {
  var self = this;
  if(this.queuedDTMFs.length === 0) {
    return;
  }
  if(!this.dtmfSender.canInsertDTMF) {
    logger.log("DTMF Sender cannot insert DTMF - trying again after timeout", this.session.ua);
    this.sendTimeoutId = window.setTimeout(function(){
      self.processQueuedDTMFs();
    }, 1000);
    return;
  }
  var tones = "";
  var durationSum = 0;
  var interToneGapSum = 0;
  for(var i=0; i < this.queuedDTMFs.length; i++) {
    var dtmf = this.queuedDTMFs[i];
    tones += dtmf.tone;
    durationSum += dtmf.duration;
    interToneGapSum += dtmf.interToneGap;
  }
  var duration = durationSum / this.queuedDTMFs.length;
  var interToneGap = interToneGapSum / this.queuedDTMFs.length;

  logger.log("sending DTMF with tones "+tones+", duration "+duration+", gap "+interToneGap, this.session.ua);
  this.dtmfSender.insertDTMF(tones, duration, interToneGap);
};

DTMF.prototype.queueTone = function(tone, duration, interToneGap) {
  logger.log("Queue tone : "+tone, this.session.ua);
  window.clearTimeout(this.sendTimeoutId);
  this.queuedDTMFs.push({tone: tone, duration: duration, interToneGap: interToneGap});
  var self = this;
  this.sendTimeoutId = window.setTimeout(function(){
    self.processQueuedDTMFs();
  }, 2 * duration);
};

DTMF.prototype.onDTMFSent = function(tone) {
  if (!tone) {
    return;
  }

  logger.log("Sent Dtmf tone: " + tone.tone, this.session.ua);
  for(var i=0; i < this.queuedDTMFs.length; i++) {
    var dtmf = this.queuedDTMFs[i];
    if(tone.tone === dtmf.tone) {
      this.queuedDTMFs.splice(i, 1);
      logger.log("removing from queued tones - remaining queue: \t" + ExSIP.Utils.toString(this.queuedDTMFs), this.session.ua);
      break;
    } else if(dtmf.tone.indexOf(tone.tone) !== -1) {
      dtmf.tone = dtmf.tone.replace(tone.tone, '');
      this.queuedDTMFs[i] = dtmf;
      logger.log("removing from queued tones as contained - remaining queue: \t" + ExSIP.Utils.toString(this.queuedDTMFs), this.session.ua);
      break;
    }
  }
  this.session.emit('newDTMF', this.session, {
    originator: 'local',
    dtmf: this,
    tone: tone.tone
  });
};

DTMF.prototype.enableDtmfSender = function(localstream, peerConnection) {
  var self = this;
  if (localstream != null) {
    var local_audio_track = localstream.getAudioTracks()[0];
    this.dtmfSender = peerConnection.createDTMFSender(local_audio_track);
    logger.log("Created DTMF Sender with canInsertDTMF : "+this.dtmfSender.canInsertDTMF, this.session.ua);

    this.dtmfSender.ontonechange = function(tone) {
      self.onDTMFSent(tone);
    };

    this.processQueuedDTMFs();
  }
  else {
    logger.error("No Local Stream to create DTMF Sender");
  }
};

/**
* @private
*/
DTMF.prototype.receiveResponse = function(response) {
  var cause;

  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      // Ignore provisional responses.
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      this.emit('succeeded', this, {
        originator: 'remote',
        response: response
      });
      break;

    default:
      cause = ExSIP.Utils.sipErrorCause(response.status_code);
      this.emit('failed', this, {
        originator: 'remote',
        response: response,
        cause: cause
      });
      break;
  }
};

/**
 * @private
 */
DTMF.prototype.onRequestTimeout = function() {
  this.emit('failed', this, {
    originator: 'system',
    cause: ExSIP.C.causes.REQUEST_TIMEOUT
  });
};

/**
 * @private
 */
DTMF.prototype.onTransportError = function() {
  this.emit('failed', this, {
    originator: 'system',
    cause: ExSIP.C.causes.CONNECTION_ERROR
  });
};

/**
 * @private
 */
DTMF.prototype.init_incoming = function(request) {
  var body,
    reg_tone = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/,
    reg_duration = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;

  this.direction = 'incoming';
  this.request = request;

  request.reply(200);

  if (request.body) {
    body = request.body.split('\r\n');
    if (body.length === 2) {
      if (reg_tone.test(body[0])) {
        this.tone = body[0].replace(reg_tone,"$2");
      }
      if (reg_duration.test(body[1])) {
        this.duration = parseInt(body[1].replace(reg_duration,"$2"), 10);
      }
    }
  }

  if (!this.tone || !this.duration) {
    logger.warn('invalid INFO DTMF received, discarded', this.session.ua);
  } else {
    this.session.emit('newDTMF', this.session, {
      originator: 'remote',
      dtmf: this,
      request: request
    });
  }
};

DTMF.C = C;
return DTMF;
}(ExSIP));

  var DataChannel     = /**
 * @fileoverview DataChannel
 */

/**
 * @class DataChannel
 * @param {ExSIP.RTCSession} session
 */
(function(ExSIP) {

var DataChannel,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'DataChannel');

DataChannel = function(session, peerConnection) {
  var events = [
  'received',
  'sent',
  'failed'
  ];

  this.session = session;
  this.peerConnection = peerConnection;
  this.sendChannel = null;
  this.receiveChannel = null;
  this.chunkLength = 60000;
  this.dataReceived = [];

  this.initEvents(events);

  this.initSendChannel();
};
DataChannel.prototype = new ExSIP.EventEmitter();

DataChannel.prototype.isDebug = function() {
  return this.session.ua.isDebug();
};

DataChannel.prototype.close = function() {
  if(this.sendChannel) {
    this.sendChannel.close();
  }
  if(this.receiveChannel) {
    this.receiveChannel.close();
  }
};

DataChannel.prototype.send = function(data) {
  this.sendInChunks(data);
  logger.log('Sent Data: ' + data, this.session.ua);
  this.session.emit('dataSent', this, { data: data });
};

DataChannel.prototype.sendInChunks = function(data) {
  var text = null, last = false, self = this;
  if (data.length > this.chunkLength) {
    text = data.slice(0, this.chunkLength); // getting chunk using predefined chunk length
  } else {
    text = data;
    last = true;
  }

  this.sendChannel.send(text + (last ? "\n" : "")); // use JSON.stringify for chrome!

  if (!last) {
    var remainingDataURL = data.slice(text.length);
    window.setTimeout(function () {
      self.sendInChunks(remainingDataURL); // continue transmitting
    }, 50);
  }
};

DataChannel.prototype.initSendChannel = function() {
  try {
    var self = this;
    // Data Channel api supported from Chrome M25.
    // You might need to start chrome with  --enable-data-channels flag.
    this.sendChannel = this.peerConnection.createDataChannel("sendDataChannel", null);
    logger.log('Created send data channel', this.session.ua);

    var onSendChannelStateChange = function() {
      var readyState = self.sendChannel.readyState;
      logger.log('Send channel state is: ' + readyState, self.session.ua);
    };

    this.sendChannel.onopen = onSendChannelStateChange;
    this.sendChannel.onclose = onSendChannelStateChange;

    var receiveChannelCallback = function(event) {
      logger.log('Receive Channel Callback', self.session.ua);
      self.receiveChannel = event.channel;

      var onReceiveChannelStateChange = function() {
        var readyState = self.receiveChannel.readyState;
        logger.log('Receive channel state is: ' + readyState, self.session.ua);
      };

      var onReceiveMessageCallback = function(event) {
        logger.log('Received Message : '+event.data, self.session.ua);

        if(event.data.indexOf('\n') !== -1) {
          self.dataReceived.push(event.data.replace('\n', ''));
          var data = self.dataReceived.join('');
          self.dataReceived = [];
          self.session.emit('dataReceived', self, { data: data });
        } else {
          self.dataReceived.push(event.data);
        }
      };

      self.receiveChannel.onmessage = onReceiveMessageCallback;
      self.receiveChannel.onopen = onReceiveChannelStateChange;
      self.receiveChannel.onclose = onReceiveChannelStateChange;
    };

    this.peerConnection.ondatachannel = receiveChannelCallback;
  } catch (e) {
    this.emit('failed', this, {
      cause: 'Failed to create data channel'
    });
    logger.error('Create Data channel failed with exception: ' + e.message);
  }
};

  return DataChannel;
}(ExSIP));


  var RTCSession,
    logger = new ExSIP.Logger(ExSIP.name +' | '+ 'RTC SESSION'),
    C = {
      // RTCSession states
      STATUS_NULL:               0,
      STATUS_INVITE_SENT:        1,
      STATUS_1XX_RECEIVED:       2,
      STATUS_INVITE_RECEIVED:    3,
      STATUS_WAITING_FOR_ANSWER: 4,
      STATUS_ANSWERED:           5,
      STATUS_WAITING_FOR_ACK:    6,
      STATUS_CANCELED:           7,
      STATUS_TERMINATED:         8,
      STATUS_CONFIRMED:          9,
      STATUS_REFER_SENT:         10,
      STATUS_BYE_SENT:           11
    };


  RTCSession = function(ua) {
    var events = [
      'progress',
      'failed',
      'started',
      'ended',
      'held',
      'resumed',
      'newDTMF',
      'dataSent',
      'dataReceived',
      'iceconnected',
      'icecompleted',
      'iceclosed'
    ];

    this.ua = ua;
    this.status = C.STATUS_NULL;
    this.dialog = null;
    this.earlyDialogs = {};
    this.rtcMediaHandler = null;
    this.isOnHold = false;
    this.initialRemoteSdp = null;

    // Session Timers
    this.timers = {
      ackTimer: null,
      expiresTimer: null,
      invite2xxTimer: null,
      userNoAnswerTimer: null
    };

    // Session info
    this.direction = null;
    this.local_identity = null;
    this.remote_identity = null;
    this.start_time = null;
    this.end_time = null;

    // Custom session empty object for high level use
    this.data = {};
    this.dtmf = new DTMF(this);

    this.initEvents(events);
  };
  RTCSession.prototype = new ExSIP.EventEmitter();

  RTCSession.prototype.isDebug = function() {
    return this.ua.isDebug();
  };

  /**
   * User API
   */

  RTCSession.prototype.initRtcMediaHandler = function(options) {
    options = options || {};
    this.rtcMediaHandler = new RTCMediaHandler(this, options.RTCConstraints || this.ua.rtcConstraints() || {"optional": [{'DtlsSrtpKeyAgreement': 'true'}]});
    if(options["copy"]) {
      this.rtcMediaHandler.copy(options["copy"]);
    }
  };

  /**
   * Terminate the call.
   * @param {Object} [options]
   */
  RTCSession.prototype.terminate = function(options) {
    options = options || {};

    var cancel_reason,
      status_code = options.status_code,
      reason_phrase = options.reason_phrase,
      extraHeaders = options.extraHeaders || [],
      body = options.body;

    // Check Session Status
    if (this.status === C.STATUS_TERMINATED) {
      throw new ExSIP.Exceptions.InvalidStateError(this.status);
    }

    logger.log('terminate with status : ' + this.status, this.ua);

    switch(this.status) {
      // - UAC -
      case C.STATUS_NULL:
      case C.STATUS_INVITE_SENT:
      case C.STATUS_1XX_RECEIVED:
        logger.log('canceling RTCSession', this.ua);

        if (status_code && (status_code < 200 || status_code >= 700)) {
          throw new TypeError('Invalid status_code: '+ status_code);
        } else if (status_code) {
          reason_phrase = reason_phrase || ExSIP.C.REASON_PHRASE[status_code] || '';
          cancel_reason = 'SIP ;cause=' + status_code + ' ;text="' + reason_phrase + '"';
        }

        // Check Session Status
        if (this.status === C.STATUS_NULL) {
          this.isCanceled = true;
          this.cancelReason = cancel_reason;
        } else if (this.status === C.STATUS_INVITE_SENT) {
          if(this.received_100) {
            if(typeof(this.request.cancel) === 'undefined') {
              this.sendBye(options);
              this.ended('local', null, ExSIP.C.causes.BYE);
            } else {
              this.isCanceled = true;
              logger.log('terminate on 100 - setting isCanceled = true', this.ua);
              this.request.cancel(cancel_reason);
            }
          } else {
            this.isCanceled = true;
            this.cancelReason = cancel_reason;
          }
        } else if(this.status === C.STATUS_1XX_RECEIVED) {
          this.isCanceled = true;
          logger.log('terminate on 1xx - setting isCanceled = true', this.ua);
          this.request.cancel(cancel_reason);
        }

        this.failed('local', null, ExSIP.C.causes.CANCELED);
        break;

      // - UAS -
      case C.STATUS_WAITING_FOR_ANSWER:
        logger.log('rejecting RTCSession with 486 Busy Here', this.ua);

        this.request.reply(486);
        this.failed('local', null, ExSIP.C.causes.REJECTED);
        break;
      case C.STATUS_ANSWERED:
        logger.log('rejecting RTCSession', this.ua);

        status_code = status_code || 480;

        if (status_code < 300 || status_code >= 700) {
          throw new TypeError('Invalid status_code: '+ status_code);
        }

        this.request.reply(status_code, reason_phrase, extraHeaders, body);
        this.failed('local', null, ExSIP.C.causes.REJECTED);
        break;
      case C.STATUS_WAITING_FOR_ACK:
      case C.STATUS_REFER_SENT:
      case C.STATUS_CONFIRMED:
        logger.log('terminating RTCSession', this.ua);

        // Send Bye
        this.sendBye(options);
        return;
    }

    this.close();
  };

  /**
   * Answer the call.
   * @param {Object} [options]
   */
  RTCSession.prototype.answer = function(options) {
    options = options || {};

    var
      self = this,
      request = this.request,
      extraHeaders = options.extraHeaders || [],
      mediaConstraints = options.mediaConstraints || {'audio':true, 'video':true};

    var answerCreationSucceeded = function(body) {
      var replySucceeded = function() {
          var timeout = ExSIP.Timers.T1;

          self.status = C.STATUS_WAITING_FOR_ACK;

          /**
           * RFC3261 13.3.1.4
           * Response retransmissions cannot be accomplished by transaction layer
           *  since it is destroyed when receiving the first 2xx answer
           */
          self.timers.invite2xxTimer = window.setTimeout(function invite2xxRetransmission() {
              if (self.status !== C.STATUS_WAITING_FOR_ACK) {
                return;
              }

              request.reply(200, null, ['Contact: '+ self.contact], body);

              if (timeout < ExSIP.Timers.T2) {
                timeout = timeout * 2;
                if (timeout > ExSIP.Timers.T2) {
                  timeout = ExSIP.Timers.T2;
                }
              }
              self.timers.invite2xxTimer = window.setTimeout(
                invite2xxRetransmission, timeout
              );
            },
            timeout
          );

          /**
           * RFC3261 14.2
           * If a UAS generates a 2xx response and never receives an ACK,
           *  it SHOULD generate a BYE to terminate the dialog.
           */
          self.timers.ackTimer = window.setTimeout(function() {
              if(self.status === C.STATUS_WAITING_FOR_ACK) {
                logger.log('no ACK received, terminating the call', self.ua);
                window.clearTimeout(self.timers.invite2xxTimer);
                self.sendBye();
                self.ended('remote', null, ExSIP.C.causes.NO_ACK);
              }
            },
            ExSIP.Timers.TIMER_H
          );

          self.started('local');
        },

      // run for reply failure callback
        replyFailed = function() {
          self.failed('system', null, ExSIP.C.causes.CONNECTION_ERROR);
        };

      extraHeaders.push('Contact: ' + self.contact);

      logger.log('answer : sending reply', self.ua);
      request.reply(200, null, extraHeaders,
        body,
        replySucceeded,
        replyFailed
      );
    };

    var answerCreationFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.failed('local', null, ExSIP.C.causes.WEBRTC_ERROR);
    };


    // Check Session Direction and Status
    if (this.direction !== 'incoming') {
      throw new TypeError('Invalid method "answer" for an outgoing call');
    } else if (this.status !== C.STATUS_WAITING_FOR_ANSWER) {
      throw new ExSIP.Exceptions.InvalidStateError(this.status);
    }

    this.status = C.STATUS_ANSWERED;

    // An error on dialog creation will fire 'failed' event
    if(!this.createDialog(request, 'UAS')) {
      request.reply(500, 'Missing Contact header field');
      return;
    }

    window.clearTimeout(this.timers.userNoAnswerTimer);

    logger.log('answer : getUserMedia', self.ua);
    this.getUserMedia(mediaConstraints, answerCreationSucceeded, answerCreationFailed, {isAnswer: true, remoteSdp: request.body});
  };

  /**
   * Accepts the reInvite.
   * @param {Object} [options]
   */
  RTCSession.prototype.rejectReInvite = function(options) {
    options = options || {};

    logger.log("rejecting re-INVITE", this.ua);

    this.request.reply(488);
  };

  /**
   * Accepts the reInvite.
   * @param {Object} [options]
   */
  RTCSession.prototype.acceptReInvite = function(options) {
    options = options || {};

    var self = this,
      extraHeaders = options.extraHeaders || [];

    logger.log("accepting re-INVITE", this.ua);

    var replySucceeded = function() {
      var timeout = ExSIP.Timers.T1;

      self.status = C.STATUS_WAITING_FOR_ACK;

      /**
       * RFC3261 13.3.1.4
       * Response retransmissions cannot be accomplished by transaction layer
       *  since it is destroyed when receiving the first 2xx answer
       */
      self.timers.invite2xxTimer = window.setTimeout(function invite2xxRetransmission() {
          if (self.status !== C.STATUS_WAITING_FOR_ACK) {
            return;
          }

          self.request.reply(200, null, extraHeaders, self.rtcMediaHandler.peerConnection.localDescription.sdp);

          if (timeout < ExSIP.Timers.T2) {
            timeout = timeout * 2;
            if (timeout > ExSIP.Timers.T2) {
              timeout = ExSIP.Timers.T2;
            }
          }
          self.timers.invite2xxTimer = window.setTimeout(
            invite2xxRetransmission, timeout
          );
        },
        timeout
      );

      /**
       * RFC3261 14.2
       * If a UAS generates a 2xx response and never receives an ACK,
       *  it SHOULD generate a BYE to terminate the dialog.
       */
      self.timers.ackTimer = window.setTimeout(function() {
          if(self.status === C.STATUS_WAITING_FOR_ACK) {
            logger.log('no ACK received', self.ua);
//                window.clearTimeout(self.timers.invite2xxTimer);
//                self.sendBye();
//                self.ended('remote', null, ExSIP.C.causes.NO_ACK);
          }
        },
        ExSIP.Timers.TIMER_H
      );

      self.started('local', undefined, true);
    };

    var replyFailed = function() {
      self.failed('system', null, ExSIP.C.causes.CONNECTION_ERROR);
    };

//    var previousRemoteDescription = self.rtcMediaHandler.peerConnection.remoteDescription;
    var connectSuccess = function() {
      logger.log("onMessage success", self.ua);
      self.request.reply(200, null, extraHeaders,
        self.rtcMediaHandler.peerConnection.localDescription.getSdp(
          {additionalSdp: self.rtcMediaHandler.peerConnection.remoteUnsupportedMedia}),
        replySucceeded,
        replyFailed
      );
    };

    var connectFailed = function(e) {
      logger.warn('invalid SDP', self.ua);
      logger.warn(e, self.ua);
      self.request.reply(488);
    };

    this.initialRemoteSdp = this.initialRemoteSdp || self.rtcMediaHandler.peerConnection.remoteDescription.sdp;
    var sdp = this.request.body;
    if(sdp.length === 0) {
      logger.log("empty sdp");
    }
    this.reconnectRtcMediaHandler(connectSuccess, connectFailed, {isAnswer: true, remoteSdp: sdp, isReconnect: true});
  };

  RTCSession.prototype.reconnectRtcMediaHandler = function(connectSuccess, connectFailed, options) {
    var self = this;
    options = options || {};
    var localMedia = options.localMedia || this.rtcMediaHandler.localMedia;
    options["createOfferConstraints"] = options.createOfferConstraints || this.rtcMediaHandler.createOfferConstraints;
    this.rtcMediaHandler.close(!!options.localMedia);

    this.initRtcMediaHandler(options);
    this.rtcMediaHandler.localMedia = localMedia;
    this.rtcMediaHandler.createOfferConstraints = options["createOfferConstraints"];
    this.connectRtcMediaHandler(localMedia, function(){
        self.started('local', undefined, true);
        connectSuccess();
      }, connectFailed, options
    );
  };

  /**
   * Send a DTMF
   *
   * @param {String|Number} tones
   * @param {Object} [options]
   */
  RTCSession.prototype.sendDTMF = function(tones, options) {
    var duration, interToneGap;

    options = options || {};
    duration = options.duration || null;
    interToneGap = options.interToneGap || null;

    if (tones === undefined) {
      throw new TypeError('Not enough arguments');
    }

    // Check Session Status
    if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_WAITING_FOR_ACK) {
      throw new ExSIP.Exceptions.InvalidStateError(this.status);
    }

    // Check tones
    if (!tones || (typeof tones !== 'string' && typeof tones !== 'number') || !tones.toString().match(/^[0-9A-D#*,]+$/i)) {
      throw new TypeError('Invalid tones: '+ tones);
    }

    tones = tones.toString();

    // Check duration
    if (duration && !ExSIP.Utils.isDecimal(duration)) {
      throw new TypeError('Invalid tone duration: '+ duration);
    } else if (!duration) {
      duration = DTMF.C.DEFAULT_DURATION;
    } else if (duration < DTMF.C.MIN_DURATION) {
      logger.warn('"duration" value is lower than the minimum allowed, setting it to '+ DTMF.C.MIN_DURATION+ ' milliseconds', this.session.ua);
      duration = DTMF.C.MIN_DURATION;
    } else if (duration > DTMF.C.MAX_DURATION) {
      logger.warn('"duration" value is greater than the maximum allowed, setting it to '+ DTMF.C.MAX_DURATION +' milliseconds', this.session.ua);
      duration = DTMF.C.MAX_DURATION;
    } else {
      duration = Math.abs(duration);
    }
    options.duration = duration;

    // Check interToneGap
    if (interToneGap && !ExSIP.Utils.isDecimal(interToneGap)) {
      throw new TypeError('Invalid interToneGap: '+ interToneGap);
    } else if (!interToneGap) {
      interToneGap = DTMF.C.DEFAULT_INTER_TONE_GAP;
    } else if (interToneGap < DTMF.C.MIN_INTER_TONE_GAP) {
      logger.warn('"interToneGap" value is lower than the minimum allowed, setting it to '+ DTMF.C.MIN_INTER_TONE_GAP +' milliseconds', this.session.ua);
      interToneGap = DTMF.C.MIN_INTER_TONE_GAP;
    } else {
      interToneGap = Math.abs(interToneGap);
    }

    this.dtmf.send(tones, options);
  };


  /**
   * RTCPeerconnection handlers
   */
// Modified to support Firefox 22
  RTCSession.prototype.getLocalStreams = function() {
    try {
      if (this.rtcMediaHandler.peerConnection.localStreams) {
        return this.rtcMediaHandler &&
          this.rtcMediaHandler.peerConnection &&
          this.rtcMediaHandler.peerConnection.localStreams || [];
      }
      else {
        return this.rtcMediaHandler &&
          this.rtcMediaHandler.peerConnection &&
          this.rtcMediaHandler.peerConnection.getLocalStreams() || [];
      }
    } catch(ex) {
      return [];
    }
  };

  RTCSession.prototype.getRemoteStreams = function() {
    try {
      if (this.rtcMediaHandler.peerConnection.remoteStreams) {
        return this.rtcMediaHandler &&
          this.rtcMediaHandler.peerConnection &&
          this.rtcMediaHandler.peerConnection.remoteStreams || [];
      }
      else {
        return this.rtcMediaHandler &&
          this.rtcMediaHandler.peerConnection &&
          this.rtcMediaHandler.peerConnection.getRemoteStreams() || [];
      }
    } catch(ex) {
      return [];
    }
  };

  /**
   * Session Management
   */

  /**
   * @private
   */
  RTCSession.prototype.init_incoming = function(request) {
    var expires,
      self = this;
//      contentType = request.getHeader('Content-Type');

//    // Check body and content type
//    if(!request.body || (contentType !== 'application/sdp')) {
//      request.reply(415);
//      return;
//    }

    // Session parameter initialization
    this.status = C.STATUS_INVITE_RECEIVED;
    this.from_tag = request.from_tag;
    this.id = request.call_id + this.from_tag;
    this.request = request;
    this.contact = this.ua.contact.toString();

    //Save the session into the ua sessions collection.
    this.ua.sessions[this.id] = this;

    //Get the Expires header value if exists
    if(request.hasHeader('expires')) {
      expires = request.getHeader('expires') * 1000;
    }

    /* Set the to_tag before
     * replying a response code that will create a dialog.
     */
    request.to_tag = ExSIP.Utils.newTag();

    // An error on dialog creation will fire 'failed' event
    if(!this.createDialog(request, 'UAS', true)) {
      request.reply(500, 'Missing Contact header field');
      return;
    }

    //Initialize Media Session
    this.initRtcMediaHandler();
    this.rtcMediaHandler.onMessage(
      request.body,
      /*
       * onSuccess
       * SDP Offer is valid. Fire UA newRTCSession
       */
      function() {
        request.reply(180, null, ['Contact: ' + self.contact]);
        self.status = C.STATUS_WAITING_FOR_ANSWER;

        // Set userNoAnswerTimer
        self.timers.userNoAnswerTimer = window.setTimeout(function() {
            request.reply(408);
            self.failed('local',null, ExSIP.C.causes.NO_ANSWER);
          }, self.ua.configuration.no_answer_timeout
        );

        /* Set expiresTimer
         * RFC3261 13.3.1
         */
        if (expires) {
          self.timers.expiresTimer = window.setTimeout(function() {
              if(self.status === C.STATUS_WAITING_FOR_ANSWER) {
                request.reply(487);
                self.failed('system', null, ExSIP.C.causes.EXPIRES);
              }
            }, expires
          );
        }

        self.newRTCSession('remote', request);
      },
      /*
       * onFailure
       * Bad media description
       */
      function(e) {
        logger.warn('invalid SDP', self.ua);
        logger.warn(e, self.ua);
        request.reply(488);
      }
    );
  };

  /**
   * @private
   */
  RTCSession.prototype.connect = function(target, options) {
    var self = this;

    if (target === undefined) {
      throw new TypeError('Not enough arguments');
    }

    this.connectLocalMedia(options, function(){
      logger.log("connect local succeeded", self.ua);
      self.sendInviteRequest(target, options);
    }, function(){
      logger.warn("connect local failed", self.ua);
    });
  };

  /**
   * @private
   */
  RTCSession.prototype.connectLocalMedia = function(options, success, failure) {
    options = options || {};

    var event,
      eventHandlers = options.eventHandlers || {},
      mediaConstraints = options.mediaConstraints || {audio: true, video: true},
      self = this;

    // Check Session Status
    if (this.status !== C.STATUS_NULL) {
      throw new ExSIP.Exceptions.InvalidStateError(this.status);
    }

    // Set event handlers
    for (event in eventHandlers) {
      this.on(event, eventHandlers[event]);
    }

    // Session parameter initialization
    this.from_tag = ExSIP.Utils.newTag();
    this.initRtcMediaHandler(options);

    if (!ExSIP.WebRTC.isSupported) {
      this.failed('local', null, ExSIP.C.causes.WEBRTC_NOT_SUPPORTED);
    } else {
      this.getUserMedia(mediaConstraints, function(){
        logger.log('offer succeeded', self.ua);
        success();
      }, function(){
        logger.log('offer failed', self.ua);
        self.failed('local', null, ExSIP.C.causes.WEBRTC_ERROR);
        failure();
      }, options);
    }
  };

  /**
   * @private
   */
  RTCSession.prototype.close = function() {
    var idx;

    if(this.status === C.STATUS_TERMINATED) {
      return;
    }

    logger.log('closing INVITE session ' + this.id, this.ua);

    // 1st Step. Terminate media.
    if (this.rtcMediaHandler){
      this.rtcMediaHandler.close(!this.ua.reuseLocalMedia());
    }

    // 2nd Step. Terminate signaling.

    // Clear session timers
    for(idx in this.timers) {
      window.clearTimeout(this.timers[idx]);
    }

    // Terminate dialogs

    // Terminate confirmed dialog
    if(this.dialog) {
      this.dialog.terminate();
      delete this.dialog;
    }

    // Terminate early dialogs
    for(idx in this.earlyDialogs) {
      this.earlyDialogs[idx].terminate();
      delete this.earlyDialogs[idx];
    }

    this.status = C.STATUS_TERMINATED;

    delete this.ua.sessions[this.id];
  };

  /**
   * Dialog Management
   * @private
   */
  RTCSession.prototype.createDialog = function(message, type, early) {
    var dialog, early_dialog,
      local_tag = (type === 'UAS') ? message.to_tag : message.from_tag,
      remote_tag = (type === 'UAS') ? message.from_tag : message.to_tag,
      id = message.call_id + local_tag + remote_tag;

    early_dialog = this.earlyDialogs[id];

    // Early Dialog
    if (early) {
      if (early_dialog) {
        return true;
      } else {
        early_dialog = new ExSIP.Dialog(this, message, type, ExSIP.Dialog.C.STATUS_EARLY);

        // Dialog has been successfully created.
        if(early_dialog.id) {
          this.earlyDialogs[id] = early_dialog;
          return true;
        }
        // Dialog not created due to an error.
        else {
          this.failed('remote', message, ExSIP.C.causes.INTERNAL_ERROR);
          return false;
        }
      }
    }

    // Confirmed Dialog
    else {
      // In case the dialog is in _early_ state, update it
      if (early_dialog) {
        early_dialog.update(message, type);
        this.dialog = early_dialog;
        delete this.earlyDialogs[id];
        return true;
      }

      // Otherwise, create a _confirmed_ dialog
      dialog = new ExSIP.Dialog(this, message, type);

      if(dialog.id) {
        this.to_tag = message.to_tag;
        this.dialog = dialog;
        return true;
      }
      // Dialog not created due to an error
      else {
        this.failed('remote', message, ExSIP.C.causes.INTERNAL_ERROR);
        return false;
      }
    }
  };


  /**
   * In dialog Request Reception
   * @private
   */
  RTCSession.prototype.receiveRequest = function(request) {
    var contentType, self = this;

    if(request.method === ExSIP.C.CANCEL) {
      /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
       * was in progress and that the UAC MAY continue with the session established by
       * any 2xx response, or MAY terminate with BYE. ExSIP does continue with the
       * established session. So the CANCEL is processed only if the session is not yet
       * established.
       */

      /*
       * Terminate the whole session in case the user didn't accept nor reject the
       *request opening the session.
       */
      if(this.status === C.STATUS_WAITING_FOR_ANSWER) {
        this.status = C.STATUS_CANCELED;
        this.request.reply(487);
        this.failed('remote', request, ExSIP.C.causes.CANCELED);
      }
    } else {
      // Requests arriving here are in-dialog requests.
      switch(request.method) {
        case ExSIP.C.ACK:
          if(this.status === C.STATUS_WAITING_FOR_ACK) {
            window.clearTimeout(this.timers.ackTimer);
            window.clearTimeout(this.timers.invite2xxTimer);
            this.status = C.STATUS_CONFIRMED;
            if(request.body.length > 0) {
              logger.log("set remoteDescription for late offer ACK", this.ua);
              this.rtcMediaHandler.onMessage(request.body, function(){
                logger.log("late offer remoteDescription success", self.ua);
                self.started('local', undefined, true);
              }, function(){
                logger.log("late offer remoteDescription failure", self.ua);
              });
            }
          }
          break;
        case ExSIP.C.BYE:
          if(this.status === C.STATUS_CONFIRMED) {
            request.reply(200);
            this.ended('remote', request, ExSIP.C.causes.BYE);
          }
          break;
        case ExSIP.C.INVITE:
          if(this.status === C.STATUS_CONFIRMED) {
            logger.log('re-INVITE received', this.ua);
            this.request = request;
            // accept empty reinvites
            if(!request.body || request.body.length === 0) {
              this.acceptReInvite();
              return;
            }

            var description = new ExSIP.WebRTC.RTCSessionDescription({type: "offer", sdp: request.body});
            var oldDescription = this.rtcMediaHandler.peerConnection.remoteDescription;
            var audioAdd = description.hasActiveAudio() && (!oldDescription || !oldDescription.hasActiveAudio());
            var videoAdd = description.hasActiveVideo() && (!oldDescription || !oldDescription.hasActiveVideo());
            if(audioAdd || videoAdd) {
              this.ua.emit("onReInvite", this.ua, {
                session: this,
                request: request,
                audioAdd: audioAdd,
                videoAdd: videoAdd
              });
            } else {
              this.acceptReInvite();
            }
          }
          break;
        case ExSIP.C.INFO:
          if(this.status === C.STATUS_CONFIRMED || this.status === C.STATUS_WAITING_FOR_ACK) {
            contentType = request.getHeader('content-type');
            if (contentType && (contentType.match(/^application\/dtmf-relay/i))) {
              new DTMF(this).init_incoming(request);
            }
            else if (contentType && (contentType.match(/^application\/media_control\+xml/i))) {
              request.reply(200);
              self.started('local', undefined, true);
            }
          }
          break;
        case ExSIP.C.REFER:
          if(this.status === C.STATUS_CONFIRMED) {
            this.ua.processRefer(this, request);
          }
          break;
        case ExSIP.C.NOTIFY:
          if(this.status === C.STATUS_REFER_SENT) {
            request.reply(200);
            logger.log('received NOTIFY with body : ' + request.body, this.ua);
            var status = parseInt(request.body.match(/SIP\/2.0\s(.*)\s/)[1], 10);
            logger.log('NOTIFY status : ' + status, this.ua);

            if(!this.sessionToTransfer) {
              logger.warn('no transferred session for REFER session : ' + this.id, this.ua);
              return;
            }

            if(status >= 200 && status <= 299) {
              logger.log('terminate transferred session : ' + this.sessionToTransfer.id, this.ua);
              this.sessionToTransfer.terminate();
            } else if(status >= 400 && status <= 699) {
              logger.warn('resuming session : ' + this.sessionToTransfer.id, this.ua);
              this.sessionToTransfer.unhold(function(){
                logger.log('resumed session : ' + self.sessionToTransfer.id, self.ua);
              });
            }
          }
      }
    }
  };


  RTCSession.prototype.connectRtcMediaHandler = function(stream, creationSucceeded, creationFailed, options) {
    this.rtcMediaHandler.connect(stream, creationSucceeded, creationFailed, options);
    this.dtmf.enableDtmfSender(stream, this.rtcMediaHandler.peerConnection);
  };

  RTCSession.prototype.sendData = function(data) {
    this.rtcMediaHandler.sendData(data);
  };

  /**
   * Get User Media
   * @private
   */
  RTCSession.prototype.getUserMedia = function(constraints, creationSucceeded, creationFailed, options) {
    var self = this;

    console.log(options);
    var userMediaSucceeded = function(stream) {
      self.ua.localMedia = stream;
      self.connectRtcMediaHandler(stream, creationSucceeded, creationFailed, options);
//      self.reconnectRtcMediaHandler(creationSucceeded, creationFailed, {localMedia: stream});
    };

    var userMediaFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }
      self.failed('local', null, ExSIP.C.causes.USER_DENIED_MEDIA_ACCESS);
    };


    if(this.ua.reuseLocalMedia() && this.ua.localMedia) {
      this.rtcMediaHandler.localMedia = this.ua.localMedia;
      userMediaSucceeded(this.ua.localMedia);
    } else {
      this.rtcMediaHandler.getUserMedia(
        userMediaSucceeded,
        userMediaFailed,
        constraints
      );
    }
  };

  RTCSession.prototype.sendInviteRequest = function(target, options, inviteSuccessCallback, inviteFailureCallback) {
    options = options || {};
    options["status"] = C.STATUS_INVITE_SENT;
    options["sdp"] = this.rtcMediaHandler.peerConnection.localDescription.sdp;
    options["target"] = target;
    this.sendRequest(ExSIP.C.INVITE, options, {inviteSuccess: inviteSuccessCallback, inviteFailure: inviteFailureCallback});
  };
  /**
   * Initial Request Sender
   * @private
   */
  RTCSession.prototype.createOutgoingRequest = function(target, method, options) {
    options = options || {};

    var requestParams,
      invalidTarget = false,
      extraHeaders = options.extraHeaders || [];

    // Check target validity
    try {
      target = ExSIP.Utils.normalizeURI(target, this.ua.configuration.hostport_params);
    } catch(e) {
      target = ExSIP.URI.parse(ExSIP.C.INVALID_TARGET_URI);
      invalidTarget = true;
    }

    // Set anonymous property
    this.anonymous = options.anonymous;

    // OutgoingSession specific parameters
    this.isCanceled = false;
    logger.log('outgoing request - setting isCanceled = false', this.ua);

    this.received_100 = false;

    this.from_tag = this.from_tag || ExSIP.Utils.newTag();
    requestParams = {from_tag: this.from_tag};

    this.contact = this.ua.contact.toString({
      anonymous: this.anonymous,
      outbound: true
    });

    if (this.anonymous) {
      requestParams.from_display_name = 'Anonymous';
      requestParams.from_uri = 'sip:anonymous@anonymous.invalid';

      extraHeaders.push('P-Preferred-Identity: '+ this.ua.configuration.uri.toString());
      extraHeaders.push('Privacy: id');
    }

    extraHeaders.push('Contact: '+ this.contact);
    extraHeaders.push('Allow: '+ ExSIP.Utils.getAllowedMethods(this.ua));

    this.request = new ExSIP.OutgoingRequest(method, target, this.ua, requestParams, extraHeaders);

    this.id = this.request.call_id + this.from_tag;

    //Save the session into the ua sessions collection.
    this.ua.sessions[this.id] = this;

    this.newRTCSession('local', this.request);

    if (invalidTarget) {
      this.failed('local', null, ExSIP.C.causes.INVALID_TARGET);
      logger.warn("invalid target : "+target, this.ua);
    } else {
      if (this.isCanceled || this.status === C.STATUS_TERMINATED) {
        logger.warn("canceled or terminated", this.ua);
        return;
      }

      return this.request;
    }

  };

  RTCSession.prototype.sendReferRequest = function(sessionToTransfer, options) {
    this.sessionToTransfer = sessionToTransfer;
    options = options || {};
    options["status"] = C.STATUS_REFER_SENT;
    options["target"] = sessionToTransfer.dialog.remote_target;
    this.sendRequest(ExSIP.C.REFER, options);
  };

  RTCSession.prototype.sendNotifyRequest = function(options, successCallback, failureCallback) {
    options = options || {};
    var extraHeaders = ['Content-Type: message/sipfrag',
      'Subscription-State: '+(options['subscriptionState'] || "active;expires=60"),
      'Event: refer'];
    options = ExSIP.Utils.merge_options({extraHeaders: extraHeaders},  options);
    this.sendRequest(ExSIP.C.NOTIFY, options, {success: successCallback, failure: failureCallback});
  };

  RTCSession.prototype.hold = function(inviteSuccessCallback, inviteFailureCallback) {
    var self = this;
    this.changeSession({audioMode: ExSIP.C.INACTIVE, audioPort: "0", videoMode: ExSIP.C.INACTIVE, videoPort: "0"}, function(){
        self.held();
        if(inviteSuccessCallback) {
          inviteSuccessCallback();
        }
      },
      inviteFailureCallback);
  };

  RTCSession.prototype.unhold = function(inviteSuccessCallback, inviteFailureCallback) {
    var self = this;
    this.changeSession({audioMode: ExSIP.C.SENDRECV, videoMode: ExSIP.C.SENDRECV}, function(){
        self.resumed();
        if(inviteSuccessCallback) {
          inviteSuccessCallback();
        }
      },
      inviteFailureCallback);
  };

  RTCSession.prototype.changeSession = function(sdpOptions, inviteSuccessCallback, inviteFailureCallback) {
    var self = this;
    this.reconnectRtcMediaHandler(function(){
      self.sendInviteRequest(undefined, undefined, inviteSuccessCallback, inviteFailureCallback);
    }, function(){
      logger.error("Could not change local mode");
    }, sdpOptions);
  };

  /**
   * Reception of Response for Initial Request
   * @private
   */
  RTCSession.prototype.receiveResponse = function(response, callbacks) {
    var cause,
      session = this;
    callbacks = callbacks || {};

    if(this.status === C.STATUS_BYE_SENT) {
      this.sendACK();
      this.ended('local', null, ExSIP.C.causes.BYE);
      return;
    }

    // Proceed to cancellation if the user requested.
    if(this.isCanceled) {
      if(response.status_code >= 100 && response.status_code < 200) {
        this.request.cancel(this.cancelReason);
      } else if(response.status_code >= 200 && response.status_code < 299) {
        this.acceptAndTerminate(response);
      } else {
        if (this.dialog || (response.hasHeader('contact') && this.createDialog(response, 'UAC'))) {
          this.sendACK();
        }
      }
      return;
    }

    if(this.status !== C.STATUS_INVITE_SENT && this.status !== C.STATUS_1XX_RECEIVED) {
      logger.warn('status ('+this.status+') not invite sent or 1xx received or terminated', this.ua);
      return;
    }

    switch(true) {
      case /^100$/.test(response.status_code):
        this.received_100 = true;
        break;
      case /^1[0-9]{2}$/.test(response.status_code):
        // Do nothing with 1xx responses without To tag.
        if(!response.to_tag) {
          logger.warn('1xx response received without to tag', this.ua);
          break;
        }

        // Create Early Dialog if 1XX comes with contact
        if(response.hasHeader('contact')) {
          // An error on dialog creation will fire 'failed' event
          this.createDialog(response, 'UAC', true);
        }

        this.status = C.STATUS_1XX_RECEIVED;
        this.progress('remote', response);
        break;
      case /^2[0-9]{2}$/.test(response.status_code):
        // Do nothing if this.dialog is already confirmed
//        if (this.dialog) {
//          break;
//        }

        if(!response.body) {
          this.acceptAndTerminate(response, 400, 'Missing session description');
          this.failed('remote', response, ExSIP.C.causes.BAD_MEDIA_DESCRIPTION);
          break;
        }

        // An error on dialog creation will fire 'failed' event
        if(!this.dialog) {
          if (!this.createDialog(response, 'UAC')) {
            break;
          }
        }

        session.status = C.STATUS_CONFIRMED;
        this.rtcMediaHandler.onMessage(
          response.body,
          /*
           * onSuccess
           * SDP Answer fits with Offer. Media will start
           */
          function() {
            session.sendACK();
            session.started('remote', response);
            if(callbacks["inviteSuccess"]) {
              callbacks["inviteSuccess"]();
            }
          },
          /*
           * onFailure
           * SDP Answer does not fit the Offer. Accept the call and Terminate.
           */
          function(e) {
            logger.warn(e, session.ua);
            session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
            session.failed('remote', response, ExSIP.C.causes.BAD_MEDIA_DESCRIPTION);
          }
        );
        break;
      default:
        cause = ExSIP.Utils.sipErrorCause(response.status_code);
        this.failed('remote', response, cause);
        if(callbacks["inviteFailure"]) {
          callbacks["inviteFailure"](response);
        }
    }
  };


  /**
   * @private
   */
  RTCSession.prototype.acceptAndTerminate = function(response, status_code, reason_phrase) {
    // Send ACK and BYE
    // An error on dialog creation will fire 'failed' event
    if (this.dialog || this.createDialog(response, 'UAC')) {
      this.sendACK();
      this.sendBye({
        status_code: status_code,
        reason_phrase: reason_phrase
      });
    }
  };

  RTCSession.prototype.supports = function(name) {
    var supported = this.request.getHeader("Supported");
    return supported !== undefined && supported.indexOf(name) !== -1;
  };

  /**
   * @private
   */
  RTCSession.prototype.sendACK = function() {
    this.sendRequest(ExSIP.C.ACK);
  };

  /**
   * @private
   */
  RTCSession.prototype.sendBye = function(options) {
    options = options || {};
    options.extraHeaders = options.extraHeaders || [];

    var reason,
      status_code = options.status_code,
      reason_phrase = options.reason_phrase || ExSIP.C.REASON_PHRASE[status_code] || '',
      body = options.body;

    if (status_code && (status_code < 200 || status_code >= 700)) {
      throw new TypeError('Invalid status_code: '+ status_code);
    } else if (status_code) {
      reason = 'SIP ;cause=' + status_code + '; text="' + reason_phrase + '"';
      options.extraHeaders.push('Reason: '+ reason);
    }

    options["sdp"] = body;
    options["status"] = C.STATUS_BYE_SENT;
    this.sendRequest(ExSIP.C.BYE, options);
  };


  /**
   * @private
   */
  RTCSession.prototype.sendRequest = function(method, options, requestCallbacks) {
    var request;
    options = options || {};
    if(this.dialog) {
      request = this.dialog.createRequest(method, options.extraHeaders);
    } else {
      request = this.createOutgoingRequest(options["target"], method, options);
    }

    if(!request) {
      return;
    }

    if(options["status"]) {
      this.status = options["status"];
    }
    request.body = options["sdp"];

    var hasSdp = request.body && request.body.length > 0;
    if(!ExSIP.Utils.containsHeader(request.extraHeaders, "Content-Type") && hasSdp) {
      request.extraHeaders.push('Content-Type: application/sdp');
    }

    var request_sender = new RequestSender(this, request, requestCallbacks);
    request_sender.send();
  };

  /**
   * Session Callbacks
   */

  /**
   * Callback to be called from UA instance when TransportError occurs
   * @private
   */
  RTCSession.prototype.onTransportError = function() {
    if(this.status !== C.STATUS_TERMINATED) {
      if (this.status === C.STATUS_CONFIRMED) {
        this.ended('system', null, ExSIP.C.causes.CONNECTION_ERROR);
      } else {
        this.failed('system', null, ExSIP.C.causes.CONNECTION_ERROR);
      }
    }
  };

  /**
   * Callback to be called from UA instance when RequestTimeout occurs
   * @private
   */
  RTCSession.prototype.onRequestTimeout = function() {
    if(this.status !== C.STATUS_TERMINATED) {
      if (this.status === C.STATUS_CONFIRMED) {
        this.ended('system', null, ExSIP.C.causes.REQUEST_TIMEOUT);
      } else {
        this.ua.reconnect();
        this.failed('system', null, ExSIP.C.causes.CONNECTION_ERROR);
      }
    }
  };

  /**
   * Internal Callbacks
   */

  /**
   * @private
   */
  RTCSession.prototype.newRTCSession = function(originator, request) {
    var session = this,
      event_name = 'newRTCSession';

    if (originator === 'remote') {
      session.direction = 'incoming';
      session.local_identity = request.to;
      session.remote_identity = request.from;
    } else if (originator === 'local'){
      session.direction = 'outgoing';
      session.local_identity = request.from;
      session.remote_identity = request.to;
    }

    session.ua.emit(event_name, session.ua, {
      originator: originator,
      session: session,
      request: request
    });
  };

  /**
   * @private
   */
  RTCSession.prototype.connecting = function(originator, request) {
    var session = this,
      event_name = 'connecting';

    session.emit(event_name, session, {
      originator: 'local',
      request: request
    });
  };

  /**
   * @private
   */
  RTCSession.prototype.progress = function(originator, response) {
    var session = this,
      event_name = 'progress';

    session.emit(event_name, session, {
      originator: originator,
      response: response || null
    });
  };

  RTCSession.prototype.isStarted = function() {
    return this.start_time !== null;
  };

  RTCSession.prototype.isHeld = function() {
    return this.isOnHold;
  };

  /**
   * @private
   */
  RTCSession.prototype.started = function(originator, message, isReconnect) {
    var session = this,
      event_name = 'started';

    session.start_time = new Date();

    session.emit(event_name, session, {
      originator: originator,
      response: message || null,
      isReconnect: isReconnect
    });
  };

  RTCSession.prototype.iceConnected = function(originator, message) {
    var session = this,
      event_name = 'iceconnected';

    session.emit(event_name, session, {
      originator: originator,
      response: message || null
    });
  };

  RTCSession.prototype.iceCompleted = function(originator, message) {
    var session = this,
      event_name = 'icecompleted';

    session.emit(event_name, session, {
      originator: originator,
      response: message || null
    });
  };

  RTCSession.prototype.iceClosed = function(originator, message) {
    var session = this,
      event_name = 'iceclosed';

    session.emit(event_name, session, {
      originator: originator,
      response: message || null
    });
  };

  RTCSession.prototype.held = function() {
    this.isOnHold = true;
    this.emit('held', this);
  };

  RTCSession.prototype.resumed = function() {
    this.isOnHold = false;
    this.emit('resumed', this);
  };

  /**
   * @private
   */
  RTCSession.prototype.ended = function(originator, message, cause) {
    var session = this,
      event_name = 'ended';

    session.end_time = new Date();

    session.close();
    session.emit(event_name, session, {
      originator: originator,
      message: message || null,
      cause: cause
    });
  };

  /**
   * @private
   */
  RTCSession.prototype.failed = function(originator, message, cause) {
    var session = this,
      event_name = 'failed';

    logger.warn('failed : '+cause, this.ua);

    session.close();
    session.emit(event_name, session, {
      originator: originator,
      message: message || null,
      cause: cause
    });
  };


  RTCSession.C = C;
  ExSIP.RTCSession = RTCSession;
}(ExSIP));



/**
 * @fileoverview Message
 */

/**
 * @augments ExSIP
 * @class Class creating SIP MESSAGE request.
 * @param {ExSIP.UA} ua
 */
(function(ExSIP) {
var Message;

Message = function(ua) {
  this.ua = ua;
  this.direction = null;
  this.local_identity = null;
  this.remote_identity = null;

  // Custom message empty object for high level use
  this.data = {};
};
Message.prototype = new ExSIP.EventEmitter();


Message.prototype.isDebug = function() {
  return this.ua.isDebug();
};

Message.prototype.send = function(target, body, options) {
  var request_sender, event, contentType, eventHandlers, extraHeaders,
    events = [
      'succeeded',
      'failed'
    ],
    invalidTarget = false;

  if (target === undefined || body === undefined) {
    throw new TypeError('Not enough arguments');
  }

  this.initEvents(events);

  // Get call options
  options = options || {};
  extraHeaders = options.extraHeaders || [];
  eventHandlers = options.eventHandlers || {};
  contentType = options.contentType || 'text/plain';

  // Set event handlers
  for (event in eventHandlers) {
    this.on(event, eventHandlers[event]);
  }

  // Check target validity
  try {
    target = ExSIP.Utils.normalizeURI(target, this.ua.configuration.hostport_params);
  } catch(e) {
    target = ExSIP.URI.parse(ExSIP.C.INVALID_TARGET_URI);
    invalidTarget = true;
  }

  // Message parameter initialization
  this.direction = 'outgoing';
  this.local_identity = this.ua.configuration.uri;
  this.remote_identity = target;

  this.closed = false;
  this.ua.applicants[this] = this;

  extraHeaders.push('Content-Type: '+ contentType);

  this.request = new ExSIP.OutgoingRequest(ExSIP.C.MESSAGE, target, this.ua, null, extraHeaders);

  if(body) {
    this.request.body = body;
  }

  request_sender = new ExSIP.RequestSender(this, this.ua);

  this.ua.emit('newMessage', this.ua, {
    originator: 'local',
    message: this,
    request: this.request
  });

  if (invalidTarget) {
    this.emit('failed', this, {
      originator: 'local',
      cause: ExSIP.C.causes.INVALID_TARGET
    });
  } else {
    request_sender.send();
  }
};

/**
* @private
*/
Message.prototype.receiveResponse = function(response) {
  var cause;

  if(this.closed) {
    return;
  }
  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      // Ignore provisional responses.
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      delete this.ua.applicants[this];
      this.emit('succeeded', this, {
        originator: 'remote',
        response: response
      });
      break;

    default:
      delete this.ua.applicants[this];
      cause = ExSIP.Utils.sipErrorCause(response.status_code);
      this.emit('failed', this, {
        originator: 'remote',
        response: response,
        cause: cause
      });
      break;
  }
};


/**
* @private
*/
Message.prototype.onRequestTimeout = function() {
  if(this.closed) {
    return;
  }
  this.emit('failed', this, {
    originator: 'system',
    cause: ExSIP.C.causes.REQUEST_TIMEOUT
  });
};

/**
* @private
*/
Message.prototype.onTransportError = function() {
  if(this.closed) {
    return;
  }
  this.emit('failed', this, {
    originator: 'system',
    cause: ExSIP.C.causes.CONNECTION_ERROR
  });
};

/**
* @private
*/
Message.prototype.close = function() {
  this.closed = true;
  delete this.ua.applicants[this];
};

/**
 * @private
 */
Message.prototype.init_incoming = function(request) {
  var transaction,
    contentType = request.getHeader('content-type');

  this.direction = 'incoming';
  this.request = request;
  this.local_identity = request.to.uri;
  this.remote_identity = request.from.uri;

  if (contentType && (contentType.match(/^text\/plain(\s*;\s*.+)*$/i) || contentType.match(/^text\/html(\s*;\s*.+)*$/i))) {
    this.ua.emit('newMessage', this.ua, {
      originator: 'remote',
      message: this,
      request: request
    });

    transaction = this.ua.transactions.nist[request.via_branch];

    if (transaction && (transaction.state === ExSIP.Transactions.C.STATUS_TRYING || transaction.state === ExSIP.Transactions.C.STATUS_PROCEEDING)) {
      request.reply(200);
    }
  } else {
    request.reply(415, null, ['Accept: text/plain, text/html']);
  }
};

/**
 * Accept the incoming Message
 * Only valid for incoming Messages
 */
Message.prototype.accept = function(options) {
  options = options || {};

  var
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  if (this.direction !== 'incoming') {
    throw new TypeError('Invalid method "accept" for an outgoing message');
  }

  this.request.reply(200, null, extraHeaders, body);
};

/**
 * Reject the incoming Message
 * Only valid for incoming Messages
 *
 * @param {Number} status_code
 * @param {String} [reason_phrase]
 */
Message.prototype.reject = function(options) {
  options = options || {};

  var
    status_code = options.status_code || 480,
    reason_phrase = options.reason_phrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  if (this.direction !== 'incoming') {
    throw new TypeError('Invalid method "reject" for an outgoing message');
  }

  if (status_code < 300 || status_code >= 700) {
    throw new TypeError('Invalid status_code: '+ status_code);
  }

  this.request.reply(status_code, reason_phrase, extraHeaders, body);
};

ExSIP.Message = Message;
}(ExSIP));



/**
 * @fileoverview SIP User Agent
 */


/**
 * @augments ExSIP
 * @class Class creating a SIP User Agent.
 */
(function(ExSIP) {
    var UA,
        logger = new ExSIP.Logger(ExSIP.name +' | '+ 'UA'),
        C = {
            // UA status codes
            STATUS_INIT :                0,
            STATUS_READY:                1,
            STATUS_USER_CLOSED:          2,
            STATUS_NOT_READY:            3,

            // UA error codes
            CONFIGURATION_ERROR:  1,
            NETWORK_ERROR:        2,

            /* UA events and corresponding SIP Methods.
             * Dynamically added to 'Allow' header field if the
             * corresponding event handler is set.
             */
            EVENT_METHODS: {
                'newRTCSession': 'INVITE',
                'newMessage': 'MESSAGE'
            },

            ALLOWED_METHODS: [
                'ACK',
                'CANCEL',
                'BYE',
                'OPTIONS'
            ],

            ACCEPTED_BODY_TYPES: [
                'application/sdp',
                'application/dtmf-relay'
            ],

            SUPPORTED: 'path, outbound, gruu',

            MAX_FORWARDS: 69,
            TAG_LENGTH: 10
        };

    UA = function(configuration) {
        var events = [
            'connected',
            'disconnected',
            'registered',
            'unregistered',
            'registrationFailed',
            'newRTCSession',
            'newMessage',
            'onReInvite'
        ];

        // Set Accepted Body Types
        C.ACCEPTED_BODY_TYPES = C.ACCEPTED_BODY_TYPES.toString();

        this.cache = {
            credentials: {}
        };

        this.configuration = {};
        this.dialogs = {};
        this.registrator = null;

        //User actions outside any session/dialog (MESSAGE)
        this.applicants = {};

        this.sessions = {};
        this.transport = null;
        this.contact = null;
        this.status = C.STATUS_INIT;
        this.error = null;
        this.transactions = {
            nist: {},
            nict: {},
            ist: {},
            ict: {}
        };

        this.transportRecoverAttempts = 0;
        this.rtcMediaHandlerOptions = {};
        this.localMedia = null;
        this.usedServers = [];
        /**
         * Load configuration
         *
         * @throws {ExSIP.Exceptions.ConfigurationError}
         * @throws {TypeError}
         */

        if(configuration === undefined) {
            throw new TypeError('Not enough arguments');
        }

        try {
            this.loadConfig(configuration);
            this.initEvents(events);
        } catch(e) {
            this.status = C.STATUS_NOT_READY;
            this.error = C.CONFIGURATION_ERROR;
            throw e;
        }
    };
    UA.prototype = new ExSIP.EventEmitter();

//=================
//  High Level API
//=================
    UA.prototype.isDebug = function() {
      return this.configuration.trace_sip === true;
    };

    /**
     * Register.
     *
     *
     */
    UA.prototype.register = function(options) {
        this.configuration.register = true;
        this.registrator.register(options);
    };

    /**
     * Unregister.
     *
     * @param {Boolean} [all] unregister all user bindings.
     *
     */
    UA.prototype.unregister = function(options) {
        this.configuration.register = false;
        this.registrator.unregister(options);
    };

    /**
     * Registration state.
     * @param {Boolean}
        */
    UA.prototype.isRegistered = function() {
        if(this.registrator && this.registrator.registered) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Connection state.
     * @param {Boolean}
        */
    UA.prototype.isConnected = function() {
        if(this.transport) {
            return this.transport.connected;
        } else {
            return false;
        }
    };

    /**
     * Make an outgoing call.
     *
     * @param {String} target
     * @param {Object} views
     * @param {Object} [options]
     *
     * @throws {TypeError}
     *
     */
    UA.prototype.call = function(target, options) {
      var session;

      logger.log('options : '+ExSIP.Utils.toString(options), this);
      session = new ExSIP.RTCSession(this);
      session.connect(target, options);
      return session;
    };

    UA.prototype.transfer = function(transferTarget, sessionToTransfer, options) {
      var self = this;
      logger.log('transfer options : '+ExSIP.Utils.toString(options), this);
      try {
        transferTarget = ExSIP.Utils.normalizeURI(transferTarget, this.configuration.hostport_params);
      } catch(e) {
        sessionToTransfer.failed('local', null, ExSIP.C.causes.INVALID_TARGET);
        logger.warn("invalid transfer target", this);
        return;
      }

      var holdFailed = function(){
        logger.log("transfer : hold failed", self);
      };

      var holdSuccess = function(){
        logger.log("transfer : hold success - sending refer to transferee", self);
        self.sendReferBasic(sessionToTransfer, transferTarget, options);
      };

      logger.log("transfer : holding session to transfer", self);
      sessionToTransfer.hold(holdSuccess, holdFailed);
    };

    UA.prototype.attendedTransfer = function(transferTarget, sessionToTransfer, options) {
      var self = this;
      logger.log('attended transfer options : '+ExSIP.Utils.toString(options), this);
      try {
        transferTarget = ExSIP.Utils.normalizeURI(transferTarget, this.configuration.hostport_params);
      } catch(e) {
        sessionToTransfer.failed('local', null, ExSIP.C.causes.INVALID_TARGET);
        logger.warn("invalid transfer target", this);
        return;
      }


      var targetSession = self.newSession(options);
      targetSession.rtcMediaHandler.copy(sessionToTransfer.rtcMediaHandler);

      var holdTargetSuccess = function(){
        logger.log("transfer : hold target success - sending attended refer", self);
        self.sendReferAttended(sessionToTransfer, targetSession, transferTarget, options);
      };

      var holdTargetFailed = function(){
        logger.log("transfer : hold target failed", self);
      };

      var sendTargetInviteSuccess = function(){
        logger.log("transfer : send invite to target success - putting target on hold", self);
        targetSession.hold(holdTargetSuccess, holdTargetFailed);
      };

      var sendTargetInviteFailed = function(response){
        logger.log("transfer : send invite to target failed - sending basic refer", self);
        if(response.status_code === 420) {
          self.sendReferBasic(sessionToTransfer, transferTarget, options);
        }
      };

      var holdFailed = function(){
        logger.log("transfer : hold failed", self);
      };

      var holdSuccess = function(){
        logger.log("transfer : hold success - sending invite to target", self);
        targetSession.sendInviteRequest(transferTarget, {extraHeaders: ["Require: replaces"]},
          sendTargetInviteSuccess, sendTargetInviteFailed);
      };

      logger.log("transfer : holding session to transfer", self);
      sessionToTransfer.hold(holdSuccess, holdFailed);
    };

    UA.prototype.sendReferAttended = function(sessionToTransfer, targetSession, transferTarget, options) {
      var referSession = this.getReferSession(sessionToTransfer, options);
      options = this.getReferOptions(sessionToTransfer, targetSession, options);
      var referTo = "<"+(transferTarget).toString()+
        "?Replaces="+targetSession.dialog.id.call_id+
        "%3Bto-tag%3D"+targetSession.dialog.id.remote_tag+
        "%3Bfrom-tag%3D"+targetSession.dialog.id.local_tag+">";
      options.extraHeaders.push('Refer-To: '+referTo);
      referSession.sendReferRequest(sessionToTransfer, options);
    };

    UA.prototype.processRefer = function(sessionToTransfer, referRequest) {
      referRequest.reply(202);
      var notifySuccess = function() {
        logger.log("Notify successful");
      };
      var notifyFailure = function() {
        logger.log("Notify failed");
      };
      sessionToTransfer.sendNotifyRequest({sdp: "SIP/2.0 100 Trying"}, notifySuccess, notifyFailure);
    };

    UA.prototype.sendReferBasic = function(sessionToTransfer, transferTarget, options) {
      var referSession = this.getReferSession(sessionToTransfer, options);
      options = this.getReferOptions(sessionToTransfer, sessionToTransfer, options);
      options.extraHeaders.push('Refer-To: <' + transferTarget + '>');
      referSession.sendReferRequest(sessionToTransfer, options);
    };

    UA.prototype.getReferOptions = function(sessionToTransfer, targetDialogSession, options) {
      options = options || {};
      options.extraHeaders = options.extraHeaders || [];
      if(sessionToTransfer.supports("tdialog")) {
        options.extraHeaders.push('Require: tdialog');
        var localTag = targetDialogSession.dialog.isUAS() ? targetDialogSession.dialog.id.remote_tag : targetDialogSession.dialog.id.local_tag;
        var remoteTag = targetDialogSession.dialog.isUAS() ? targetDialogSession.dialog.id.local_tag : targetDialogSession.dialog.id.remote_tag;
        var targetDialog = targetDialogSession.dialog.id.call_id+";local-tag="+localTag+";remote-tag="+remoteTag;
        options.extraHeaders.push('Target-Dialog: '+targetDialog);
      }
      return options;
    };

    UA.prototype.getReferSession = function(sessionToTransfer, options) {
      if(sessionToTransfer.supports("tdialog")) {
        return this.newSession(options);
      } else {
        logger.warn('tdialog not supported - sending refer in same session : '+sessionToTransfer.id, this);
        return sessionToTransfer;
      }
    };

    UA.prototype.newSession = function(options) {
      var session = new ExSIP.RTCSession(this);
      session.initRtcMediaHandler(options);
      return session;
    };

    UA.prototype.getUserMedia = function(options, success, failure, force) {
      if(!force && this.localMedia) {
        return this.localMedia;
      }

      if(this.localMedia) {
        logger.log("stopping existing local media stream", this);
        this.localMedia.stop();
      }

      logger.log('options : '+ExSIP.Utils.toString(options), this);
      var self = this;
      var constraints = options.mediaConstraints || {audio: true, video: true};
      ExSIP.WebRTC.getUserMedia(constraints,
        function(stream) {
          logger.log('got local media stream', self);
          self.localMedia = stream;
          success(stream);
        },
        function(e) {
          logger.error('unable to get user media');
          logger.error(e);
          failure(e);
        }
      );
    };

    /**
     * Send a message.
     *
     * @param {String} target
     * @param {String} body
     * @param {Object} [options]
     *
     * @throws {TypeError}
     *
     */
    UA.prototype.sendMessage = function(target, body, options) {
        var message;

        message = new ExSIP.Message(this);
        message.send(target, body, options);
    };

    /**
     * Gracefully close.
     *
     */
    UA.prototype.stop = function() {
        var session, applicant,
            ua = this;

        logger.log('user requested closure...', this);

        if(this.status === C.STATUS_USER_CLOSED) {
            logger.warn('UA already closed', this);
            return;
        }

        // Close registrator
        if(this.registrator) {
            logger.log('closing registrator', this);
            this.registrator.close();
        }

        // Run  _terminate_ on every Session
        for(session in this.sessions) {
            logger.log('closing session ' + session, this);
            this.sessions[session].terminate();
        }

        // Run  _close_ on every applicant
        for(applicant in this.applicants) {
            this.applicants[applicant].close();
        }

        this.status = C.STATUS_USER_CLOSED;
        var transport = ua.transport;
        this.shutdownGraceTimer = window.setTimeout(
            function() { transport.disconnect(); },
            '5000'
        );
    };

    UA.prototype.reconnect = function() {
      this.stop();
      this.status = C.STATUS_INIT;
      this.start();
    };

    /**
     * Connect to the WS server if status = STATUS_INIT.
     * Resume UA after being closed.
     *
     */
    UA.prototype.start = function() {
        var server;

        logger.log('user requested startup...', this);

        if (this.status === C.STATUS_INIT) {
            server = this.getNextWsServer({force: true});
            new ExSIP.Transport(this, server);
        } else if(this.status === C.STATUS_USER_CLOSED) {
            logger.log('resuming', this);
            this.status = C.STATUS_READY;
            this.transport.connect();
        } else if (this.status === C.STATUS_READY) {
            logger.log('UA is in READY status, not resuming', this);
        } else {
            logger.error('Connection is down. Auto-Recovery system is trying to connect');
        }
    };

    UA.prototype.setRtcMediaHandlerOptions = function(rtcMediaHandlerOptions) {
        this.rtcMediaHandlerOptions = rtcMediaHandlerOptions;
    };

    UA.prototype.rtcConstraints = function() {
      return this.rtcMediaHandlerOptions ? this.rtcMediaHandlerOptions["RTCConstraints"] : false;
    };

    UA.prototype.reuseLocalMedia = function() {
        return this.rtcMediaHandlerOptions ? this.rtcMediaHandlerOptions["reuseLocalMedia"] : false;
    };

//===============================
//  Private (For internal use)
//===============================

    UA.prototype.saveCredentials = function(credentials) {
        this.cache.credentials[credentials.realm] = this.cache.credentials[credentials.realm] || {};
        this.cache.credentials[credentials.realm][credentials.uri] = credentials;
    };

    UA.prototype.getCredentials = function(request) {
        var realm, credentials;

        realm = request.ruri.host;

        if (this.cache.credentials[realm] && this.cache.credentials[realm][request.ruri]) {
            credentials = this.cache.credentials[realm][request.ruri];
            credentials.method = request.method;
        }

        return credentials;
    };


//==========================
// Event Handlers
//==========================

    /**
     * Transport Close event.
     * @private
     * @event
     * @param {ExSIP.Transport} transport.
     */
    UA.prototype.onTransportClosed = function(transport) {
        // Run _onTransportError_ callback on every client transaction using _transport_
        var type, idx, length,
            client_transactions = ['nict', 'ict', 'nist', 'ist'];

        transport.server.status = ExSIP.Transport.C.STATUS_DISCONNECTED;
        logger.log('connection state set to '+ ExSIP.Transport.C.STATUS_DISCONNECTED, this);

        length = client_transactions.length;
        for (type = 0; type < length; type++) {
            for(idx in this.transactions[client_transactions[type]]) {
                this.transactions[client_transactions[type]][idx].onTransportError();
            }
        }

        // Close sessions if GRUU is not being used
        if (!this.contact.pub_gruu) {
            this.closeSessionsOnTransportError();
        }

    };

    /**
     * Unrecoverable transport event.
     * Connection reattempt logic has been done and didn't success.
     * @private
     * @event
     * @param {ExSIP.Transport} transport.
     */
    UA.prototype.onTransportError = function(transport, options) {
        options = options || {};
        if(this.status === C.STATUS_USER_CLOSED){
          return;
        }

        logger.log('transport ' + transport.server.ws_uri + ' failed | connection state set to '+ ExSIP.Transport.C.STATUS_ERROR, this);

        // Close sessions.
        //Mark this transport as 'down' and try the next one
        transport.server.status = ExSIP.Transport.C.STATUS_ERROR;

        this.closeSessionsOnTransportError();
        if (!this.error || this.error !== C.NETWORK_ERROR) {
          this.status = C.STATUS_NOT_READY;
          this.error = C.NETWORK_ERROR;
        }
        // Transport Recovery process
        this.recoverTransport(options);

        var data = ExSIP.Utils.merge_options({
          transport: transport,
          code: transport.lastTransportError.code,
          reason: transport.lastTransportError.reason
        }, options);
        this.emit('disconnected', this, data);
    };

    /**
     * Transport connection event.
     * @private
     * @event
     * @param {ExSIP.Transport} transport.
     */
    UA.prototype.onTransportConnected = function(transport) {
        this.transport = transport;

        // Reset transport recovery counter
        this.transportRecoverAttempts = 0;

        transport.server.status = ExSIP.Transport.C.STATUS_READY;
        logger.log('connection state set to '+ ExSIP.Transport.C.STATUS_READY, this);

        if(this.status === C.STATUS_USER_CLOSED) {
            return;
        }

        this.status = C.STATUS_READY;
        this.error = null;
        this.emit('connected', this, {
            transport: transport
        });

        if(this.configuration.register) {
            if(this.registrator) {
                this.registrator.onTransportConnected();
            } else {
                this.registrator = new ExSIP.Registrator(this, transport);
                this.register();
            }
        } else if (!this.registrator) {
            this.registrator = new ExSIP.Registrator(this, transport);
        }
    };

//=========================
// receiveRequest
//=========================

    /**
     * Request reception
     * @private
     * @param {ExSIP.IncomingRequest} request.
     */
    UA.prototype.receiveRequest = function(request) {
        var dialog, session, message,
            method = request.method;

      // Check that Ruri points to us
        if(request.ruri.user !== this.configuration.uri.user && request.ruri.user !== this.contact.uri.user) {
            logger.warn('Request-URI ('+request.ruri.user+') does not point to us ('+this.configuration.uri.user+')', this);
            if (request.method !== ExSIP.C.ACK) {
                request.reply_sl(404);
            }
            return;
        }

        // Check transaction
        if(ExSIP.Transactions.checkTransaction(this, request)) {
            logger.warn('Check Transaction failed', this);
            return;
        }

        // Create the server transaction
        if(method === ExSIP.C.INVITE) {
            new ExSIP.Transactions.InviteServerTransaction(request, this);
        } else if(method !== ExSIP.C.ACK) {
            new ExSIP.Transactions.NonInviteServerTransaction(request, this);
        }

        /* RFC3261 12.2.2
         * Requests that do not change in any way the state of a dialog may be
         * received within a dialog (for example, an OPTIONS request).
         * They are processed as if they had been received outside the dialog.
         */
        if(method === ExSIP.C.OPTIONS) {
            request.reply(200, null, [
                'Allow: '+ ExSIP.Utils.getAllowedMethods(this),
                'Accept: '+ C.ACCEPTED_BODY_TYPES
            ]);
        } else if (method === ExSIP.C.MESSAGE) {
            if (!this.checkEvent('newMessage') || this.listeners('newMessage').length === 0) {
                request.reply(405, null, ['Allow: '+ ExSIP.Utils.getAllowedMethods(this)]);
                return;
            }
            message = new ExSIP.Message(this);
            message.init_incoming(request);
        }

        // Initial Request
        if(!request.to_tag) {
            /*if(!this.isRegistered()) {
             // High user does not want to be contacted
             request.reply(410);
             return;
             }*/

            switch(method) {
                case ExSIP.C.INVITE:
                    if(ExSIP.WebRTC.isSupported) {
                        logger.debug('INVITE received', this);
                        session = new ExSIP.RTCSession(this);
                        session.init_incoming(request);
                    } else {
                        logger.warn('INVITE received but WebRTC is not supported', this);
                        request.reply(488);
                    }
                    break;
                case ExSIP.C.BYE:
                    // Out of dialog BYE received
                    request.reply(481);
                    break;
                case ExSIP.C.CANCEL:
                    session = this.findSession(request);
                    if(session) {
                        session.receiveRequest(request);
                    } else {
                        logger.warn('received CANCEL request for a non existent session', this);
                    }
                    break;
                case ExSIP.C.ACK:
                    /* Absorb it.
                     * ACK request without a corresponding Invite Transaction
                     * and without To tag.
                     */
                    break;
                default:
                    request.reply(405);
                    break;
            }
        }
        // In-dialog request
        else {
            dialog = this.findDialog(request);

            if(dialog) {
                dialog.receiveRequest(request);
            } else if (method === ExSIP.C.NOTIFY) {
                session = this.findSession(request);
                if(session) {
                  logger.log('received NOTIFY request for session : '+session.id, this);
                  session.receiveRequest(request);
                } else {
                    logger.warn('received NOTIFY request for a non existent session', this);
                    logger.log('request : '+(request.call_id + "-" + request.from_tag + "-" + request.to_tag), this);
                    logger.log('sessions : '+Object.keys(this.sessions), this);
                    request.reply(481, 'Subscription does not exist');
                }
            }
            /* RFC3261 12.2.2
             * Request with to tag, but no matching dialog found.
             * Exception: ACK for an Invite request for which a dialog has not
             * been created.
             */
            else {
                if(method !== ExSIP.C.ACK) {
                    request.reply(481);
                }
            }
        }
    };

//=================
// Utils
//=================

    /**
     * Get the session to which the request belongs to, if any.
     * @private
     * @param {ExSIP.IncomingRequest} request.
     * @returns {ExSIP.OutgoingSession|ExSIP.IncomingSession|null}
     */
    UA.prototype.findSession = function(request) {
        var
            sessionIDa = request.call_id + request.from_tag,
            sessionA = this.sessions[sessionIDa],
            sessionIDb = request.call_id + request.to_tag,
            sessionB = this.sessions[sessionIDb];

        if(sessionA) {
            return sessionA;
        } else if(sessionB) {
            return sessionB;
        } else {
            return null;
        }
    };

    /**
     * Get the dialog to which the request belongs to, if any.
     * @private
     * @param {ExSIP.IncomingRequest}
        * @returns {ExSIP.Dialog|null}
     */
    UA.prototype.findDialog = function(request) {
        var
            id = request.call_id + request.from_tag + request.to_tag,
            dialog = this.dialogs[id];

        if(dialog) {
            return dialog;
        } else {
            id = request.call_id + request.to_tag + request.from_tag;
            dialog = this.dialogs[id];
            if(dialog) {
                return dialog;
            } else {
                return null;
            }
        }
    };

    /**
     * Retrieve the next server to which connect.
     * @private
     * @returns {Object} ws_server
     */
    UA.prototype.getNextWsServer = function(options) {
      options = options || {};

      // reset if all servers have been used
      if(options.force && this.usedServers.length >= this.configuration.ws_servers.length) {
        this.usedServers = [];
      }

      var candidates = [];
      var totalWeight = 0;
      // Add only server with status ready and not already used
      for(var i=0; i < this.configuration.ws_servers.length; i++){
        var server = this.configuration.ws_servers[i];
        if(server.status === ExSIP.Transport.C.STATUS_READY && this.usedServers.indexOf(server) === -1) {
          candidates.push(server);
          totalWeight += (server.weight || 1);
        }
      }

      var weightedServers = []; //new array to hold "weighted" servers
      for (var j = 0; j < candidates.length; j++) {
        var candidate = candidates[j];
        for (var k = 0; k < (candidate.weight || 1); k++) {
          weightedServers.push(candidate);
        }
      }

      var randomNumber = Math.floor(Math.random() * totalWeight);
      var index = Math.min(randomNumber, weightedServers.length-1);
      return weightedServers[index];
    };

    /**
     * Close all sessions on transport error.
     * @private
     */
    UA.prototype.closeSessionsOnTransportError = function() {
        var idx;

        // Run _transportError_ for every Session
        for(idx in this.sessions) {
            this.sessions[idx].onTransportError();
        }
        // Call registrator _onTransportClosed_
        if(this.registrator){
            this.registrator.onTransportClosed();
        }
    };

    UA.prototype.retry = function(nextRetry, server, callback) {
      var self = this;
      var retryCallback = function(){
        var transport = new ExSIP.Transport(self, server);
        if(callback) {
          callback(transport);
        }
      };

      if(nextRetry === 0) {
        retryCallback();
      } else {
        window.setTimeout(retryCallback, nextRetry * 1000);
      }
    };

    UA.prototype.recoverTransport = function(options) {
        var idx, length, k, nextRetry, count, server;

        options = options || {};
        count = this.transportRecoverAttempts;

        length = this.configuration.ws_servers.length;
        for (idx = 0; idx < length; idx++) {
          this.configuration.ws_servers[idx].status = ExSIP.Transport.C.STATUS_READY;
        }

        server = this.getNextWsServer();
        if(options.code === 503 && !server) {
          delete options.retryAfter;
          logger.log('non-failover on 503 error - skipping recoverTransport', this);
          return;
        }

        var maxTransportRecoveryAttempts = this.configuration.max_transport_recovery_attempts;
        if(typeof(maxTransportRecoveryAttempts) !== "undefined" && count >= parseInt(maxTransportRecoveryAttempts, 10)) {
          delete options.retryAfter;
          logger.log('recover attempts '+count+" exceed max transport recovery attempts "+maxTransportRecoveryAttempts+" - skipping recoverTransport");
          return;
        }

        if(server) {
          logger.log('failover - new connection attempt with '+server.ws_uri);
          this.retry(0, server, options.retryCallback);
          return;
        }

        if(options.retryAfter){
          nextRetry = options.retryAfter;
        } else {
          k = Math.floor((Math.random() * Math.pow(2,count)) +1);
          nextRetry = k * this.configuration.connection_recovery_min_interval;

          if (nextRetry > this.configuration.connection_recovery_max_interval) {
            logger.log('time for next connection attempt exceeds connection_recovery_max_interval, resetting counter', this);
            nextRetry = this.configuration.connection_recovery_min_interval;
            count = 0;
          }
        }

        server = this.getNextWsServer({force: true});
        logger.log('resetting ws server list - next connection attempt in '+ nextRetry +' seconds to '+server.ws_uri, this);
        this.transportRecoverAttempts = count + 1;
        this.retry(nextRetry, server, options.retryCallback);
    };

    /**
     * Configuration load.
     * @private
     * returns {Boolean}
     */
    UA.prototype.loadConfig = function(configuration) {
        // Settings and default values
        var parameter, value, checked_value, hostport_params, registrar_server,
            settings = {
                /* Host address
                 * Value to be set in Via sent_by and host part of Contact FQDN
                 */
                via_host: ExSIP.Utils.createRandomToken(12) + '.invalid',

                // Password
                password: null,


                // Registration parameters
                register_expires: 600,
                register_min_expires: 120,
                register: true,
                registrar_server: null,

                // Transport related parameters
                ws_server_max_reconnection: 3,
                ws_server_reconnection_timeout: 4,

                connection_recovery_min_interval: 2,
                connection_recovery_max_interval: 30,

                use_preloaded_route: false,

                // Session parameters
                no_answer_timeout: 60,
                stun_servers: ['stun:stun.l.google.com:19302'],
                turn_servers: [],

                // Logging parameters
                trace_sip: false,

                // Hacks
                enable_datachannel: false,
                enable_ims: false,
                hack_via_tcp: false,
                hack_ip_in_contact: false,
                p_asserted_identity: null

            };

        // Pre-Configuration

        // Check Mandatory parameters
        for(parameter in UA.configuration_check.mandatory) {
            if(!configuration.hasOwnProperty(parameter)) {
                throw new ExSIP.Exceptions.ConfigurationError(parameter);
            } else {
                value = configuration[parameter];
                checked_value = UA.configuration_check.mandatory[parameter](value);
                if (checked_value !== undefined) {
                    settings[parameter] = checked_value;
                } else {
                    throw new ExSIP.Exceptions.ConfigurationError(parameter, value);
                }
            }
        }

        // Check Optional parameters
        for(parameter in UA.configuration_check.optional) {
            if(configuration.hasOwnProperty(parameter)) {
                value = configuration[parameter];

                // If the parameter value is null, empty string or undefined then apply its default value.
                if(value === null || value === "" || value === undefined) { continue; }
                // If it's a number with NaN value then also apply its default value.
                // NOTE: JS does not allow "value === NaN", the following does the work:
                else if(typeof(value) === 'number' && window.isNaN(value)) { continue; }

                checked_value = UA.configuration_check.optional[parameter](value);
                if (checked_value !== undefined) {
                    settings[parameter] = checked_value;
                } else {
                    throw new ExSIP.Exceptions.ConfigurationError(parameter, value);
                }
            }
        }

        // Sanity Checks

        // Connection recovery intervals
        if(settings.connection_recovery_max_interval < settings.connection_recovery_min_interval) {
            throw new ExSIP.Exceptions.ConfigurationError('connection_recovery_max_interval', settings.connection_recovery_max_interval);
        }

        // Post Configuration Process

        // Allow passing 0 number as display_name.
        if (settings.display_name === 0) {
            settings.display_name = '0';
        }

        // Instance-id for GRUU
        settings.instance_id = ExSIP.Utils.newUUID();

        // exsip_id instance parameter. Static random tag of length 5
        settings.exsip_id = ExSIP.Utils.createRandomToken(5);

        // String containing settings.uri without scheme and user.
        hostport_params = settings.uri.clone();
        hostport_params.user = null;
        settings.hostport_params = hostport_params.toString().replace(/^sip:/i, '');

        /* Check whether authorization_user is explicitly defined.
         * Take 'settings.uri.user' value if not.
         */
        if (!settings.authorization_user) {
            settings.authorization_user = settings.uri.user;
        }

        /* If no 'registrar_server' is set use the 'uri' value without user portion. */
        if (!settings.registrar_server) {
            registrar_server = settings.uri.clone();
            registrar_server.user = null;
            settings.registrar_server = registrar_server;
        }

        // User no_answer_timeout
        settings.no_answer_timeout = settings.no_answer_timeout * 1000;

        // Via Host
        if (settings.hack_ip_in_contact) {
            settings.via_host = ExSIP.Utils.getRandomTestNetIP();
        }

        this.contact = {
            pub_gruu: null,
            temp_gruu: null,
            uri: new ExSIP.URI('sip', ExSIP.Utils.createRandomToken(8), settings.via_host, null, {transport: 'ws'}),
            toString: function(options){
                options = options || {};

                var
                    anonymous = options.anonymous || null,
                    outbound = options.outbound || null,
                    contact = '<';

                if (anonymous) {
                    contact += this.temp_gruu || 'sip:anonymous@anonymous.invalid;transport=ws';
                } else {
                    contact += this.pub_gruu || this.uri.toString();
                }

                if (outbound) {
                    contact += ';ob';
                }

                contact += '>';

                return contact;
            }
        };

        // Fill the value of the configuration_skeleton
        var debug = settings['trace_sip'] === true;
        if(debug) {
          logger.log('configuration parameters after validation:');
        }
        for(parameter in settings) {
            if(debug) {
              switch(parameter) {
                  case 'uri':
                  case 'registrar_server':
                      logger.log('· ' + parameter + ': ' + settings[parameter]);
                      break;
                  case 'password':
                      logger.log('· ' + parameter + ': ' + 'NOT SHOWN');
                      break;
                  default:
                      logger.log('· ' + parameter + ': ' + window.JSON.stringify(settings[parameter]));
              }
            }
            UA.configuration_skeleton[parameter].value = settings[parameter];
        }

        Object.defineProperties(this.configuration, UA.configuration_skeleton);

        // Clean UA.configuration_skeleton
        for(parameter in settings) {
            UA.configuration_skeleton[parameter].value = '';
        }

        return;
    };


    /**
     * Configuration Object skeleton.
     * @private
     */
    UA.configuration_skeleton = (function() {
        var idx,  parameter,
            skeleton = {},
            parameters = [
                // Internal parameters
                "instance_id",
                "exsip_id",
                "register_min_expires",
                "ws_server_max_reconnection",
                "hostport_params",

                // Mandatory user configurable parameters
                "uri",
                "ws_servers",

                // Optional user configurable parameters
                "authorization_user",
                "ws_server_reconnection_timeout",
                "connection_recovery_max_interval",
                "connection_recovery_min_interval",
                "max_transport_recovery_attempts",
                "display_name",
                "hack_via_tcp", // false.
                "enable_ims", // false.
                "p_asserted_identity", // false.
                "enable_datachannel", // false.
                "hack_ip_in_contact", //false
                "no_answer_timeout", // 30 seconds.
                "password",
                "register_expires", // 600 seconds.
                "registrar_server",
                "stun_servers",
                "trace_sip",
                "turn_servers",
                "use_preloaded_route",

                // Post-configuration generated parameters
                "via_core_value",
                "via_host"
            ];

        for(idx in parameters) {
            parameter = parameters[idx];
            skeleton[parameter] = {
                value: '',
                writable: false,
                configurable: false
            };
        }

        skeleton['register'] = {
            value: '',
            writable: true,
            configurable: false
        };

        return skeleton;
    }());

    /**
     * Configuration checker.
     * @private
     * @return {Boolean}
     */
    UA.configuration_check = {
        mandatory: {

            uri: function(uri) {
                var parsed;

                if (!/^sip:/i.test(uri)) {
                    uri = ExSIP.C.SIP + ':' + uri;
                }
                parsed = ExSIP.URI.parse(uri);

                if(!parsed) {
                    return;
                } else if(!parsed.user) {
                    return;
                } else {
                    return parsed;
                }
            },

            ws_servers: function(ws_servers) {
                var idx, length, url;

                /* Allow defining ws_servers parameter as:
                 *  String: "host"
                 *  Array of Strings: ["host1", "host2"]
                 *  Array of Objects: [{ws_uri:"host1", weight:1}, {ws_uri:"host2", weight:0}]
                 *  Array of Objects and Strings: [{ws_uri:"host1"}, "host2"]
                 */
                if (typeof ws_servers === 'string') {
                    ws_servers = [{ws_uri: ws_servers}];
                } else if (ws_servers instanceof Array) {
                    length = ws_servers.length;
                    for (idx = 0; idx < length; idx++) {
                        if (typeof ws_servers[idx] === 'string'){
                            ws_servers[idx] = {ws_uri: ws_servers[idx]};
                        }
                    }
                } else {
                    return;
                }

                if (ws_servers.length === 0) {
                    return false;
                }

                length = ws_servers.length;
                for (idx = 0; idx < length; idx++) {
                    if (!ws_servers[idx].ws_uri) {
                        logger.error('missing "ws_uri" attribute in ws_servers parameter');
                        return;
                    }
                    if (ws_servers[idx].weight && !Number(ws_servers[idx].weight)) {
                        logger.error('"weight" attribute in ws_servers parameter must be a Number');
                        return;
                    }

                    url = ExSIP.Grammar.parse(ws_servers[idx].ws_uri, 'absoluteURI');

                    if(url === -1) {
                        logger.error('invalid "ws_uri" attribute in ws_servers parameter: ' + ws_servers[idx].ws_uri);
                        return;
                    } else if(url.scheme !== 'wss' && url.scheme !== 'ws') {
                        logger.error('invalid URI scheme in ws_servers parameter: ' + url.scheme);
                        return;
                    } else {
                        ws_servers[idx].sip_uri = '<sip:' + url.host + (url.port ? ':' + url.port : '') + ';transport=ws;lr>';

                        if (!ws_servers[idx].weight) {
                            ws_servers[idx].weight = 0;
                        }

                        ws_servers[idx].status = 0;
                        ws_servers[idx].scheme = url.scheme.toUpperCase();
                    }
                }
                return ws_servers;
            }
        },

        optional: {

            authorization_user: function(authorization_user) {
                if(ExSIP.Grammar.parse('"'+ authorization_user +'"', 'quoted_string') === -1) {
                    return;
                } else {
                    return authorization_user;
                }
            },

            connection_recovery_max_interval: function(connection_recovery_max_interval) {
                var value;
                if(ExSIP.Utils.isDecimal(connection_recovery_max_interval)) {
                    value = window.Number(connection_recovery_max_interval);
                    if(value > 0) {
                        return value;
                    }
                }
            },

            connection_recovery_min_interval: function(connection_recovery_min_interval) {
                var value;
                if(ExSIP.Utils.isDecimal(connection_recovery_min_interval)) {
                    value = window.Number(connection_recovery_min_interval);
                    if(value >= 0) {
                        return value;
                    }
                }
            },

            ws_server_reconnection_timeout: function(ws_server_reconnection_timeout) {
                var value;
                if(ExSIP.Utils.isDecimal(ws_server_reconnection_timeout)) {
                    value = window.Number(ws_server_reconnection_timeout);
                    if(value >= 0) {
                        return value;
                    }
                }
            },

            max_transport_recovery_attempts: function(max_transport_recovery_attempts) {
                var value;
                if(ExSIP.Utils.isDecimal(max_transport_recovery_attempts)) {
                    value = window.Number(max_transport_recovery_attempts);
                    if(value >= 0) {
                        return value;
                    }
                }
            },

            display_name: function(display_name) {
                if(ExSIP.Grammar.parse('"' + display_name + '"', 'display_name') === -1) {
                    return;
                } else {
                    return display_name;
                }
            },

            hack_via_tcp: function(hack_via_tcp) {
                if (typeof hack_via_tcp === 'boolean') {
                    return hack_via_tcp;
                }
            },

            enable_ims: function(enable_ims) {
                if (typeof enable_ims === 'boolean') {
                    return enable_ims;
                }
            },

            p_asserted_identity: function(p_asserted_identity) {
              return String(p_asserted_identity);
            },

            enable_datachannel: function(enable_datachannel) {
                if (typeof enable_datachannel === 'boolean') {
                    return enable_datachannel;
                }
            },

            hack_ip_in_contact: function(hack_ip_in_contact) {
                if (typeof hack_ip_in_contact === 'boolean') {
                    return hack_ip_in_contact;
                }
            },

            no_answer_timeout: function(no_answer_timeout) {
                var value;
                if (ExSIP.Utils.isDecimal(no_answer_timeout)) {
                    value = window.Number(no_answer_timeout);
                    if (value > 0) {
                        return value;
                    }
                }
            },

            password: function(password) {
                return String(password);
            },

            register: function(register) {
                if (typeof register === 'boolean') {
                    return register;
                }
            },

            register_expires: function(register_expires) {
                var value;
                if (ExSIP.Utils.isDecimal(register_expires)) {
                    value = window.Number(register_expires);
                    if (value > 0) {
                        return value;
                    }
                }
            },

            registrar_server: function(registrar_server) {
                var parsed;

                if (!/^sip:/i.test(registrar_server)) {
                    registrar_server = ExSIP.C.SIP + ':' + registrar_server;
                }
                parsed = ExSIP.URI.parse(registrar_server);

                if(!parsed) {
                    return;
                } else if(parsed.user) {
                    return;
                } else {
                    return parsed;
                }
            },

            stun_servers: function(stun_servers) {
                var idx, length, stun_server;

                if (typeof stun_servers === 'string') {
                    stun_servers = [stun_servers];
                } else if (!(stun_servers instanceof Array)) {
                    return;
                }

                length = stun_servers.length;
                for (idx = 0; idx < length; idx++) {
                    stun_server = stun_servers[idx];
                    if (!(/^stuns?:/.test(stun_server))) {
                        stun_server = 'stun:' + stun_server;
                    }

                    if(ExSIP.Grammar.parse(stun_server, 'stun_URI') === -1) {
                        return;
                    } else {
                        stun_servers[idx] = stun_server;
                    }
                }
                return stun_servers;
            },

            trace_sip: function(trace_sip) {
                if (typeof trace_sip === 'boolean') {
                    return trace_sip;
                }
            },

            turn_servers: function(turn_servers) {
                var idx, length, turn_server;

                if (turn_servers instanceof Array) {
                    // Do nothing
                } else {
                    turn_servers = [turn_servers];
                }

                length = turn_servers.length;
                for (idx = 0; idx < length; idx++) {
                    turn_server = turn_servers[idx];
                    if (!turn_server.server || !turn_server.username || !turn_server.password) {
                        return;
                    } else if (!(/^turns?:/.test(turn_server.server))) {
                        turn_server.server = 'turn:' + turn_server.server;
                    }

                    if(ExSIP.Grammar.parse(turn_server.server, 'turn_URI') === -1) {
                        return;
                    } else if(ExSIP.Grammar.parse(turn_server.username, 'user') === -1) {
                        return;
                    } else if(ExSIP.Grammar.parse(turn_server.password, 'password') === -1) {
                        return;
                    }
                }
                return turn_servers;
            },

            use_preloaded_route: function(use_preloaded_route) {
                if (typeof use_preloaded_route === 'boolean') {
                    return use_preloaded_route;
                }
            }
        }
    };

    UA.C = C;
    ExSIP.UA = UA;
}(ExSIP));



/**
 * @fileoverview Utils
 */

(function(ExSIP) {
var Utils;

Utils= {

  inArray: function(array, el) {
    for ( var i = array.length; i--; ) {
      if ( array[i] === el ) { return true; }
    }
    return false;
  },

  isEqArrays: function(arr1, arr2) {
    if ( arr1 === null && arr2 !== null ) {
      return false;
    }
    if ( arr1 !== null && arr2 === null ) {
      return false;
    }
    if ( arr1 === null && arr2 === null ) {
      return true;
    }
    if ( arr1.length !== arr2.length ) {
      return false;
    }
    for ( var i = arr1.length; i--; ) {
      if ( !this.inArray( arr2, arr1[i] ) ) {
        return false;
      }
    }
    return true;
  },

  /**
   * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
   * @param obj1
   * @param obj2
   * @returns obj3 a new object based on obj1 and obj2
   */
  merge_options: function(obj1,obj2){
      var obj3 = {};
      for (var attrname1 in obj1) { obj3[attrname1] = obj1[attrname1]; }
      for (var attrname2 in obj2) { obj3[attrname2] = obj2[attrname2]; }
      return obj3;
  },

  str_utf8_length: function(string) {
    return window.unescape(encodeURIComponent(string)).length;
  },

  toString: function(object) {
    var seen = [];

    return JSON.stringify(object, function(key, val) {
      if (typeof val === "object") {
        if (seen.indexOf(val) >= 0) {
          return;
        }
        seen.push(val);
      }
      return val;
    });
  },

  isFunction: function(fn) {
    if (fn !== undefined) {
      return (Object.prototype.toString.call(fn) === '[object Function]')? true : false;
    } else {
      return false;
    }
  },

  isDecimal: function (num) {
    return !isNaN(num) && (parseFloat(num) === parseInt(num,10));
  },

  getHeadersFromQuery: function (query) {
    var headers = [];
    var queryParts = query.split("&");
    for(var i=0; i<queryParts.length; i++) {
      var parameters = queryParts[i].split("=");
      headers.push(parameters[0]+": "+decodeURIComponent(parameters[1]));
    }
    return headers;
  },

  stripSip: function (address) {
    var match = address.match(/<sip\:(.*)\>/);
    return match ? match[1] : address;
  },

  createRandomToken: function(size, base) {
    var i, r,
      token = '';

    base = base || 32;

    for( i=0; i < size; i++ ) {
      r = Math.random() * base|0;
      token += r.toString(base);
    }

    return token;
  },

  newTag: function() {
    return ExSIP.Utils.createRandomToken(ExSIP.UA.C.TAG_LENGTH);
  },

  // http://stackoverflow.com/users/109538/broofa
  newUUID: function() {
    var UUID =  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });

    return UUID;
  },

  hostType: function(host) {
    if (!host) {
      return;
    } else {
      host = ExSIP.Grammar.parse(host,'host');
      if (host !== -1) {
        return host.host_type;
      }
    }
  },

  /**
  * Normalize SIP URI.
  * NOTE: It does not allow a SIP URI without username.
  * Accepts 'sip', 'sips' and 'tel' URIs and convert them into 'sip'.
  * Detects the domain part (if given) and properly hex-escapes the user portion.
  * If the user portion has only 'tel' number symbols the user portion is clean of 'tel' visual separators.
  * @private
  * @param {String} target
  * @param {String} [domain]
  */
  normalizeURI: function(target, domain) {
    var uri, target_array, target_user, target_domain,
      original_target = target;

    // If no target is given then raise an error.
    if (!target) {
      throw new ExSIP.Exceptions.InvalidTargetError(original_target);

    // If a ExSIP.URI instance is given then return it.
    } else if (target instanceof ExSIP.URI) {
      return target;

    // If a string is given split it by '@':
    // - Last fragment is the desired domain.
    // - Otherwise append the given domain argument.
    } else if (typeof target === 'string') {
      target_array = target.split('@');

      switch(target_array.length) {
        case 1:
          if (!domain) {
            throw new ExSIP.Exceptions.InvalidTargetError(original_target);
          }
          target_user = target;
          target_domain = domain;
          break;
        case 2:
          target_user = target_array[0];
          target_domain = target_array[1];
          break;
        default:
          target_user = target_array.slice(0, target_array.length-1).join('@');
          target_domain = target_array[target_array.length-1];
      }

      // Remove the URI scheme (if present).
      target_user = target_user.replace(/^(sips?|tel):/i, '');

      // Remove 'tel' visual separators if the user portion just contains 'tel' number symbols.
      if (/^[\-\.\(\)]*\+?[0-9\-\.\(\)]+$/.test(target_user)) {
        target_user = target_user.replace(/[\-\.\(\)]/g, '');
      }

      // Build the complete SIP URI.
      target = ExSIP.C.SIP + ':' + ExSIP.Utils.escapeUser(target_user) + '@' + target_domain;

      // Finally parse the resulting URI.
      if (uri = ExSIP.URI.parse(target)) {
        return uri;
      } else {
        throw new ExSIP.Exceptions.InvalidTargetError(original_target);
      }
    }

    // Otherwise raise an error.
    else {
      throw new ExSIP.Exceptions.InvalidTargetError(original_target);
    }
  },

  /**
  * Hex-escape a SIP URI user.
  * @private
  * @param {String} user
  */
  escapeUser: function(user) {
    // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
    return window.encodeURIComponent(window.decodeURIComponent(user)).replace(/%3A/ig, ':').replace(/%2B/ig, '+').replace(/%3F/ig, '?').replace(/%2F/ig, '/');
  },

  headerize: function(string) {
    var exceptions = {
      'Call-Id': 'Call-ID',
      'Cseq': 'CSeq',
      'Www-Authenticate': 'WWW-Authenticate'
      },
      name = string.toLowerCase().replace(/_/g,'-').split('-'),
      hname = '',
      parts = name.length, part;

    for (part = 0; part < parts; part++) {
      if (part !== 0) {
        hname +='-';
      }
      hname += name[part].charAt(0).toUpperCase()+name[part].substring(1);
    }
    if (exceptions[hname]) {
      hname = exceptions[hname];
    }
    return hname;
  },

  sipErrorCause: function(status_code) {
    var cause;

    for (cause in ExSIP.C.SIP_ERROR_CAUSES) {
      if (ExSIP.C.SIP_ERROR_CAUSES[cause].indexOf(status_code) !== -1) {
        return ExSIP.C.causes[cause];
      }
    }

    return ExSIP.C.causes.SIP_FAILURE_CODE;
  },

  /**
  * Generate a random Test-Net IP (http://tools.ietf.org/html/rfc5735)
  * @private
  */
  getRandomTestNetIP: function() {
    function getOctet(from,to) {
      return window.Math.floor(window.Math.random()*(to-from+1)+from);
    }
    return '192.0.2.' + getOctet(1, 254);
  },

  containsHeader: function(headers, name) {
    for(var i=0; i<headers.length; i++) {
      if(headers[i].indexOf(name) !== -1) {
        return true;
      }
    }
    return false;
  },

  getAllowedMethods: function(ua) {
    var event,
      allowed = ExSIP.UA.C.ALLOWED_METHODS.toString();

    for (event in ExSIP.UA.C.EVENT_METHODS) {
      if (ua.checkEvent(event) && ua.listeners(event).length > 0) {
        allowed += ','+ ExSIP.UA.C.EVENT_METHODS[event];
      }
    }

    return allowed;
  },

  // MD5 (Message-Digest Algorithm) http://www.webtoolkit.info
  calculateMD5: function(string) {
    function RotateLeft(lValue, iShiftBits) {
      return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
      var lX4,lY4,lX8,lY8,lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    }

    function F(x,y,z) {
      return (x & y) | ((~x) & z);
    }

    function G(x,y,z) {
      return (x & z) | (y & (~z));
    }

    function H(x,y,z) {
      return (x ^ y ^ z);
    }

    function I(x,y,z) {
      return (y ^ (x | (~z)));
    }

    function FF(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function GG(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function HH(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function II(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function ConvertToWordArray(string) {
      var lWordCount;
      var lMessageLength = string.length;
      var lNumberOfWords_temp1=lMessageLength + 8;
      var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
      var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
      var lWordArray=Array(lNumberOfWords-1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while ( lByteCount < lMessageLength ) {
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount-(lByteCount % 4))/4;
      lBytePosition = (lByteCount % 4)*8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
      lWordArray[lNumberOfWords-2] = lMessageLength<<3;
      lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
      return lWordArray;
    }

    function WordToHex(lValue) {
      var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
      for (lCount = 0;lCount<=3;lCount++) {
        lByte = (lValue>>>(lCount*8)) & 255;
        WordToHexValue_temp = "0" + lByte.toString(16);
        WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
      }
      return WordToHexValue;
    }

    function Utf8Encode(string) {
      string = string.replace(/\r\n/g,"\n");
      var utftext = "";

      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }

    var x=[];
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    string = Utf8Encode(string);

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
      AA=a; BB=b; CC=c; DD=d;
      a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
      d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
      c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
      b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
      a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
      d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
      c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
      b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
      a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
      d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
      c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
      b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
      a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
      d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
      c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
      b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
      a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
      d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
      c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
      b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
      a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
      d=GG(d,a,b,c,x[k+10],S22,0x2441453);
      c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
      b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
      a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
      d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
      c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
      b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
      a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
      d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
      c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
      b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
      a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
      d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
      c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
      b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
      a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
      d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
      c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
      b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
      a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
      d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
      c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
      b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
      a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
      d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
      c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
      b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
      a=II(a,b,c,d,x[k+0], S41,0xF4292244);
      d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
      c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
      b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
      a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
      d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
      c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
      b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
      a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
      d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
      c=II(c,d,a,b,x[k+6], S43,0xA3014314);
      b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
      a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
      d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
      c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
      b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
      a=AddUnsigned(a,AA);
      b=AddUnsigned(b,BB);
      c=AddUnsigned(c,CC);
      d=AddUnsigned(d,DD);
    }

    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

    return temp.toLowerCase();
  }
};

ExSIP.Utils = Utils;
}(ExSIP));



/**
 * @fileoverview Incoming SIP Message Sanity Check
 */

/**
 * SIP message sanity check.
 * @augments ExSIP
 * @function
 * @param {ExSIP.IncomingMessage} message
 * @param {ExSIP.UA} ua
 * @param {ExSIP.Transport} transport
 * @returns {Boolean}
 */
(function(ExSIP) {
var sanityCheck,
 logger = new ExSIP.Logger(ExSIP.name +' | '+ 'SANITY CHECK'),

 message, ua, transport,
 requests = [],
 responses = [],
 all = [];

/*
 * Sanity Check for incoming Messages
 *
 * Requests:
 *  - _rfc3261_8_2_2_1_ Receive a Request with a non supported URI scheme
 *  - _rfc3261_16_3_4_ Receive a Request already sent by us
 *   Does not look at via sent-by but at exsip_id, which is inserted as
 *   a prefix in all initial requests generated by the ua
 *  - _rfc3261_18_3_request_ Body Content-Length
 *  - _rfc3261_8_2_2_2_ Merged Requests
 *
 * Responses:
 *  - _rfc3261_8_1_3_3_ Multiple Via headers
 *  - _rfc3261_18_1_2_ sent-by mismatch
 *  - _rfc3261_18_3_response_ Body Content-Length
 *
 * All:
 *  - Minimum headers in a SIP message
 */

// Sanity Check functions for requests
function rfc3261_8_2_2_1() {
  if(message.s('to').uri.scheme !== 'sip') {
    logger.warn('Scheme ('+message.s('to').uri.scheme+') is not sip. Dropping the request', ua);
    reply(416);
    return false;
  }
}

function rfc3261_16_3_4() {
  if(!message.to_tag) {
    if(message.call_id.substr(0, 5) === ua.configuration.exsip_id) {
      logger.warn('Call_id ('+message.call_id+') is same as exsip ('+ua.configuration.exsip_id+'). Dropping the request', ua);
      reply(482);
      return false;
    }
  }
}

function rfc3261_18_3_request() {
  var len = ExSIP.Utils.str_utf8_length(message.body),
  contentLength = message.getHeader('content-length');

  if(len < contentLength) {
    logger.warn('Message body length ('+len+') is lower than the value in Content-Length header field ('+contentLength+'). Dropping the request', ua);
    reply(400);
    return false;
  }
}

function rfc3261_8_2_2_2() {
  var tr, idx,
    fromTag = message.from_tag,
    call_id = message.call_id,
    cseq = message.cseq;

  if(!message.to_tag) {
    if(message.method === ExSIP.C.INVITE) {
      tr = ua.transactions.ist[message.via_branch];
      if(!tr) {
        return;
      } else {
        for(idx in ua.transactions.ist) {
          tr = ua.transactions.ist[idx];
          if(tr.request.from_tag === fromTag && tr.request.call_id === call_id && tr.request.cseq === cseq) {
            reply(482);
            return false;
          }
        }
      }
    } else {
      tr = ua.transactions.nist[message.via_branch];
      if(!tr) {
        return;
      } else {
        for(idx in ua.transactions.nist) {
          tr = ua.transactions.nist[idx];
          if(tr.request.from_tag === fromTag && tr.request.call_id === call_id && tr.request.cseq === cseq) {
            reply(482);
            return false;
          }
        }
      }
    }
  }
}

// Sanity Check functions for responses
function rfc3261_8_1_3_3() {
  if(message.countHeader('via') > 1) {
    logger.warn('More than one Via header field present in the response. Dropping the response', ua);
    return false;
  }
}

function rfc3261_18_1_2() {
  var via_host = ua.configuration.via_host;
  if(message.via.host !== via_host) {
    logger.warn('Via host in the response ('+message.via.host+') does not match UA Via host value ('+via_host+'). Dropping the response', ua);
    return false;
  }
}

function rfc3261_18_3_response() {
  var
    len = ExSIP.Utils.str_utf8_length(message.body),
    contentLength = message.getHeader('content-length');

    if(len < contentLength) {
      logger.warn('Message body length ('+len+') is lower than the value in Content-Length header field ('+contentLength+'). Dropping the response', ua);
      return false;
    }
}

// Sanity Check functions for requests and responses
function minimumHeaders() {
  var
    mandatoryHeaders = ['from', 'to', 'call_id', 'cseq', 'via'],
    idx = mandatoryHeaders.length;

  while(idx--) {
    if(!message.hasHeader(mandatoryHeaders[idx])) {
      logger.warn('Missing mandatory header field : '+ mandatoryHeaders[idx] +'. Dropping the response', ua);
      return false;
    }
  }
}

// Reply
function reply(status_code) {
  var to,
    response = "SIP/2.0 " + status_code + " " + ExSIP.C.REASON_PHRASE[status_code] + "\r\n",
    via_length = message.countHeader('via'),
    idx = 0;

  for(idx; idx < via_length; idx++) {
    response += "Via: " + message.getHeader('via', idx) + "\r\n";
  }

  to = message.getHeader('To');

  if(!message.to_tag) {
    to += ';tag=' + ExSIP.Utils.newTag();
  }

  response += "To: " + to + "\r\n";
  response += "From: " + message.getHeader('From') + "\r\n";
  response += "Call-ID: " + message.call_id + "\r\n";
  response += "CSeq: " + message.cseq + " " + message.method + "\r\n";
  response += "\r\n";

  transport.send(response);
}

requests.push(rfc3261_8_2_2_1);
requests.push(rfc3261_16_3_4);
requests.push(rfc3261_18_3_request);
requests.push(rfc3261_8_2_2_2);

responses.push(rfc3261_8_1_3_3);
responses.push(rfc3261_18_1_2);
responses.push(rfc3261_18_3_response);

all.push(minimumHeaders);

sanityCheck = function(m, u, t) {
  var len, pass;

  message = m;
  ua = u;
  transport = t;

  len = all.length;
  while(len--) {
    pass = all[len](message);
    if(pass === false) {
      return false;
    }
  }

  if(message instanceof ExSIP.IncomingRequest) {
    len = requests.length;
    while(len--) {
      pass = requests[len](message);
      if(pass === false) {
        return false;
      }
    }
  }

  else if(message instanceof ExSIP.IncomingResponse) {
    len = responses.length;
    while(len--) {
      pass = responses[len](message);
      if(pass === false) {
        return false;
      }
    }
  }

  //Everything is OK
  return true;
};

ExSIP.sanityCheck = sanityCheck;
}(ExSIP));




/**
 * @fileoverview SIP Digest Authentication
 */

/**
 * SIP Digest Authentication.
 * @augments ExSIP.
 * @function Digest Authentication
 * @param {ExSIP.UA} ua
 */
(function(ExSIP) {
var DigestAuthentication,
  logger = new ExSIP.Logger(ExSIP.name +' | '+ 'DIGEST AUTHENTICATION');

DigestAuthentication = function(ua) {
  this.ua = ua;
  this.username = ua.configuration.authorization_user;
  this.password = ua.configuration.password;
  this.cnonce = null;
  this.nc = 0;
  this.ncHex = '00000000';
  this.response = null;
};


/**
* Performs Digest authentication given a SIP request and the challenge
* received in a response to that request.
* Returns true if credentials were successfully generated, false otherwise.
* 
* @param {ExSIP.OutgoingRequest} request
* @param {Object} challenge
*/
DigestAuthentication.prototype.authenticate = function(request, challenge) {
  // Inspect and validate the challenge.

  this.algorithm = challenge.algorithm;
  this.realm = challenge.realm;
  this.nonce = challenge.nonce;
  this.opaque = challenge.opaque;
  this.stale = challenge.stale;

  if (this.algorithm) {
    if (this.algorithm !== 'MD5') {
      logger.warn('challenge with Digest algorithm different than "MD5", authentication aborted', this.ua);
      return false;
    }
  } else {
    this.algorithm = 'MD5';
  }

  if (! this.realm) {
    logger.warn('challenge without Digest realm, authentication aborted', this.ua);
    return false;
  }

  if (! this.nonce) {
    logger.warn('challenge without Digest nonce, authentication aborted', this.ua);
    return false;
  }

  // 'qop' can contain a list of values (Array). Let's choose just one.
  if (challenge.qop) {
    if (challenge.qop.indexOf('auth') > -1) {
      this.qop = 'auth';
    } else if (challenge.qop.indexOf('auth-int') > -1) {
      this.qop = 'auth-int';
    } else {
      // Otherwise 'qop' is present but does not contain 'auth' or 'auth-int', so abort here.
      logger.warn('challenge without Digest qop different than "auth" or "auth-int", authentication aborted', this.ua);
      return false;
    }
  } else {
    this.qop = null;
  }

  // Fill other attributes.

  this.method = request.method;
  this.uri = request.ruri;
  this.cnonce = ExSIP.Utils.createRandomToken(12);
  this.nc += 1;
  this.updateNcHex();

  // nc-value = 8LHEX. Max value = 'FFFFFFFF'.
  if (this.nc === 4294967296) {
    this.nc = 1;
    this.ncHex = '00000001';
  }

  // Calculate the Digest "response" value.
  this.calculateResponse();

  return true;
};


/**
* Generate Digest 'response' value.
* @private
*/
DigestAuthentication.prototype.calculateResponse = function() {
  var ha1, ha2;

  // HA1 = MD5(A1) = MD5(username:realm:password)
  ha1 = ExSIP.Utils.calculateMD5(this.username + ":" + this.realm + ":" + this.password);

  if (this.qop === 'auth') {
    // HA2 = MD5(A2) = MD5(method:digestURI)
    ha2 = ExSIP.Utils.calculateMD5(this.method + ":" + this.uri);
    // response = MD5(HA1:nonce:nonceCount:credentialsNonce:qop:HA2)
    this.response = ExSIP.Utils.calculateMD5(ha1 + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth:" + ha2);

  } else if (this.qop === 'auth-int') {
    // HA2 = MD5(A2) = MD5(method:digestURI:MD5(entityBody))
    ha2 = ExSIP.Utils.calculateMD5(this.method + ":" + this.uri + ":" + ExSIP.Utils.calculateMD5(this.body ? this.body : ""));
    // response = MD5(HA1:nonce:nonceCount:credentialsNonce:qop:HA2)
    this.response = ExSIP.Utils.calculateMD5(ha1 + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth-int:" + ha2);

  } else if (this.qop === null) {
    // HA2 = MD5(A2) = MD5(method:digestURI)
    ha2 = ExSIP.Utils.calculateMD5(this.method + ":" + this.uri);
    // response = MD5(HA1:nonce:HA2)
    this.response = ExSIP.Utils.calculateMD5(ha1 + ":" + this.nonce + ":" + ha2);
  }
};


/**
* Return the Proxy-Authorization or WWW-Authorization header value.
*/
DigestAuthentication.prototype.toString = function() {
  var auth_params = [];

  if (! this.response) {
    throw new Error('response field does not exist, cannot generate Authorization header');
  }

  auth_params.push('algorithm=' + this.algorithm);
  auth_params.push('username="' + this.username + '"');
  auth_params.push('realm="' + this.realm + '"');
  auth_params.push('nonce="' + this.nonce + '"');
  auth_params.push('uri="' + this.uri + '"');
  auth_params.push('response="' + this.response + '"');
  if (this.opaque) {
    auth_params.push('opaque="' + this.opaque + '"');
  }
  if (this.qop) {
    auth_params.push('qop=' + this.qop);
    auth_params.push('cnonce="' + this.cnonce + '"');
    auth_params.push('nc=' + this.ncHex);
  }

  return 'Digest ' + auth_params.join(', ');
};


/**
* Generate the 'nc' value as required by Digest in this.ncHex by reading this.nc.
* @private
*/
DigestAuthentication.prototype.updateNcHex = function() {
  var hex = Number(this.nc).toString(16);
  this.ncHex = '00000000'.substr(0, 8-hex.length) + hex;
};

ExSIP.DigestAuthentication = DigestAuthentication;
}(ExSIP));


/**
 * @fileoverview WebRTC
 */

(function(ExSIP) {
var WebRTC;

WebRTC = {};

// getUserMedia
if (window.navigator.webkitGetUserMedia) {
  WebRTC.getUserMedia = window.navigator.webkitGetUserMedia.bind(navigator);
}
else if (window.navigator.mozGetUserMedia) {
  WebRTC.getUserMedia = window.navigator.mozGetUserMedia.bind(navigator);
}
else if (window.navigator.getUserMedia) {
  WebRTC.getUserMedia = window.navigator.getUserMedia.bind(navigator);
}

// RTCPeerConnection
if (window.webkitRTCPeerConnection) {
  WebRTC.RTCPeerConnection = window.webkitRTCPeerConnection;
}
else if (window.mozRTCPeerConnection) {
  WebRTC.RTCPeerConnection = window.mozRTCPeerConnection;
}
else if (window.RTCPeerConnection) {
  WebRTC.RTCPeerConnection = window.RTCPeerConnection;
}
else {
  console.log("WebRTC.RTCPeerConnection undefined");
  WebRTC.RTCPeerConnection = function(options, constraints){
    this.options = options;
    this.constraints = constraints;
  };
}

// RTCIceCandidate
if (window.RTCIceCandidate) {
  WebRTC.RTCIceCandidate = window.RTCIceCandidate;
}
else {
  console.log("WebRTC.RTCIceCandidate undefined");
  WebRTC.RTCIceCandidate = function(){};
}

// RTCSessionDescription
if (window.webkitRTCSessionDescription) {
  WebRTC.RTCSessionDescription = window.webkitRTCSessionDescription;
}
else if (window.mozRTCSessionDescription) {
  WebRTC.RTCSessionDescription = window.mozRTCSessionDescription;
}
else if (window.RTCSessionDescription) {
  WebRTC.RTCSessionDescription = window.RTCSessionDescription;
}
else {
  console.log("WebRTC.RTCSessionDescription undefined");
  WebRTC.RTCSessionDescription = function(options){
    options = options || {};
    this.sdp = options["sdp"];
    this.type = options["offer"];
  };
}

WebRTC.RTCSessionDescription.prototype.getSdp = function(options){
  options = options || {};
  var sdp = this.sdp;
  if(options.additionalSdp) {
    sdp += options.additionalSdp;
  }
  return sdp;
};
WebRTC.RTCSessionDescription.prototype.getUnsupportedMedias = function(){
  var slideMedias = this.getSlidesMedias();
  var inactiveApplicationMedias = this.getApplicationMedias('0 RTP/SAVPF');
  var unsupportedMedias = slideMedias.concat(inactiveApplicationMedias);
  return unsupportedMedias;
};
WebRTC.RTCSessionDescription.prototype.removeUnsupportedMedia = function(){
  var unsupportedMedias = this.getUnsupportedMedias();
  for(var i = 0; i < unsupportedMedias.length; i++) {
    this.sdp = this.sdp.replace(unsupportedMedias[i], '');
    console.warn('removing unsupported media from sdp : '+unsupportedMedias[i]);
  }
  return unsupportedMedias.join('');
};
WebRTC.RTCSessionDescription.prototype.getSlidesMedias = function(){
  var slideMedia = this.getVideoMedias('a=content:slides');
  return slideMedia;
};
WebRTC.RTCSessionDescription.prototype.getVideoMedias = function(filter){
  return this.getMedias('video', filter);
};
WebRTC.RTCSessionDescription.prototype.getApplicationMedias = function(filter){
  return this.getMedias('application', filter);
};
WebRTC.RTCSessionDescription.prototype.getMedias = function(type, filter){
  var regex = new RegExp("(m="+type+"(?:(?!m=)[\\s\\S])*)", "mig");
  var match;
  var results = [];
  while((match = regex.exec(this.sdp)) != null) {
    var media = match.pop();
    if(!filter || media.indexOf(filter) !== -1) {
      results.push(media);
    }
  }
  return results;
};
WebRTC.RTCSessionDescription.prototype.getAudioIcePwd = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*a=ice-pwd:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoIcePwd = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*a=ice-pwd:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioIceUfrag = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*a=ice-ufrag:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoIceUfrag = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*a=ice-ufrag:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getCandidates = function(media){
  var regex = new RegExp("a=candidate:(.*)", "ig");
  var matches;
  var result = [];
  while ((matches = regex.exec(media)) !== null)
  {
    result.push(matches[matches.length-1]);
  }
  return result;
};
WebRTC.RTCSessionDescription.prototype.getAudioCandidates = function(){
  var audio = this.getAudio();
  return audio ? this.getCandidates(audio) : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoCandidates = function(){
  var video = this.getVideo();
  return video ? this.getCandidates(video) : null;
};
WebRTC.RTCSessionDescription.prototype.getConnection = function(){
  var match = this.sdp.match(/v=(?:(?!m=)[\s\S])*c=(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getAudio = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getVideo = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioConnection = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*c=(.*)/mi);
  return match != null ? match[match.length-1] : this.getConnection();
};
WebRTC.RTCSessionDescription.prototype.getVideoConnection = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*c=(.*)/mi);
  return match != null ? match[match.length-1] : this.getConnection();
};
WebRTC.RTCSessionDescription.prototype.hasVideo = function(){
  return this.sdp.match(/m=video/) != null;
};
WebRTC.RTCSessionDescription.prototype.hasAudio = function(){
  return this.sdp.match(/m=audio/) != null;
};
WebRTC.RTCSessionDescription.prototype.videoPort = function(){
  var match = this.sdp.match(/m=video\s(\d*)\s/);
  return  match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.audioPort = function(){
  var match = this.sdp.match(/m=audio\s(\d*)\s/);
  return  match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioMedia = function(){
  var match = this.sdp.match(/m=audio\s(.*)/);
  return  match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoMedia = function(){
  var match = this.sdp.match(/m=video\s(.*)/);
  return  match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioCodecs = function(){
  var audioMedia = this.getAudioMedia();
  return this.getCodecs(audioMedia);
};
WebRTC.RTCSessionDescription.prototype.getVideoCodecs = function(){
  var videoMedia = this.getVideoMedia();
  return this.getCodecs(videoMedia);
};
WebRTC.RTCSessionDescription.prototype.getCodecs = function(media){
  if(!media) {
    return null;
  }
  var mediaParts = media.split(" ");
  return mediaParts.splice(2);
};
WebRTC.RTCSessionDescription.prototype.getAudioCodecRtpmap = function(codec){
  var regex = new RegExp("m=audio(?:(?!m=)[\\s\\S])*a=rtpmap:"+codec+"(.*)", "mi");
  var match = this.sdp.match(regex);
  return match != null ? match[match.length-1].trim() : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoCodecRtpmap = function(codec){
  var regex = new RegExp("m=video(?:(?!m=)[\\s\\S])*a=rtpmap:"+codec+"(.*)", "mi");
  var match = this.sdp.match(regex);
  return match != null ? match[match.length-1].trim() : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioCodecFmtp = function(codec){
  var regex = new RegExp("m=audio(?:(?!m=)[\\s\\S])*a=fmtp:"+codec+"(.*)", "mi");
  var match = this.sdp.match(regex);
  return match != null ? match[match.length-1].trim() : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoCodecFmtp = function(codec){
  var regex = new RegExp("m=video(?:(?!m=)[\\s\\S])*a=fmtp:"+codec+"(.*)", "mi");
  var match = this.sdp.match(regex);
  return match != null ? match[match.length-1].trim() : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioFingerprint = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*a=fingerprint:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoFingerprint = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*a=fingerprint:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getAudioRtcp = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*a=rtcp:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.getVideoRtcp = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*a=rtcp:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.removeVideoFingerprint = function(){
  if(this.getVideoFingerprint()) {
    this.sdp = this.sdp.replace(/(m=video(?:(?!m=)[\s\S])*)(a=fingerprint:.*\r\n)/mi, "$1");
  }
};
WebRTC.RTCSessionDescription.prototype.removeAudioFingerprint = function(){
  if(this.getAudioFingerprint()) {
    this.sdp = this.sdp.replace(/(m=audio(?:(?!m=)[\s\S])*)(a=fingerprint:.*\r\n)/mi, "$1");
  }
};
WebRTC.RTCSessionDescription.prototype.hasActiveVideo = function(){
  var videoPort = this.videoPort() || 0;
  var videoConnection = this.getVideoConnection() || "";
  return this.hasVideo() && videoPort > 0 && videoConnection.indexOf('0.0.0.0') === -1;
};
WebRTC.RTCSessionDescription.prototype.hasActiveAudio = function(){
  var audioPort = this.audioPort() || 0;
  var audioConnection = this.getAudioConnection() || "";
  return this.hasAudio() && audioPort > 0 && audioConnection.indexOf('0.0.0.0') === -1;
};
WebRTC.RTCSessionDescription.prototype.getVideoBandwidth = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*b=.*:(.*)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.setVideoBandwidth = function(videoBandwidth){
  if(this.getVideoBandwidth()) {
    this.sdp = this.sdp.replace(/(m=video(?:(?!m=)[\s\S])*)(b=.*)/mi, "$1b=AS:" + videoBandwidth);
  } else {
    this.sdp = this.sdp.replace(/(m=video.*((?!m=)[\s\S]*c=IN\s+IP4.*)?)/, "$1\r\nb=AS:" + videoBandwidth);
  }
};
WebRTC.RTCSessionDescription.prototype.setVideoMode = function(mode){
  if(this.getVideoMode()) {
    this.sdp = this.sdp.replace(/(m=video(?:(?!m=)[\s\S])*)(a=(sendrecv|sendonly|recvonly|inactive))/mi, "$1a=" + mode);
  } else {
    this.sdp = this.sdp.replace(/(m=video.*((?!m=)[\s\S]*c=IN\s+IP4.*)?)/, "$1\r\na=" + mode);
  }
};
WebRTC.RTCSessionDescription.prototype.setVideoPort = function(port){
  this.sdp = this.sdp.replace(/(m=video\s)(\d*)(\s)/i, "$1"+port+"$3");
};
WebRTC.RTCSessionDescription.prototype.getVideoMode = function(){
  var match = this.sdp.match(/m=video(?:(?!m=)[\s\S])*a=(sendrecv|sendonly|recvonly|inactive)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.setAudioMode = function(mode){
  if(this.getAudioMode()) {
    this.sdp = this.sdp.replace(/(m=audio(?:(?!m=)[\s\S])*)(a=(sendrecv|sendonly|recvonly|inactive))/mi, "$1a=" + mode);
  } else {
    this.sdp = this.sdp.replace(/(m=audio.*(:?(?!m=)[\s\S])*(c=IN\s+IP4.*)?)/, "$1\r\na=" + mode);
  }
};
WebRTC.RTCSessionDescription.prototype.setAudioPort = function(port){
  this.sdp = this.sdp.replace(/(m=audio\s)(\d*)(\s)/i, "$1"+port+"$3");
};
WebRTC.RTCSessionDescription.prototype.setAudioConnection = function(audioConnection){
  if(this.getAudioConnection()) {
    this.sdp = this.sdp.replace(/(m=audio(?:(?!m=)[\s\S])*)(c=.*)/mi, "$1c=" + audioConnection);
  } else {
    this.sdp = this.sdp.replace(/(m=audio.*((?!m=)[\s\S]*c=IN\s+IP4.*)?)/, "$1\r\nc=" + audioConnection);
  }
};
WebRTC.RTCSessionDescription.prototype.setVideoConnection = function(videoConnection){
  if(this.getVideoConnection()) {
    this.sdp = this.sdp.replace(/(m=video(?:(?!m=)[\s\S])*)(c=.*)/mi, "$1c=" + videoConnection);
  } else {
    this.sdp = this.sdp.replace(/(m=video.*((?!m=)[\s\S]*c=IN\s+IP4.*)?)/, "$1\r\nc=" + videoConnection);
  }
};
WebRTC.RTCSessionDescription.prototype.setAudioRtcp = function(audioRtcp){
  if(this.getAudioRtcp()) {
    this.sdp = this.sdp.replace(/(m=audio(?:(?!m=)[\s\S])*)(a=rtcp:.*)/mi, "$1a=rtcp:" + audioRtcp);
  } else {
    this.sdp = this.sdp.replace(/(m=audio.*((?!m=)[\s\S]*c=IN\s+IP4.*)?)/, "$1\r\na=rtcp:" + audioRtcp);
  }
};
WebRTC.RTCSessionDescription.prototype.setVideoRtcp = function(videoRtcp){
  if(this.getVideoRtcp()) {
    this.sdp = this.sdp.replace(/(m=video(?:(?!m=)[\s\S])*)(a=rtcp:.*)/mi, "$1a=rtcp:" + videoRtcp);
  } else {
    this.sdp = this.sdp.replace(/(m=video.*((?!m=)[\s\S]*c=IN\s+IP4.*)?)/, "$1\r\na=rtcp:" + videoRtcp);
  }
};
WebRTC.RTCSessionDescription.prototype.getAudioMode = function(){
  var match = this.sdp.match(/m=audio(?:(?!m=)[\s\S])*a=(sendrecv|sendonly|recvonly|inactive)/mi);
  return match != null ? match[match.length-1] : null;
};
WebRTC.RTCSessionDescription.prototype.isActive = function(){
  if(this.hasAudio() && this.audioPort() !== "0" && this.getAudioMode() !== ExSIP.C.INACTIVE) {
    return true;
  }
  if(this.hasVideo() && this.videoPort() !== "0" && this.getVideoMode() !== ExSIP.C.INACTIVE) {
    return true;
  }
  return false;
};
WebRTC.RTCSessionDescription.prototype.mediaChanges = function(otherSdp){
  var mediaChanges = [];
  if(this.hasAudio() !== otherSdp.hasAudio()) {
    mediaChanges.push("audio has changed");
  }
  if(this.hasVideo() !== otherSdp.hasVideo()) {
    mediaChanges.push("video has changed");
  }
  if(this.audioPort() !== otherSdp.audioPort()) {
    mediaChanges.push("audio port has changed : "+this.audioPort()+" - " + otherSdp.audioPort());
  }
  if(this.videoPort() !== otherSdp.videoPort()) {
    mediaChanges.push("video port has changed : "+this.videoPort()+" - " + otherSdp.videoPort());
  }
  if(this.getAudioConnection() !== otherSdp.getAudioConnection()) {
    mediaChanges.push("audio connection has changed : "+this.getAudioConnection()+" - " + otherSdp.getAudioConnection());
  }
  if(this.getVideoConnection() !== otherSdp.getVideoConnection()) {
    mediaChanges.push("video connection has changed : "+this.getVideoConnection()+" - " + otherSdp.getVideoConnection());
  }
  var audioCodecs = this.getAudioCodecs();
  if(!ExSIP.Utils.isEqArrays(audioCodecs, otherSdp.getAudioCodecs())) {
    mediaChanges.push("audio codecs has changed : "+audioCodecs+" - " + otherSdp.getAudioCodecs());
  }
  var videoCodecs = this.getVideoCodecs();
  if(!ExSIP.Utils.isEqArrays(videoCodecs, otherSdp.getVideoCodecs())) {
    mediaChanges.push("video codecs has changed : "+videoCodecs+" - " + otherSdp.getVideoCodecs());
  }

  if(audioCodecs) {
    for(var i = 0; i < audioCodecs.length; i++) {
      if(this.getAudioCodecRtpmap(audioCodecs[i]) !== otherSdp.getAudioCodecRtpmap(audioCodecs[i])) {
        mediaChanges.push("audio codec rtpmap for "+audioCodecs[i]+" has changed : "+this.getAudioCodecRtpmap(audioCodecs[i])+" - " + otherSdp.getAudioCodecRtpmap(audioCodecs[i]));
      }
//      if(this.getAudioCodecFmtp(audioCodecs[i]) !== otherSdp.getAudioCodecFmtp(audioCodecs[i])) {
//        mediaChanges.push("audio codec fmtp for "+audioCodecs[i]+" has changed : "+this.getAudioCodecFmtp(audioCodecs[i])+" - " + otherSdp.getAudioCodecFmtp(audioCodecs[i]));
//      }
    }
  }
  if(videoCodecs) {
    for(var j = 0; j < videoCodecs.length; j++) {
      if(this.getVideoCodecRtpmap(videoCodecs[j]) !== otherSdp.getVideoCodecRtpmap(videoCodecs[j])) {
        mediaChanges.push("video codec rtpmap for "+videoCodecs[j]+" has changed : "+this.getVideoCodecRtpmap(videoCodecs[j])+" - " + otherSdp.getVideoCodecRtpmap(videoCodecs[j]));
      }
//      if(this.getVideoCodecFmtp(videoCodecs[j]) !== otherSdp.getVideoCodecFmtp(videoCodecs[j])) {
//        mediaChanges.push("video codec fmtp for "+videoCodecs[j]+" has changed : "+this.getVideoCodecFmtp(videoCodecs[j])+" - " + otherSdp.getVideoCodecFmtp(videoCodecs[j]));
//      }
    }
  }

  return mediaChanges;
};

// New syntax for getting streams in Chrome M26.
if (WebRTC.RTCPeerConnection && WebRTC.RTCPeerConnection.prototype) {
  if (!WebRTC.RTCPeerConnection.prototype.getLocalStreams) {
    WebRTC.RTCPeerConnection.prototype.getLocalStreams = function() {
      return this.localStreams;
    };
    WebRTC.RTCPeerConnection.prototype.getRemoteStreams = function() {
      return this.remoteStreams;
    };
  }
  WebRTC.RTCPeerConnection.prototype.isIceCandidateReady = function(candidate) {
    // if(window.mozRTCPeerConnection && !candidate) {
    //   return true;
    // }
    // if(!window.mozRTCPeerConnection && candidate) {
    //   return true;
    // }
    return candidate;
  };
}

// isSupported attribute.
if (WebRTC.getUserMedia && WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
  WebRTC.isSupported = true;
}
else {
  WebRTC.isSupported = false;
}

ExSIP.WebRTC = WebRTC;
}(ExSIP));



window.ExSIP = ExSIP;
}(window));


ExSIP.Grammar = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "CRLF": parse_CRLF,
        "DIGIT": parse_DIGIT,
        "ALPHA": parse_ALPHA,
        "HEXDIG": parse_HEXDIG,
        "WSP": parse_WSP,
        "OCTET": parse_OCTET,
        "DQUOTE": parse_DQUOTE,
        "SP": parse_SP,
        "HTAB": parse_HTAB,
        "alphanum": parse_alphanum,
        "reserved": parse_reserved,
        "unreserved": parse_unreserved,
        "mark": parse_mark,
        "escaped": parse_escaped,
        "LWS": parse_LWS,
        "SWS": parse_SWS,
        "HCOLON": parse_HCOLON,
        "TEXT_UTF8_TRIM": parse_TEXT_UTF8_TRIM,
        "TEXT_UTF8char": parse_TEXT_UTF8char,
        "UTF8_NONASCII": parse_UTF8_NONASCII,
        "UTF8_CONT": parse_UTF8_CONT,
        "LHEX": parse_LHEX,
        "token": parse_token,
        "token_nodot": parse_token_nodot,
        "separators": parse_separators,
        "word": parse_word,
        "STAR": parse_STAR,
        "SLASH": parse_SLASH,
        "EQUAL": parse_EQUAL,
        "LPAREN": parse_LPAREN,
        "RPAREN": parse_RPAREN,
        "RAQUOT": parse_RAQUOT,
        "LAQUOT": parse_LAQUOT,
        "COMMA": parse_COMMA,
        "SEMI": parse_SEMI,
        "COLON": parse_COLON,
        "LDQUOT": parse_LDQUOT,
        "RDQUOT": parse_RDQUOT,
        "comment": parse_comment,
        "ctext": parse_ctext,
        "quoted_string": parse_quoted_string,
        "quoted_string_clean": parse_quoted_string_clean,
        "qdtext": parse_qdtext,
        "quoted_pair": parse_quoted_pair,
        "SIP_URI_noparams": parse_SIP_URI_noparams,
        "SIP_URI": parse_SIP_URI,
        "uri_scheme": parse_uri_scheme,
        "userinfo": parse_userinfo,
        "user": parse_user,
        "user_unreserved": parse_user_unreserved,
        "password": parse_password,
        "hostport": parse_hostport,
        "host": parse_host,
        "hostname": parse_hostname,
        "domainlabel": parse_domainlabel,
        "toplabel": parse_toplabel,
        "IPv6reference": parse_IPv6reference,
        "IPv6address": parse_IPv6address,
        "h16": parse_h16,
        "ls32": parse_ls32,
        "IPv4address": parse_IPv4address,
        "dec_octet": parse_dec_octet,
        "port": parse_port,
        "uri_parameters": parse_uri_parameters,
        "uri_parameter": parse_uri_parameter,
        "transport_param": parse_transport_param,
        "user_param": parse_user_param,
        "method_param": parse_method_param,
        "ttl_param": parse_ttl_param,
        "maddr_param": parse_maddr_param,
        "lr_param": parse_lr_param,
        "other_param": parse_other_param,
        "pname": parse_pname,
        "pvalue": parse_pvalue,
        "paramchar": parse_paramchar,
        "param_unreserved": parse_param_unreserved,
        "headers": parse_headers,
        "header": parse_header,
        "hname": parse_hname,
        "hvalue": parse_hvalue,
        "hnv_unreserved": parse_hnv_unreserved,
        "Request_Response": parse_Request_Response,
        "Request_Line": parse_Request_Line,
        "Request_URI": parse_Request_URI,
        "absoluteURI": parse_absoluteURI,
        "hier_part": parse_hier_part,
        "net_path": parse_net_path,
        "abs_path": parse_abs_path,
        "opaque_part": parse_opaque_part,
        "uric": parse_uric,
        "uric_no_slash": parse_uric_no_slash,
        "path_segments": parse_path_segments,
        "segment": parse_segment,
        "param": parse_param,
        "pchar": parse_pchar,
        "scheme": parse_scheme,
        "authority": parse_authority,
        "srvr": parse_srvr,
        "reg_name": parse_reg_name,
        "query": parse_query,
        "SIP_Version": parse_SIP_Version,
        "INVITEm": parse_INVITEm,
        "ACKm": parse_ACKm,
        "OPTIONSm": parse_OPTIONSm,
        "BYEm": parse_BYEm,
        "CANCELm": parse_CANCELm,
        "REGISTERm": parse_REGISTERm,
        "SUBSCRIBEm": parse_SUBSCRIBEm,
        "NOTIFYm": parse_NOTIFYm,
        "Method": parse_Method,
        "Status_Line": parse_Status_Line,
        "Status_Code": parse_Status_Code,
        "extension_code": parse_extension_code,
        "Reason_Phrase": parse_Reason_Phrase,
        "Allow_Events": parse_Allow_Events,
        "Call_ID": parse_Call_ID,
        "Contact": parse_Contact,
        "contact_param": parse_contact_param,
        "name_addr": parse_name_addr,
        "display_name": parse_display_name,
        "contact_params": parse_contact_params,
        "c_p_q": parse_c_p_q,
        "c_p_expires": parse_c_p_expires,
        "delta_seconds": parse_delta_seconds,
        "qvalue": parse_qvalue,
        "generic_param": parse_generic_param,
        "gen_value": parse_gen_value,
        "Content_Disposition": parse_Content_Disposition,
        "disp_type": parse_disp_type,
        "disp_param": parse_disp_param,
        "handling_param": parse_handling_param,
        "Content_Encoding": parse_Content_Encoding,
        "Content_Length": parse_Content_Length,
        "Content_Type": parse_Content_Type,
        "media_type": parse_media_type,
        "m_type": parse_m_type,
        "discrete_type": parse_discrete_type,
        "composite_type": parse_composite_type,
        "extension_token": parse_extension_token,
        "x_token": parse_x_token,
        "m_subtype": parse_m_subtype,
        "m_parameter": parse_m_parameter,
        "m_value": parse_m_value,
        "CSeq": parse_CSeq,
        "CSeq_value": parse_CSeq_value,
        "Expires": parse_Expires,
        "Event": parse_Event,
        "event_type": parse_event_type,
        "From": parse_From,
        "from_param": parse_from_param,
        "tag_param": parse_tag_param,
        "Max_Forwards": parse_Max_Forwards,
        "Min_Expires": parse_Min_Expires,
        "Name_Addr_Header": parse_Name_Addr_Header,
        "Proxy_Authenticate": parse_Proxy_Authenticate,
        "challenge": parse_challenge,
        "other_challenge": parse_other_challenge,
        "auth_param": parse_auth_param,
        "digest_cln": parse_digest_cln,
        "realm": parse_realm,
        "realm_value": parse_realm_value,
        "domain": parse_domain,
        "URI": parse_URI,
        "nonce": parse_nonce,
        "nonce_value": parse_nonce_value,
        "opaque": parse_opaque,
        "stale": parse_stale,
        "algorithm": parse_algorithm,
        "qop_options": parse_qop_options,
        "qop_value": parse_qop_value,
        "Proxy_Require": parse_Proxy_Require,
        "Record_Route": parse_Record_Route,
        "rec_route": parse_rec_route,
        "Require": parse_Require,
        "Route": parse_Route,
        "route_param": parse_route_param,
        "Subscription_State": parse_Subscription_State,
        "substate_value": parse_substate_value,
        "subexp_params": parse_subexp_params,
        "event_reason_value": parse_event_reason_value,
        "Subject": parse_Subject,
        "Supported": parse_Supported,
        "To": parse_To,
        "to_param": parse_to_param,
        "Via": parse_Via,
        "via_parm": parse_via_parm,
        "via_params": parse_via_params,
        "via_ttl": parse_via_ttl,
        "via_maddr": parse_via_maddr,
        "via_received": parse_via_received,
        "via_branch": parse_via_branch,
        "response_port": parse_response_port,
        "sent_protocol": parse_sent_protocol,
        "protocol_name": parse_protocol_name,
        "transport": parse_transport,
        "sent_by": parse_sent_by,
        "via_host": parse_via_host,
        "via_port": parse_via_port,
        "ttl": parse_ttl,
        "WWW_Authenticate": parse_WWW_Authenticate,
        "extension_header": parse_extension_header,
        "header_value": parse_header_value,
        "message_body": parse_message_body,
        "stun_URI": parse_stun_URI,
        "stun_scheme": parse_stun_scheme,
        "stun_host_port": parse_stun_host_port,
        "stun_host": parse_stun_host,
        "reg_name": parse_reg_name,
        "stun_unreserved": parse_stun_unreserved,
        "sub_delims": parse_sub_delims,
        "turn_URI": parse_turn_URI,
        "turn_scheme": parse_turn_scheme,
        "turn_transport": parse_turn_transport
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "CRLF";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_CRLF() {
        var result0;
        
        if (input.substr(pos, 2) === "\r\n") {
          result0 = "\r\n";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\r\\n\"");
          }
        }
        return result0;
      }
      
      function parse_DIGIT() {
        var result0;
        
        if (/^[0-9]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        return result0;
      }
      
      function parse_ALPHA() {
        var result0;
        
        if (/^[a-zA-Z]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z]");
          }
        }
        return result0;
      }
      
      function parse_HEXDIG() {
        var result0;
        
        if (/^[0-9a-fA-F]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9a-fA-F]");
          }
        }
        return result0;
      }
      
      function parse_WSP() {
        var result0;
        
        result0 = parse_SP();
        if (result0 === null) {
          result0 = parse_HTAB();
        }
        return result0;
      }
      
      function parse_OCTET() {
        var result0;
        
        if (/^[\0-\xFF]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\0-\\xFF]");
          }
        }
        return result0;
      }
      
      function parse_DQUOTE() {
        var result0;
        
        if (/^["]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\"]");
          }
        }
        return result0;
      }
      
      function parse_SP() {
        var result0;
        
        if (input.charCodeAt(pos) === 32) {
          result0 = " ";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\" \"");
          }
        }
        return result0;
      }
      
      function parse_HTAB() {
        var result0;
        
        if (input.charCodeAt(pos) === 9) {
          result0 = "\t";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\t\"");
          }
        }
        return result0;
      }
      
      function parse_alphanum() {
        var result0;
        
        if (/^[a-zA-Z0-9]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z0-9]");
          }
        }
        return result0;
      }
      
      function parse_reserved() {
        var result0;
        
        if (input.charCodeAt(pos) === 59) {
          result0 = ";";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\";\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 47) {
            result0 = "/";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 63) {
              result0 = "?";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"?\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 58) {
                result0 = ":";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\":\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 64) {
                  result0 = "@";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"@\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 38) {
                    result0 = "&";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"&\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 61) {
                      result0 = "=";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"=\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 43) {
                        result0 = "+";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 36) {
                          result0 = "$";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"$\"");
                          }
                        }
                        if (result0 === null) {
                          if (input.charCodeAt(pos) === 44) {
                            result0 = ",";
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("\",\"");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_unreserved() {
        var result0;
        
        result0 = parse_alphanum();
        if (result0 === null) {
          result0 = parse_mark();
        }
        return result0;
      }
      
      function parse_mark() {
        var result0;
        
        if (input.charCodeAt(pos) === 45) {
          result0 = "-";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"-\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 95) {
            result0 = "_";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"_\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 46) {
              result0 = ".";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 33) {
                result0 = "!";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"!\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 126) {
                  result0 = "~";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"~\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 42) {
                    result0 = "*";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"*\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 39) {
                      result0 = "'";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"'\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 40) {
                        result0 = "(";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"(\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 41) {
                          result0 = ")";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\")\"");
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_escaped() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 37) {
          result0 = "%";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"%\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_HEXDIG();
          if (result1 !== null) {
            result2 = parse_HEXDIG();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, escaped) {return escaped.join(''); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_LWS() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        result0 = [];
        result1 = parse_WSP();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_WSP();
        }
        if (result0 !== null) {
          result1 = parse_CRLF();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos2;
          }
        } else {
          result0 = null;
          pos = pos2;
        }
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          result2 = parse_WSP();
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              result2 = parse_WSP();
            }
          } else {
            result1 = null;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return " "; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SWS() {
        var result0;
        
        result0 = parse_LWS();
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse_HCOLON() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        result1 = parse_SP();
        if (result1 === null) {
          result1 = parse_HTAB();
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_SP();
          if (result1 === null) {
            result1 = parse_HTAB();
          }
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return ':'; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_TEXT_UTF8_TRIM() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result1 = parse_TEXT_UTF8char();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_TEXT_UTF8char();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = [];
          result3 = parse_LWS();
          while (result3 !== null) {
            result2.push(result3);
            result3 = parse_LWS();
          }
          if (result2 !== null) {
            result3 = parse_TEXT_UTF8char();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = [];
            result3 = parse_LWS();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_LWS();
            }
            if (result2 !== null) {
              result3 = parse_TEXT_UTF8char();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_TEXT_UTF8char() {
        var result0;
        
        if (/^[!-~]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[!-~]");
          }
        }
        if (result0 === null) {
          result0 = parse_UTF8_NONASCII();
        }
        return result0;
      }
      
      function parse_UTF8_NONASCII() {
        var result0;
        
        if (/^[\x80-\uFFFF]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\x80-\\uFFFF]");
          }
        }
        return result0;
      }
      
      function parse_UTF8_CONT() {
        var result0;
        
        if (/^[\x80-\xBF]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\x80-\\xBF]");
          }
        }
        return result0;
      }
      
      function parse_LHEX() {
        var result0;
        
        result0 = parse_DIGIT();
        if (result0 === null) {
          if (/^[a-f]/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[a-f]");
            }
          }
        }
        return result0;
      }
      
      function parse_token() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_alphanum();
        if (result1 === null) {
          if (input.charCodeAt(pos) === 45) {
            result1 = "-";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          if (result1 === null) {
            if (input.charCodeAt(pos) === 46) {
              result1 = ".";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result1 === null) {
              if (input.charCodeAt(pos) === 33) {
                result1 = "!";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"!\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 37) {
                  result1 = "%";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"%\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 42) {
                    result1 = "*";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"*\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 95) {
                      result1 = "_";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"_\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 43) {
                        result1 = "+";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 96) {
                          result1 = "`";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"`\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 39) {
                            result1 = "'";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"'\"");
                            }
                          }
                          if (result1 === null) {
                            if (input.charCodeAt(pos) === 126) {
                              result1 = "~";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"~\"");
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_alphanum();
            if (result1 === null) {
              if (input.charCodeAt(pos) === 45) {
                result1 = "-";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"-\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 46) {
                  result1 = ".";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 33) {
                    result1 = "!";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"!\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 37) {
                      result1 = "%";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"%\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 42) {
                        result1 = "*";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"*\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 95) {
                          result1 = "_";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"_\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 43) {
                            result1 = "+";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"+\"");
                            }
                          }
                          if (result1 === null) {
                            if (input.charCodeAt(pos) === 96) {
                              result1 = "`";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"`\"");
                              }
                            }
                            if (result1 === null) {
                              if (input.charCodeAt(pos) === 39) {
                                result1 = "'";
                                pos++;
                              } else {
                                result1 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"'\"");
                                }
                              }
                              if (result1 === null) {
                                if (input.charCodeAt(pos) === 126) {
                                  result1 = "~";
                                  pos++;
                                } else {
                                  result1 = null;
                                  if (reportFailures === 0) {
                                    matchFailed("\"~\"");
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_token_nodot() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_alphanum();
        if (result1 === null) {
          if (input.charCodeAt(pos) === 45) {
            result1 = "-";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          if (result1 === null) {
            if (input.charCodeAt(pos) === 33) {
              result1 = "!";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"!\"");
              }
            }
            if (result1 === null) {
              if (input.charCodeAt(pos) === 37) {
                result1 = "%";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"%\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 42) {
                  result1 = "*";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"*\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 95) {
                    result1 = "_";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"_\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 43) {
                      result1 = "+";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"+\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 96) {
                        result1 = "`";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"`\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 39) {
                          result1 = "'";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"'\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 126) {
                            result1 = "~";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"~\"");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_alphanum();
            if (result1 === null) {
              if (input.charCodeAt(pos) === 45) {
                result1 = "-";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"-\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 33) {
                  result1 = "!";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"!\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 37) {
                    result1 = "%";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"%\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 42) {
                      result1 = "*";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"*\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 95) {
                        result1 = "_";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"_\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 43) {
                          result1 = "+";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"+\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 96) {
                            result1 = "`";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"`\"");
                            }
                          }
                          if (result1 === null) {
                            if (input.charCodeAt(pos) === 39) {
                              result1 = "'";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"'\"");
                              }
                            }
                            if (result1 === null) {
                              if (input.charCodeAt(pos) === 126) {
                                result1 = "~";
                                pos++;
                              } else {
                                result1 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"~\"");
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_separators() {
        var result0;
        
        if (input.charCodeAt(pos) === 40) {
          result0 = "(";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"(\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 41) {
            result0 = ")";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\")\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 60) {
              result0 = "<";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"<\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 62) {
                result0 = ">";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\">\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 64) {
                  result0 = "@";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"@\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 44) {
                    result0 = ",";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\",\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 59) {
                      result0 = ";";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\";\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 58) {
                        result0 = ":";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 92) {
                          result0 = "\\";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"\\\\\"");
                          }
                        }
                        if (result0 === null) {
                          result0 = parse_DQUOTE();
                          if (result0 === null) {
                            if (input.charCodeAt(pos) === 47) {
                              result0 = "/";
                              pos++;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"/\"");
                              }
                            }
                            if (result0 === null) {
                              if (input.charCodeAt(pos) === 91) {
                                result0 = "[";
                                pos++;
                              } else {
                                result0 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"[\"");
                                }
                              }
                              if (result0 === null) {
                                if (input.charCodeAt(pos) === 93) {
                                  result0 = "]";
                                  pos++;
                                } else {
                                  result0 = null;
                                  if (reportFailures === 0) {
                                    matchFailed("\"]\"");
                                  }
                                }
                                if (result0 === null) {
                                  if (input.charCodeAt(pos) === 63) {
                                    result0 = "?";
                                    pos++;
                                  } else {
                                    result0 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\"?\"");
                                    }
                                  }
                                  if (result0 === null) {
                                    if (input.charCodeAt(pos) === 61) {
                                      result0 = "=";
                                      pos++;
                                    } else {
                                      result0 = null;
                                      if (reportFailures === 0) {
                                        matchFailed("\"=\"");
                                      }
                                    }
                                    if (result0 === null) {
                                      if (input.charCodeAt(pos) === 123) {
                                        result0 = "{";
                                        pos++;
                                      } else {
                                        result0 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\"{\"");
                                        }
                                      }
                                      if (result0 === null) {
                                        if (input.charCodeAt(pos) === 125) {
                                          result0 = "}";
                                          pos++;
                                        } else {
                                          result0 = null;
                                          if (reportFailures === 0) {
                                            matchFailed("\"}\"");
                                          }
                                        }
                                        if (result0 === null) {
                                          result0 = parse_SP();
                                          if (result0 === null) {
                                            result0 = parse_HTAB();
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_word() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_alphanum();
        if (result1 === null) {
          if (input.charCodeAt(pos) === 45) {
            result1 = "-";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          if (result1 === null) {
            if (input.charCodeAt(pos) === 46) {
              result1 = ".";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result1 === null) {
              if (input.charCodeAt(pos) === 33) {
                result1 = "!";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"!\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 37) {
                  result1 = "%";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"%\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 42) {
                    result1 = "*";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"*\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 95) {
                      result1 = "_";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"_\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 43) {
                        result1 = "+";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 96) {
                          result1 = "`";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"`\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 39) {
                            result1 = "'";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"'\"");
                            }
                          }
                          if (result1 === null) {
                            if (input.charCodeAt(pos) === 126) {
                              result1 = "~";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"~\"");
                              }
                            }
                            if (result1 === null) {
                              if (input.charCodeAt(pos) === 40) {
                                result1 = "(";
                                pos++;
                              } else {
                                result1 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"(\"");
                                }
                              }
                              if (result1 === null) {
                                if (input.charCodeAt(pos) === 41) {
                                  result1 = ")";
                                  pos++;
                                } else {
                                  result1 = null;
                                  if (reportFailures === 0) {
                                    matchFailed("\")\"");
                                  }
                                }
                                if (result1 === null) {
                                  if (input.charCodeAt(pos) === 60) {
                                    result1 = "<";
                                    pos++;
                                  } else {
                                    result1 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\"<\"");
                                    }
                                  }
                                  if (result1 === null) {
                                    if (input.charCodeAt(pos) === 62) {
                                      result1 = ">";
                                      pos++;
                                    } else {
                                      result1 = null;
                                      if (reportFailures === 0) {
                                        matchFailed("\">\"");
                                      }
                                    }
                                    if (result1 === null) {
                                      if (input.charCodeAt(pos) === 58) {
                                        result1 = ":";
                                        pos++;
                                      } else {
                                        result1 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result1 === null) {
                                        if (input.charCodeAt(pos) === 92) {
                                          result1 = "\\";
                                          pos++;
                                        } else {
                                          result1 = null;
                                          if (reportFailures === 0) {
                                            matchFailed("\"\\\\\"");
                                          }
                                        }
                                        if (result1 === null) {
                                          result1 = parse_DQUOTE();
                                          if (result1 === null) {
                                            if (input.charCodeAt(pos) === 47) {
                                              result1 = "/";
                                              pos++;
                                            } else {
                                              result1 = null;
                                              if (reportFailures === 0) {
                                                matchFailed("\"/\"");
                                              }
                                            }
                                            if (result1 === null) {
                                              if (input.charCodeAt(pos) === 91) {
                                                result1 = "[";
                                                pos++;
                                              } else {
                                                result1 = null;
                                                if (reportFailures === 0) {
                                                  matchFailed("\"[\"");
                                                }
                                              }
                                              if (result1 === null) {
                                                if (input.charCodeAt(pos) === 93) {
                                                  result1 = "]";
                                                  pos++;
                                                } else {
                                                  result1 = null;
                                                  if (reportFailures === 0) {
                                                    matchFailed("\"]\"");
                                                  }
                                                }
                                                if (result1 === null) {
                                                  if (input.charCodeAt(pos) === 63) {
                                                    result1 = "?";
                                                    pos++;
                                                  } else {
                                                    result1 = null;
                                                    if (reportFailures === 0) {
                                                      matchFailed("\"?\"");
                                                    }
                                                  }
                                                  if (result1 === null) {
                                                    if (input.charCodeAt(pos) === 123) {
                                                      result1 = "{";
                                                      pos++;
                                                    } else {
                                                      result1 = null;
                                                      if (reportFailures === 0) {
                                                        matchFailed("\"{\"");
                                                      }
                                                    }
                                                    if (result1 === null) {
                                                      if (input.charCodeAt(pos) === 125) {
                                                        result1 = "}";
                                                        pos++;
                                                      } else {
                                                        result1 = null;
                                                        if (reportFailures === 0) {
                                                          matchFailed("\"}\"");
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_alphanum();
            if (result1 === null) {
              if (input.charCodeAt(pos) === 45) {
                result1 = "-";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"-\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 46) {
                  result1 = ".";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 33) {
                    result1 = "!";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"!\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 37) {
                      result1 = "%";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"%\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 42) {
                        result1 = "*";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"*\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 95) {
                          result1 = "_";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"_\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 43) {
                            result1 = "+";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"+\"");
                            }
                          }
                          if (result1 === null) {
                            if (input.charCodeAt(pos) === 96) {
                              result1 = "`";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"`\"");
                              }
                            }
                            if (result1 === null) {
                              if (input.charCodeAt(pos) === 39) {
                                result1 = "'";
                                pos++;
                              } else {
                                result1 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"'\"");
                                }
                              }
                              if (result1 === null) {
                                if (input.charCodeAt(pos) === 126) {
                                  result1 = "~";
                                  pos++;
                                } else {
                                  result1 = null;
                                  if (reportFailures === 0) {
                                    matchFailed("\"~\"");
                                  }
                                }
                                if (result1 === null) {
                                  if (input.charCodeAt(pos) === 40) {
                                    result1 = "(";
                                    pos++;
                                  } else {
                                    result1 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\"(\"");
                                    }
                                  }
                                  if (result1 === null) {
                                    if (input.charCodeAt(pos) === 41) {
                                      result1 = ")";
                                      pos++;
                                    } else {
                                      result1 = null;
                                      if (reportFailures === 0) {
                                        matchFailed("\")\"");
                                      }
                                    }
                                    if (result1 === null) {
                                      if (input.charCodeAt(pos) === 60) {
                                        result1 = "<";
                                        pos++;
                                      } else {
                                        result1 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\"<\"");
                                        }
                                      }
                                      if (result1 === null) {
                                        if (input.charCodeAt(pos) === 62) {
                                          result1 = ">";
                                          pos++;
                                        } else {
                                          result1 = null;
                                          if (reportFailures === 0) {
                                            matchFailed("\">\"");
                                          }
                                        }
                                        if (result1 === null) {
                                          if (input.charCodeAt(pos) === 58) {
                                            result1 = ":";
                                            pos++;
                                          } else {
                                            result1 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result1 === null) {
                                            if (input.charCodeAt(pos) === 92) {
                                              result1 = "\\";
                                              pos++;
                                            } else {
                                              result1 = null;
                                              if (reportFailures === 0) {
                                                matchFailed("\"\\\\\"");
                                              }
                                            }
                                            if (result1 === null) {
                                              result1 = parse_DQUOTE();
                                              if (result1 === null) {
                                                if (input.charCodeAt(pos) === 47) {
                                                  result1 = "/";
                                                  pos++;
                                                } else {
                                                  result1 = null;
                                                  if (reportFailures === 0) {
                                                    matchFailed("\"/\"");
                                                  }
                                                }
                                                if (result1 === null) {
                                                  if (input.charCodeAt(pos) === 91) {
                                                    result1 = "[";
                                                    pos++;
                                                  } else {
                                                    result1 = null;
                                                    if (reportFailures === 0) {
                                                      matchFailed("\"[\"");
                                                    }
                                                  }
                                                  if (result1 === null) {
                                                    if (input.charCodeAt(pos) === 93) {
                                                      result1 = "]";
                                                      pos++;
                                                    } else {
                                                      result1 = null;
                                                      if (reportFailures === 0) {
                                                        matchFailed("\"]\"");
                                                      }
                                                    }
                                                    if (result1 === null) {
                                                      if (input.charCodeAt(pos) === 63) {
                                                        result1 = "?";
                                                        pos++;
                                                      } else {
                                                        result1 = null;
                                                        if (reportFailures === 0) {
                                                          matchFailed("\"?\"");
                                                        }
                                                      }
                                                      if (result1 === null) {
                                                        if (input.charCodeAt(pos) === 123) {
                                                          result1 = "{";
                                                          pos++;
                                                        } else {
                                                          result1 = null;
                                                          if (reportFailures === 0) {
                                                            matchFailed("\"{\"");
                                                          }
                                                        }
                                                        if (result1 === null) {
                                                          if (input.charCodeAt(pos) === 125) {
                                                            result1 = "}";
                                                            pos++;
                                                          } else {
                                                            result1 = null;
                                                            if (reportFailures === 0) {
                                                              matchFailed("\"}\"");
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_STAR() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 42) {
            result1 = "*";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"*\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "*"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SLASH() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "/"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_EQUAL() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 61) {
            result1 = "=";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"=\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "="; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_LPAREN() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 40) {
            result1 = "(";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"(\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "("; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_RPAREN() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 41) {
            result1 = ")";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\")\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return ")"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_RAQUOT() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 62) {
          result0 = ">";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\">\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_SWS();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return ">"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_LAQUOT() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 60) {
            result1 = "<";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"<\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "<"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_COMMA() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 44) {
            result1 = ",";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\",\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return ","; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SEMI() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 59) {
            result1 = ";";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\";\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return ";"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_COLON() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_SWS();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return ":"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_LDQUOT() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          result1 = parse_DQUOTE();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "\""; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_RDQUOT() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_DQUOTE();
        if (result0 !== null) {
          result1 = parse_SWS();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {return "\""; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_comment() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_LPAREN();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_ctext();
          if (result2 === null) {
            result2 = parse_quoted_pair();
            if (result2 === null) {
              result2 = parse_comment();
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_ctext();
            if (result2 === null) {
              result2 = parse_quoted_pair();
              if (result2 === null) {
                result2 = parse_comment();
              }
            }
          }
          if (result1 !== null) {
            result2 = parse_RPAREN();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_ctext() {
        var result0;
        
        if (/^[!-']/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[!-']");
          }
        }
        if (result0 === null) {
          if (/^[*-[]/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[*-[]");
            }
          }
          if (result0 === null) {
            if (/^[\]-~]/.test(input.charAt(pos))) {
              result0 = input.charAt(pos);
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("[\\]-~]");
              }
            }
            if (result0 === null) {
              result0 = parse_UTF8_NONASCII();
              if (result0 === null) {
                result0 = parse_LWS();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_quoted_string() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          result1 = parse_DQUOTE();
          if (result1 !== null) {
            result2 = [];
            result3 = parse_qdtext();
            if (result3 === null) {
              result3 = parse_quoted_pair();
            }
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_qdtext();
              if (result3 === null) {
                result3 = parse_quoted_pair();
              }
            }
            if (result2 !== null) {
              result3 = parse_DQUOTE();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_quoted_string_clean() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SWS();
        if (result0 !== null) {
          result1 = parse_DQUOTE();
          if (result1 !== null) {
            result2 = [];
            result3 = parse_qdtext();
            if (result3 === null) {
              result3 = parse_quoted_pair();
            }
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_qdtext();
              if (result3 === null) {
                result3 = parse_quoted_pair();
              }
            }
            if (result2 !== null) {
              result3 = parse_DQUOTE();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                                return input.substring(pos-1, offset+1); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_qdtext() {
        var result0;
        
        result0 = parse_LWS();
        if (result0 === null) {
          if (input.charCodeAt(pos) === 33) {
            result0 = "!";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"!\"");
            }
          }
          if (result0 === null) {
            if (/^[#-[]/.test(input.charAt(pos))) {
              result0 = input.charAt(pos);
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("[#-[]");
              }
            }
            if (result0 === null) {
              if (/^[\]-~]/.test(input.charAt(pos))) {
                result0 = input.charAt(pos);
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("[\\]-~]");
                }
              }
              if (result0 === null) {
                result0 = parse_UTF8_NONASCII();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_quoted_pair() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        if (input.charCodeAt(pos) === 92) {
          result0 = "\\";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\\"");
          }
        }
        if (result0 !== null) {
          if (/^[\0-\t]/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[\\0-\\t]");
            }
          }
          if (result1 === null) {
            if (/^[\x0B-\f]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[\\x0B-\\f]");
              }
            }
            if (result1 === null) {
              if (/^[\x0E-]/.test(input.charAt(pos))) {
                result1 = input.charAt(pos);
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("[\\x0E-]");
                }
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SIP_URI_noparams() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_uri_scheme();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_userinfo();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = parse_hostport();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            try {
                                data.uri = new ExSIP.URI(data.scheme, data.user, data.host, data.port);
                                delete data.scheme;
                                delete data.user;
                                delete data.host;
                                delete data.host_type;
                                delete data.port;
                              } catch(e) {
                                data = -1;
                              }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SIP_URI() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_uri_scheme();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_userinfo();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = parse_hostport();
              if (result3 !== null) {
                result4 = parse_uri_parameters();
                if (result4 !== null) {
                  result5 = parse_headers();
                  result5 = result5 !== null ? result5 : "";
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            var header;
                            try {
                                data.uri = new ExSIP.URI(data.scheme, data.user, data.host, data.port, data.uri_params, data.uri_headers);
                                delete data.scheme;
                                delete data.user;
                                delete data.host;
                                delete data.host_type;
                                delete data.port;
                                delete data.uri_params;
        
                                if (startRule === 'SIP_URI') { data = data.uri;}
                              } catch(e) {
                                data = -1;
                              }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_uri_scheme() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 3).toLowerCase() === "sip") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"sip\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, uri_scheme) {
                            data.scheme = uri_scheme.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_userinfo() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_user();
        if (result0 !== null) {
          pos2 = pos;
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_password();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 64) {
              result2 = "@";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"@\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.user = window.decodeURIComponent(input.substring(pos-1, offset));})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_user() {
        var result0, result1;
        
        result1 = parse_unreserved();
        if (result1 === null) {
          result1 = parse_escaped();
          if (result1 === null) {
            result1 = parse_user_unreserved();
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_unreserved();
            if (result1 === null) {
              result1 = parse_escaped();
              if (result1 === null) {
                result1 = parse_user_unreserved();
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_user_unreserved() {
        var result0;
        
        if (input.charCodeAt(pos) === 38) {
          result0 = "&";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"&\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 61) {
            result0 = "=";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"=\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 43) {
              result0 = "+";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"+\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 36) {
                result0 = "$";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"$\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 44) {
                  result0 = ",";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\",\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 59) {
                    result0 = ";";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\";\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 63) {
                      result0 = "?";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"?\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 47) {
                        result0 = "/";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"/\"");
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_password() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = [];
        result1 = parse_unreserved();
        if (result1 === null) {
          result1 = parse_escaped();
          if (result1 === null) {
            if (input.charCodeAt(pos) === 38) {
              result1 = "&";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"&\"");
              }
            }
            if (result1 === null) {
              if (input.charCodeAt(pos) === 61) {
                result1 = "=";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"=\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 43) {
                  result1 = "+";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"+\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 36) {
                    result1 = "$";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"$\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 44) {
                      result1 = ",";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\",\"");
                      }
                    }
                  }
                }
              }
            }
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_unreserved();
          if (result1 === null) {
            result1 = parse_escaped();
            if (result1 === null) {
              if (input.charCodeAt(pos) === 38) {
                result1 = "&";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"&\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 61) {
                  result1 = "=";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"=\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 43) {
                    result1 = "+";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"+\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 36) {
                      result1 = "$";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"$\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 44) {
                        result1 = ",";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\",\"");
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.password = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_hostport() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_host();
        if (result0 !== null) {
          pos1 = pos;
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_port();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos1;
            }
          } else {
            result1 = null;
            pos = pos1;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_host() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_hostname();
        if (result0 === null) {
          result0 = parse_IPv4address();
          if (result0 === null) {
            result0 = parse_IPv6reference();
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.host = input.substring(pos, offset).toLowerCase();
                            return data.host; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_hostname() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        pos2 = pos;
        result1 = parse_domainlabel();
        if (result1 !== null) {
          if (input.charCodeAt(pos) === 46) {
            result2 = ".";
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result2 !== null) {
            result1 = [result1, result2];
          } else {
            result1 = null;
            pos = pos2;
          }
        } else {
          result1 = null;
          pos = pos2;
        }
        while (result1 !== null) {
          result0.push(result1);
          pos2 = pos;
          result1 = parse_domainlabel();
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 46) {
              result2 = ".";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
        }
        if (result0 !== null) {
          result1 = parse_toplabel();
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 46) {
              result2 = ".";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          data.host_type = 'domain';
                          return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_domainlabel() {
        var result0, result1;
        
        if (/^[a-zA-Z0-9_\-]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z0-9_\\-]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[a-zA-Z0-9_\-]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z0-9_\\-]");
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_toplabel() {
        var result0, result1;
        
        if (/^[a-zA-Z_\-]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z_\\-]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[a-zA-Z_\-]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z_\\-]");
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_IPv6reference() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 91) {
          result0 = "[";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_IPv6address();
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 93) {
              result2 = "]";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"]\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.host_type = 'IPv6';
                            return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_IPv6address() {
        var result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11, result12;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_h16();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_h16();
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 58) {
                result3 = ":";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\":\"");
                }
              }
              if (result3 !== null) {
                result4 = parse_h16();
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 58) {
                    result5 = ":";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\":\"");
                    }
                  }
                  if (result5 !== null) {
                    result6 = parse_h16();
                    if (result6 !== null) {
                      if (input.charCodeAt(pos) === 58) {
                        result7 = ":";
                        pos++;
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result7 !== null) {
                        result8 = parse_h16();
                        if (result8 !== null) {
                          if (input.charCodeAt(pos) === 58) {
                            result9 = ":";
                            pos++;
                          } else {
                            result9 = null;
                            if (reportFailures === 0) {
                              matchFailed("\":\"");
                            }
                          }
                          if (result9 !== null) {
                            result10 = parse_h16();
                            if (result10 !== null) {
                              if (input.charCodeAt(pos) === 58) {
                                result11 = ":";
                                pos++;
                              } else {
                                result11 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\":\"");
                                }
                              }
                              if (result11 !== null) {
                                result12 = parse_ls32();
                                if (result12 !== null) {
                                  result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11, result12];
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 === null) {
          pos1 = pos;
          if (input.substr(pos, 2) === "::") {
            result0 = "::";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"::\"");
            }
          }
          if (result0 !== null) {
            result1 = parse_h16();
            if (result1 !== null) {
              if (input.charCodeAt(pos) === 58) {
                result2 = ":";
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\":\"");
                }
              }
              if (result2 !== null) {
                result3 = parse_h16();
                if (result3 !== null) {
                  if (input.charCodeAt(pos) === 58) {
                    result4 = ":";
                    pos++;
                  } else {
                    result4 = null;
                    if (reportFailures === 0) {
                      matchFailed("\":\"");
                    }
                  }
                  if (result4 !== null) {
                    result5 = parse_h16();
                    if (result5 !== null) {
                      if (input.charCodeAt(pos) === 58) {
                        result6 = ":";
                        pos++;
                      } else {
                        result6 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result6 !== null) {
                        result7 = parse_h16();
                        if (result7 !== null) {
                          if (input.charCodeAt(pos) === 58) {
                            result8 = ":";
                            pos++;
                          } else {
                            result8 = null;
                            if (reportFailures === 0) {
                              matchFailed("\":\"");
                            }
                          }
                          if (result8 !== null) {
                            result9 = parse_h16();
                            if (result9 !== null) {
                              if (input.charCodeAt(pos) === 58) {
                                result10 = ":";
                                pos++;
                              } else {
                                result10 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\":\"");
                                }
                              }
                              if (result10 !== null) {
                                result11 = parse_ls32();
                                if (result11 !== null) {
                                  result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11];
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 === null) {
            pos1 = pos;
            if (input.substr(pos, 2) === "::") {
              result0 = "::";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"::\"");
              }
            }
            if (result0 !== null) {
              result1 = parse_h16();
              if (result1 !== null) {
                if (input.charCodeAt(pos) === 58) {
                  result2 = ":";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\":\"");
                  }
                }
                if (result2 !== null) {
                  result3 = parse_h16();
                  if (result3 !== null) {
                    if (input.charCodeAt(pos) === 58) {
                      result4 = ":";
                      pos++;
                    } else {
                      result4 = null;
                      if (reportFailures === 0) {
                        matchFailed("\":\"");
                      }
                    }
                    if (result4 !== null) {
                      result5 = parse_h16();
                      if (result5 !== null) {
                        if (input.charCodeAt(pos) === 58) {
                          result6 = ":";
                          pos++;
                        } else {
                          result6 = null;
                          if (reportFailures === 0) {
                            matchFailed("\":\"");
                          }
                        }
                        if (result6 !== null) {
                          result7 = parse_h16();
                          if (result7 !== null) {
                            if (input.charCodeAt(pos) === 58) {
                              result8 = ":";
                              pos++;
                            } else {
                              result8 = null;
                              if (reportFailures === 0) {
                                matchFailed("\":\"");
                              }
                            }
                            if (result8 !== null) {
                              result9 = parse_ls32();
                              if (result9 !== null) {
                                result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9];
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 === null) {
              pos1 = pos;
              if (input.substr(pos, 2) === "::") {
                result0 = "::";
                pos += 2;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"::\"");
                }
              }
              if (result0 !== null) {
                result1 = parse_h16();
                if (result1 !== null) {
                  if (input.charCodeAt(pos) === 58) {
                    result2 = ":";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\":\"");
                    }
                  }
                  if (result2 !== null) {
                    result3 = parse_h16();
                    if (result3 !== null) {
                      if (input.charCodeAt(pos) === 58) {
                        result4 = ":";
                        pos++;
                      } else {
                        result4 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result4 !== null) {
                        result5 = parse_h16();
                        if (result5 !== null) {
                          if (input.charCodeAt(pos) === 58) {
                            result6 = ":";
                            pos++;
                          } else {
                            result6 = null;
                            if (reportFailures === 0) {
                              matchFailed("\":\"");
                            }
                          }
                          if (result6 !== null) {
                            result7 = parse_ls32();
                            if (result7 !== null) {
                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 === null) {
                pos1 = pos;
                if (input.substr(pos, 2) === "::") {
                  result0 = "::";
                  pos += 2;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"::\"");
                  }
                }
                if (result0 !== null) {
                  result1 = parse_h16();
                  if (result1 !== null) {
                    if (input.charCodeAt(pos) === 58) {
                      result2 = ":";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\":\"");
                      }
                    }
                    if (result2 !== null) {
                      result3 = parse_h16();
                      if (result3 !== null) {
                        if (input.charCodeAt(pos) === 58) {
                          result4 = ":";
                          pos++;
                        } else {
                          result4 = null;
                          if (reportFailures === 0) {
                            matchFailed("\":\"");
                          }
                        }
                        if (result4 !== null) {
                          result5 = parse_ls32();
                          if (result5 !== null) {
                            result0 = [result0, result1, result2, result3, result4, result5];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
                if (result0 === null) {
                  pos1 = pos;
                  if (input.substr(pos, 2) === "::") {
                    result0 = "::";
                    pos += 2;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"::\"");
                    }
                  }
                  if (result0 !== null) {
                    result1 = parse_h16();
                    if (result1 !== null) {
                      if (input.charCodeAt(pos) === 58) {
                        result2 = ":";
                        pos++;
                      } else {
                        result2 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result2 !== null) {
                        result3 = parse_ls32();
                        if (result3 !== null) {
                          result0 = [result0, result1, result2, result3];
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 === null) {
                    pos1 = pos;
                    if (input.substr(pos, 2) === "::") {
                      result0 = "::";
                      pos += 2;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"::\"");
                      }
                    }
                    if (result0 !== null) {
                      result1 = parse_ls32();
                      if (result1 !== null) {
                        result0 = [result0, result1];
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                    if (result0 === null) {
                      pos1 = pos;
                      if (input.substr(pos, 2) === "::") {
                        result0 = "::";
                        pos += 2;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"::\"");
                        }
                      }
                      if (result0 !== null) {
                        result1 = parse_h16();
                        if (result1 !== null) {
                          result0 = [result0, result1];
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                      if (result0 === null) {
                        pos1 = pos;
                        result0 = parse_h16();
                        if (result0 !== null) {
                          if (input.substr(pos, 2) === "::") {
                            result1 = "::";
                            pos += 2;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"::\"");
                            }
                          }
                          if (result1 !== null) {
                            result2 = parse_h16();
                            if (result2 !== null) {
                              if (input.charCodeAt(pos) === 58) {
                                result3 = ":";
                                pos++;
                              } else {
                                result3 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\":\"");
                                }
                              }
                              if (result3 !== null) {
                                result4 = parse_h16();
                                if (result4 !== null) {
                                  if (input.charCodeAt(pos) === 58) {
                                    result5 = ":";
                                    pos++;
                                  } else {
                                    result5 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\":\"");
                                    }
                                  }
                                  if (result5 !== null) {
                                    result6 = parse_h16();
                                    if (result6 !== null) {
                                      if (input.charCodeAt(pos) === 58) {
                                        result7 = ":";
                                        pos++;
                                      } else {
                                        result7 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result7 !== null) {
                                        result8 = parse_h16();
                                        if (result8 !== null) {
                                          if (input.charCodeAt(pos) === 58) {
                                            result9 = ":";
                                            pos++;
                                          } else {
                                            result9 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result9 !== null) {
                                            result10 = parse_ls32();
                                            if (result10 !== null) {
                                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10];
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  } else {
                                    result0 = null;
                                    pos = pos1;
                                  }
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                        if (result0 === null) {
                          pos1 = pos;
                          result0 = parse_h16();
                          if (result0 !== null) {
                            pos2 = pos;
                            if (input.charCodeAt(pos) === 58) {
                              result1 = ":";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\":\"");
                              }
                            }
                            if (result1 !== null) {
                              result2 = parse_h16();
                              if (result2 !== null) {
                                result1 = [result1, result2];
                              } else {
                                result1 = null;
                                pos = pos2;
                              }
                            } else {
                              result1 = null;
                              pos = pos2;
                            }
                            result1 = result1 !== null ? result1 : "";
                            if (result1 !== null) {
                              if (input.substr(pos, 2) === "::") {
                                result2 = "::";
                                pos += 2;
                              } else {
                                result2 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"::\"");
                                }
                              }
                              if (result2 !== null) {
                                result3 = parse_h16();
                                if (result3 !== null) {
                                  if (input.charCodeAt(pos) === 58) {
                                    result4 = ":";
                                    pos++;
                                  } else {
                                    result4 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\":\"");
                                    }
                                  }
                                  if (result4 !== null) {
                                    result5 = parse_h16();
                                    if (result5 !== null) {
                                      if (input.charCodeAt(pos) === 58) {
                                        result6 = ":";
                                        pos++;
                                      } else {
                                        result6 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result6 !== null) {
                                        result7 = parse_h16();
                                        if (result7 !== null) {
                                          if (input.charCodeAt(pos) === 58) {
                                            result8 = ":";
                                            pos++;
                                          } else {
                                            result8 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result8 !== null) {
                                            result9 = parse_ls32();
                                            if (result9 !== null) {
                                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9];
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  } else {
                                    result0 = null;
                                    pos = pos1;
                                  }
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                          if (result0 === null) {
                            pos1 = pos;
                            result0 = parse_h16();
                            if (result0 !== null) {
                              pos2 = pos;
                              if (input.charCodeAt(pos) === 58) {
                                result1 = ":";
                                pos++;
                              } else {
                                result1 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\":\"");
                                }
                              }
                              if (result1 !== null) {
                                result2 = parse_h16();
                                if (result2 !== null) {
                                  result1 = [result1, result2];
                                } else {
                                  result1 = null;
                                  pos = pos2;
                                }
                              } else {
                                result1 = null;
                                pos = pos2;
                              }
                              result1 = result1 !== null ? result1 : "";
                              if (result1 !== null) {
                                pos2 = pos;
                                if (input.charCodeAt(pos) === 58) {
                                  result2 = ":";
                                  pos++;
                                } else {
                                  result2 = null;
                                  if (reportFailures === 0) {
                                    matchFailed("\":\"");
                                  }
                                }
                                if (result2 !== null) {
                                  result3 = parse_h16();
                                  if (result3 !== null) {
                                    result2 = [result2, result3];
                                  } else {
                                    result2 = null;
                                    pos = pos2;
                                  }
                                } else {
                                  result2 = null;
                                  pos = pos2;
                                }
                                result2 = result2 !== null ? result2 : "";
                                if (result2 !== null) {
                                  if (input.substr(pos, 2) === "::") {
                                    result3 = "::";
                                    pos += 2;
                                  } else {
                                    result3 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\"::\"");
                                    }
                                  }
                                  if (result3 !== null) {
                                    result4 = parse_h16();
                                    if (result4 !== null) {
                                      if (input.charCodeAt(pos) === 58) {
                                        result5 = ":";
                                        pos++;
                                      } else {
                                        result5 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result5 !== null) {
                                        result6 = parse_h16();
                                        if (result6 !== null) {
                                          if (input.charCodeAt(pos) === 58) {
                                            result7 = ":";
                                            pos++;
                                          } else {
                                            result7 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result7 !== null) {
                                            result8 = parse_ls32();
                                            if (result8 !== null) {
                                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8];
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  } else {
                                    result0 = null;
                                    pos = pos1;
                                  }
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                            if (result0 === null) {
                              pos1 = pos;
                              result0 = parse_h16();
                              if (result0 !== null) {
                                pos2 = pos;
                                if (input.charCodeAt(pos) === 58) {
                                  result1 = ":";
                                  pos++;
                                } else {
                                  result1 = null;
                                  if (reportFailures === 0) {
                                    matchFailed("\":\"");
                                  }
                                }
                                if (result1 !== null) {
                                  result2 = parse_h16();
                                  if (result2 !== null) {
                                    result1 = [result1, result2];
                                  } else {
                                    result1 = null;
                                    pos = pos2;
                                  }
                                } else {
                                  result1 = null;
                                  pos = pos2;
                                }
                                result1 = result1 !== null ? result1 : "";
                                if (result1 !== null) {
                                  pos2 = pos;
                                  if (input.charCodeAt(pos) === 58) {
                                    result2 = ":";
                                    pos++;
                                  } else {
                                    result2 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\":\"");
                                    }
                                  }
                                  if (result2 !== null) {
                                    result3 = parse_h16();
                                    if (result3 !== null) {
                                      result2 = [result2, result3];
                                    } else {
                                      result2 = null;
                                      pos = pos2;
                                    }
                                  } else {
                                    result2 = null;
                                    pos = pos2;
                                  }
                                  result2 = result2 !== null ? result2 : "";
                                  if (result2 !== null) {
                                    pos2 = pos;
                                    if (input.charCodeAt(pos) === 58) {
                                      result3 = ":";
                                      pos++;
                                    } else {
                                      result3 = null;
                                      if (reportFailures === 0) {
                                        matchFailed("\":\"");
                                      }
                                    }
                                    if (result3 !== null) {
                                      result4 = parse_h16();
                                      if (result4 !== null) {
                                        result3 = [result3, result4];
                                      } else {
                                        result3 = null;
                                        pos = pos2;
                                      }
                                    } else {
                                      result3 = null;
                                      pos = pos2;
                                    }
                                    result3 = result3 !== null ? result3 : "";
                                    if (result3 !== null) {
                                      if (input.substr(pos, 2) === "::") {
                                        result4 = "::";
                                        pos += 2;
                                      } else {
                                        result4 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\"::\"");
                                        }
                                      }
                                      if (result4 !== null) {
                                        result5 = parse_h16();
                                        if (result5 !== null) {
                                          if (input.charCodeAt(pos) === 58) {
                                            result6 = ":";
                                            pos++;
                                          } else {
                                            result6 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result6 !== null) {
                                            result7 = parse_ls32();
                                            if (result7 !== null) {
                                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7];
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  } else {
                                    result0 = null;
                                    pos = pos1;
                                  }
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                              if (result0 === null) {
                                pos1 = pos;
                                result0 = parse_h16();
                                if (result0 !== null) {
                                  pos2 = pos;
                                  if (input.charCodeAt(pos) === 58) {
                                    result1 = ":";
                                    pos++;
                                  } else {
                                    result1 = null;
                                    if (reportFailures === 0) {
                                      matchFailed("\":\"");
                                    }
                                  }
                                  if (result1 !== null) {
                                    result2 = parse_h16();
                                    if (result2 !== null) {
                                      result1 = [result1, result2];
                                    } else {
                                      result1 = null;
                                      pos = pos2;
                                    }
                                  } else {
                                    result1 = null;
                                    pos = pos2;
                                  }
                                  result1 = result1 !== null ? result1 : "";
                                  if (result1 !== null) {
                                    pos2 = pos;
                                    if (input.charCodeAt(pos) === 58) {
                                      result2 = ":";
                                      pos++;
                                    } else {
                                      result2 = null;
                                      if (reportFailures === 0) {
                                        matchFailed("\":\"");
                                      }
                                    }
                                    if (result2 !== null) {
                                      result3 = parse_h16();
                                      if (result3 !== null) {
                                        result2 = [result2, result3];
                                      } else {
                                        result2 = null;
                                        pos = pos2;
                                      }
                                    } else {
                                      result2 = null;
                                      pos = pos2;
                                    }
                                    result2 = result2 !== null ? result2 : "";
                                    if (result2 !== null) {
                                      pos2 = pos;
                                      if (input.charCodeAt(pos) === 58) {
                                        result3 = ":";
                                        pos++;
                                      } else {
                                        result3 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result3 !== null) {
                                        result4 = parse_h16();
                                        if (result4 !== null) {
                                          result3 = [result3, result4];
                                        } else {
                                          result3 = null;
                                          pos = pos2;
                                        }
                                      } else {
                                        result3 = null;
                                        pos = pos2;
                                      }
                                      result3 = result3 !== null ? result3 : "";
                                      if (result3 !== null) {
                                        pos2 = pos;
                                        if (input.charCodeAt(pos) === 58) {
                                          result4 = ":";
                                          pos++;
                                        } else {
                                          result4 = null;
                                          if (reportFailures === 0) {
                                            matchFailed("\":\"");
                                          }
                                        }
                                        if (result4 !== null) {
                                          result5 = parse_h16();
                                          if (result5 !== null) {
                                            result4 = [result4, result5];
                                          } else {
                                            result4 = null;
                                            pos = pos2;
                                          }
                                        } else {
                                          result4 = null;
                                          pos = pos2;
                                        }
                                        result4 = result4 !== null ? result4 : "";
                                        if (result4 !== null) {
                                          if (input.substr(pos, 2) === "::") {
                                            result5 = "::";
                                            pos += 2;
                                          } else {
                                            result5 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\"::\"");
                                            }
                                          }
                                          if (result5 !== null) {
                                            result6 = parse_ls32();
                                            if (result6 !== null) {
                                              result0 = [result0, result1, result2, result3, result4, result5, result6];
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  } else {
                                    result0 = null;
                                    pos = pos1;
                                  }
                                } else {
                                  result0 = null;
                                  pos = pos1;
                                }
                                if (result0 === null) {
                                  pos1 = pos;
                                  result0 = parse_h16();
                                  if (result0 !== null) {
                                    pos2 = pos;
                                    if (input.charCodeAt(pos) === 58) {
                                      result1 = ":";
                                      pos++;
                                    } else {
                                      result1 = null;
                                      if (reportFailures === 0) {
                                        matchFailed("\":\"");
                                      }
                                    }
                                    if (result1 !== null) {
                                      result2 = parse_h16();
                                      if (result2 !== null) {
                                        result1 = [result1, result2];
                                      } else {
                                        result1 = null;
                                        pos = pos2;
                                      }
                                    } else {
                                      result1 = null;
                                      pos = pos2;
                                    }
                                    result1 = result1 !== null ? result1 : "";
                                    if (result1 !== null) {
                                      pos2 = pos;
                                      if (input.charCodeAt(pos) === 58) {
                                        result2 = ":";
                                        pos++;
                                      } else {
                                        result2 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result2 !== null) {
                                        result3 = parse_h16();
                                        if (result3 !== null) {
                                          result2 = [result2, result3];
                                        } else {
                                          result2 = null;
                                          pos = pos2;
                                        }
                                      } else {
                                        result2 = null;
                                        pos = pos2;
                                      }
                                      result2 = result2 !== null ? result2 : "";
                                      if (result2 !== null) {
                                        pos2 = pos;
                                        if (input.charCodeAt(pos) === 58) {
                                          result3 = ":";
                                          pos++;
                                        } else {
                                          result3 = null;
                                          if (reportFailures === 0) {
                                            matchFailed("\":\"");
                                          }
                                        }
                                        if (result3 !== null) {
                                          result4 = parse_h16();
                                          if (result4 !== null) {
                                            result3 = [result3, result4];
                                          } else {
                                            result3 = null;
                                            pos = pos2;
                                          }
                                        } else {
                                          result3 = null;
                                          pos = pos2;
                                        }
                                        result3 = result3 !== null ? result3 : "";
                                        if (result3 !== null) {
                                          pos2 = pos;
                                          if (input.charCodeAt(pos) === 58) {
                                            result4 = ":";
                                            pos++;
                                          } else {
                                            result4 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result4 !== null) {
                                            result5 = parse_h16();
                                            if (result5 !== null) {
                                              result4 = [result4, result5];
                                            } else {
                                              result4 = null;
                                              pos = pos2;
                                            }
                                          } else {
                                            result4 = null;
                                            pos = pos2;
                                          }
                                          result4 = result4 !== null ? result4 : "";
                                          if (result4 !== null) {
                                            pos2 = pos;
                                            if (input.charCodeAt(pos) === 58) {
                                              result5 = ":";
                                              pos++;
                                            } else {
                                              result5 = null;
                                              if (reportFailures === 0) {
                                                matchFailed("\":\"");
                                              }
                                            }
                                            if (result5 !== null) {
                                              result6 = parse_h16();
                                              if (result6 !== null) {
                                                result5 = [result5, result6];
                                              } else {
                                                result5 = null;
                                                pos = pos2;
                                              }
                                            } else {
                                              result5 = null;
                                              pos = pos2;
                                            }
                                            result5 = result5 !== null ? result5 : "";
                                            if (result5 !== null) {
                                              if (input.substr(pos, 2) === "::") {
                                                result6 = "::";
                                                pos += 2;
                                              } else {
                                                result6 = null;
                                                if (reportFailures === 0) {
                                                  matchFailed("\"::\"");
                                                }
                                              }
                                              if (result6 !== null) {
                                                result7 = parse_h16();
                                                if (result7 !== null) {
                                                  result0 = [result0, result1, result2, result3, result4, result5, result6, result7];
                                                } else {
                                                  result0 = null;
                                                  pos = pos1;
                                                }
                                              } else {
                                                result0 = null;
                                                pos = pos1;
                                              }
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  } else {
                                    result0 = null;
                                    pos = pos1;
                                  }
                                  if (result0 === null) {
                                    pos1 = pos;
                                    result0 = parse_h16();
                                    if (result0 !== null) {
                                      pos2 = pos;
                                      if (input.charCodeAt(pos) === 58) {
                                        result1 = ":";
                                        pos++;
                                      } else {
                                        result1 = null;
                                        if (reportFailures === 0) {
                                          matchFailed("\":\"");
                                        }
                                      }
                                      if (result1 !== null) {
                                        result2 = parse_h16();
                                        if (result2 !== null) {
                                          result1 = [result1, result2];
                                        } else {
                                          result1 = null;
                                          pos = pos2;
                                        }
                                      } else {
                                        result1 = null;
                                        pos = pos2;
                                      }
                                      result1 = result1 !== null ? result1 : "";
                                      if (result1 !== null) {
                                        pos2 = pos;
                                        if (input.charCodeAt(pos) === 58) {
                                          result2 = ":";
                                          pos++;
                                        } else {
                                          result2 = null;
                                          if (reportFailures === 0) {
                                            matchFailed("\":\"");
                                          }
                                        }
                                        if (result2 !== null) {
                                          result3 = parse_h16();
                                          if (result3 !== null) {
                                            result2 = [result2, result3];
                                          } else {
                                            result2 = null;
                                            pos = pos2;
                                          }
                                        } else {
                                          result2 = null;
                                          pos = pos2;
                                        }
                                        result2 = result2 !== null ? result2 : "";
                                        if (result2 !== null) {
                                          pos2 = pos;
                                          if (input.charCodeAt(pos) === 58) {
                                            result3 = ":";
                                            pos++;
                                          } else {
                                            result3 = null;
                                            if (reportFailures === 0) {
                                              matchFailed("\":\"");
                                            }
                                          }
                                          if (result3 !== null) {
                                            result4 = parse_h16();
                                            if (result4 !== null) {
                                              result3 = [result3, result4];
                                            } else {
                                              result3 = null;
                                              pos = pos2;
                                            }
                                          } else {
                                            result3 = null;
                                            pos = pos2;
                                          }
                                          result3 = result3 !== null ? result3 : "";
                                          if (result3 !== null) {
                                            pos2 = pos;
                                            if (input.charCodeAt(pos) === 58) {
                                              result4 = ":";
                                              pos++;
                                            } else {
                                              result4 = null;
                                              if (reportFailures === 0) {
                                                matchFailed("\":\"");
                                              }
                                            }
                                            if (result4 !== null) {
                                              result5 = parse_h16();
                                              if (result5 !== null) {
                                                result4 = [result4, result5];
                                              } else {
                                                result4 = null;
                                                pos = pos2;
                                              }
                                            } else {
                                              result4 = null;
                                              pos = pos2;
                                            }
                                            result4 = result4 !== null ? result4 : "";
                                            if (result4 !== null) {
                                              pos2 = pos;
                                              if (input.charCodeAt(pos) === 58) {
                                                result5 = ":";
                                                pos++;
                                              } else {
                                                result5 = null;
                                                if (reportFailures === 0) {
                                                  matchFailed("\":\"");
                                                }
                                              }
                                              if (result5 !== null) {
                                                result6 = parse_h16();
                                                if (result6 !== null) {
                                                  result5 = [result5, result6];
                                                } else {
                                                  result5 = null;
                                                  pos = pos2;
                                                }
                                              } else {
                                                result5 = null;
                                                pos = pos2;
                                              }
                                              result5 = result5 !== null ? result5 : "";
                                              if (result5 !== null) {
                                                pos2 = pos;
                                                if (input.charCodeAt(pos) === 58) {
                                                  result6 = ":";
                                                  pos++;
                                                } else {
                                                  result6 = null;
                                                  if (reportFailures === 0) {
                                                    matchFailed("\":\"");
                                                  }
                                                }
                                                if (result6 !== null) {
                                                  result7 = parse_h16();
                                                  if (result7 !== null) {
                                                    result6 = [result6, result7];
                                                  } else {
                                                    result6 = null;
                                                    pos = pos2;
                                                  }
                                                } else {
                                                  result6 = null;
                                                  pos = pos2;
                                                }
                                                result6 = result6 !== null ? result6 : "";
                                                if (result6 !== null) {
                                                  if (input.substr(pos, 2) === "::") {
                                                    result7 = "::";
                                                    pos += 2;
                                                  } else {
                                                    result7 = null;
                                                    if (reportFailures === 0) {
                                                      matchFailed("\"::\"");
                                                    }
                                                  }
                                                  if (result7 !== null) {
                                                    result0 = [result0, result1, result2, result3, result4, result5, result6, result7];
                                                  } else {
                                                    result0 = null;
                                                    pos = pos1;
                                                  }
                                                } else {
                                                  result0 = null;
                                                  pos = pos1;
                                                }
                                              } else {
                                                result0 = null;
                                                pos = pos1;
                                              }
                                            } else {
                                              result0 = null;
                                              pos = pos1;
                                            }
                                          } else {
                                            result0 = null;
                                            pos = pos1;
                                          }
                                        } else {
                                          result0 = null;
                                          pos = pos1;
                                        }
                                      } else {
                                        result0 = null;
                                        pos = pos1;
                                      }
                                    } else {
                                      result0 = null;
                                      pos = pos1;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          data.host_type = 'IPv6';
                          return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_h16() {
        var result0, result1, result2, result3;
        var pos0;
        
        pos0 = pos;
        result0 = parse_HEXDIG();
        if (result0 !== null) {
          result1 = parse_HEXDIG();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_HEXDIG();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = parse_HEXDIG();
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_ls32() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_h16();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_h16();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_IPv4address();
        }
        return result0;
      }
      
      function parse_IPv4address() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_dec_octet();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 46) {
            result1 = ".";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_dec_octet();
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 46) {
                result3 = ".";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\".\"");
                }
              }
              if (result3 !== null) {
                result4 = parse_dec_octet();
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 46) {
                    result5 = ".";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\".\"");
                    }
                  }
                  if (result5 !== null) {
                    result6 = parse_dec_octet();
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.host_type = 'IPv4';
                            return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_dec_octet() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "25") {
          result0 = "25";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"25\"");
          }
        }
        if (result0 !== null) {
          if (/^[0-5]/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[0-5]");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.charCodeAt(pos) === 50) {
            result0 = "2";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"2\"");
            }
          }
          if (result0 !== null) {
            if (/^[0-4]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[0-4]");
              }
            }
            if (result1 !== null) {
              result2 = parse_DIGIT();
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            if (input.charCodeAt(pos) === 49) {
              result0 = "1";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"1\"");
              }
            }
            if (result0 !== null) {
              result1 = parse_DIGIT();
              if (result1 !== null) {
                result2 = parse_DIGIT();
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              if (/^[1-9]/.test(input.charAt(pos))) {
                result0 = input.charAt(pos);
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("[1-9]");
                }
              }
              if (result0 !== null) {
                result1 = parse_DIGIT();
                if (result1 !== null) {
                  result0 = [result0, result1];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
              if (result0 === null) {
                result0 = parse_DIGIT();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_port() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_DIGIT();
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          result1 = parse_DIGIT();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_DIGIT();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = parse_DIGIT();
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = parse_DIGIT();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, port) {
                            port = parseInt(port.join(''));
                            data.port = port;
                            return port; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_uri_parameters() {
        var result0, result1, result2;
        var pos0;
        
        result0 = [];
        pos0 = pos;
        if (input.charCodeAt(pos) === 59) {
          result1 = ";";
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("\";\"");
          }
        }
        if (result1 !== null) {
          result2 = parse_uri_parameter();
          if (result2 !== null) {
            result1 = [result1, result2];
          } else {
            result1 = null;
            pos = pos0;
          }
        } else {
          result1 = null;
          pos = pos0;
        }
        while (result1 !== null) {
          result0.push(result1);
          pos0 = pos;
          if (input.charCodeAt(pos) === 59) {
            result1 = ";";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\";\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_uri_parameter();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos0;
            }
          } else {
            result1 = null;
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_uri_parameter() {
        var result0;
        
        result0 = parse_transport_param();
        if (result0 === null) {
          result0 = parse_user_param();
          if (result0 === null) {
            result0 = parse_method_param();
            if (result0 === null) {
              result0 = parse_ttl_param();
              if (result0 === null) {
                result0 = parse_maddr_param();
                if (result0 === null) {
                  result0 = parse_lr_param();
                  if (result0 === null) {
                    result0 = parse_other_param();
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_transport_param() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 10).toLowerCase() === "transport=") {
          result0 = input.substr(pos, 10);
          pos += 10;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"transport=\"");
          }
        }
        if (result0 !== null) {
          if (input.substr(pos, 3).toLowerCase() === "udp") {
            result1 = input.substr(pos, 3);
            pos += 3;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"udp\"");
            }
          }
          if (result1 === null) {
            if (input.substr(pos, 3).toLowerCase() === "tcp") {
              result1 = input.substr(pos, 3);
              pos += 3;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"tcp\"");
              }
            }
            if (result1 === null) {
              if (input.substr(pos, 4).toLowerCase() === "sctp") {
                result1 = input.substr(pos, 4);
                pos += 4;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"sctp\"");
                }
              }
              if (result1 === null) {
                if (input.substr(pos, 3).toLowerCase() === "tls") {
                  result1 = input.substr(pos, 3);
                  pos += 3;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"tls\"");
                  }
                }
                if (result1 === null) {
                  result1 = parse_token();
                }
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, transport) {
                              if(!data.uri_params) data.uri_params={};
                              data.uri_params['transport'] = transport.toLowerCase(); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_user_param() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 5).toLowerCase() === "user=") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"user=\"");
          }
        }
        if (result0 !== null) {
          if (input.substr(pos, 5).toLowerCase() === "phone") {
            result1 = input.substr(pos, 5);
            pos += 5;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"phone\"");
            }
          }
          if (result1 === null) {
            if (input.substr(pos, 2).toLowerCase() === "ip") {
              result1 = input.substr(pos, 2);
              pos += 2;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"ip\"");
              }
            }
            if (result1 === null) {
              result1 = parse_token();
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, user) {
                              if(!data.uri_params) data.uri_params={};
                              data.uri_params['user'] = user.toLowerCase(); })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_method_param() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 7).toLowerCase() === "method=") {
          result0 = input.substr(pos, 7);
          pos += 7;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"method=\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_Method();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, method) {
                              if(!data.uri_params) data.uri_params={};
                              data.uri_params['method'] = method; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_ttl_param() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 4).toLowerCase() === "ttl=") {
          result0 = input.substr(pos, 4);
          pos += 4;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"ttl=\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_ttl();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ttl) {
                              if(!data.params) data.params={};
                              data.params['ttl'] = ttl; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_maddr_param() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 6).toLowerCase() === "maddr=") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"maddr=\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_host();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, maddr) {
                              if(!data.uri_params) data.uri_params={};
                              data.uri_params['maddr'] = maddr; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_lr_param() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 2).toLowerCase() === "lr") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"lr\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          if (input.charCodeAt(pos) === 61) {
            result1 = "=";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"=\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_token();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                              if(!data.uri_params) data.uri_params={};
                              data.uri_params['lr'] = undefined; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_other_param() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_pname();
        if (result0 !== null) {
          pos2 = pos;
          if (input.charCodeAt(pos) === 61) {
            result1 = "=";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"=\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_pvalue();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, param, value) {
                              if(!data.uri_params) data.uri_params = {};
                              if (typeof value === 'undefined'){
                                value = undefined;
                              }
                              else {
                                value = value[1];
                              }
                              data.uri_params[param.toLowerCase()] = value && value.toLowerCase();})(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_pname() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_paramchar();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_paramchar();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, pname) {return pname.join(''); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_pvalue() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_paramchar();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_paramchar();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, pvalue) {return pvalue.join(''); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_paramchar() {
        var result0;
        
        result0 = parse_param_unreserved();
        if (result0 === null) {
          result0 = parse_unreserved();
          if (result0 === null) {
            result0 = parse_escaped();
          }
        }
        return result0;
      }
      
      function parse_param_unreserved() {
        var result0;
        
        if (input.charCodeAt(pos) === 91) {
          result0 = "[";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 93) {
            result0 = "]";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"]\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 47) {
              result0 = "/";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"/\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 58) {
                result0 = ":";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\":\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 38) {
                  result0 = "&";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"&\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 43) {
                    result0 = "+";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"+\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 36) {
                      result0 = "$";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"$\"");
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_headers() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.charCodeAt(pos) === 63) {
          result0 = "?";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"?\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_header();
          if (result1 !== null) {
            result2 = [];
            pos1 = pos;
            if (input.charCodeAt(pos) === 38) {
              result3 = "&";
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("\"&\"");
              }
            }
            if (result3 !== null) {
              result4 = parse_header();
              if (result4 !== null) {
                result3 = [result3, result4];
              } else {
                result3 = null;
                pos = pos1;
              }
            } else {
              result3 = null;
              pos = pos1;
            }
            while (result3 !== null) {
              result2.push(result3);
              pos1 = pos;
              if (input.charCodeAt(pos) === 38) {
                result3 = "&";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\"&\"");
                }
              }
              if (result3 !== null) {
                result4 = parse_header();
                if (result4 !== null) {
                  result3 = [result3, result4];
                } else {
                  result3 = null;
                  pos = pos1;
                }
              } else {
                result3 = null;
                pos = pos1;
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_header() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_hname();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 61) {
            result1 = "=";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"=\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_hvalue();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, hname, hvalue) {
                              hname = hname.join('').toLowerCase();
                              hvalue = hvalue.join('');
                              if(!data.uri_headers) data.uri_headers = {};
                              if (!data.uri_headers[hname]) {
                                data.uri_headers[hname] = [hvalue];
                              } else {
                                data.uri_headers[hname].push(hvalue);
                              }})(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_hname() {
        var result0, result1;
        
        result1 = parse_hnv_unreserved();
        if (result1 === null) {
          result1 = parse_unreserved();
          if (result1 === null) {
            result1 = parse_escaped();
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_hnv_unreserved();
            if (result1 === null) {
              result1 = parse_unreserved();
              if (result1 === null) {
                result1 = parse_escaped();
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_hvalue() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_hnv_unreserved();
        if (result1 === null) {
          result1 = parse_unreserved();
          if (result1 === null) {
            result1 = parse_escaped();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_hnv_unreserved();
          if (result1 === null) {
            result1 = parse_unreserved();
            if (result1 === null) {
              result1 = parse_escaped();
            }
          }
        }
        return result0;
      }
      
      function parse_hnv_unreserved() {
        var result0;
        
        if (input.charCodeAt(pos) === 91) {
          result0 = "[";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 93) {
            result0 = "]";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"]\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 47) {
              result0 = "/";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"/\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 63) {
                result0 = "?";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"?\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 58) {
                  result0 = ":";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\":\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 43) {
                    result0 = "+";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"+\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 36) {
                      result0 = "$";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"$\"");
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_Request_Response() {
        var result0;
        
        result0 = parse_Status_Line();
        if (result0 === null) {
          result0 = parse_Request_Line();
        }
        return result0;
      }
      
      function parse_Request_Line() {
        var result0, result1, result2, result3, result4;
        var pos0;
        
        pos0 = pos;
        result0 = parse_Method();
        if (result0 !== null) {
          result1 = parse_SP();
          if (result1 !== null) {
            result2 = parse_Request_URI();
            if (result2 !== null) {
              result3 = parse_SP();
              if (result3 !== null) {
                result4 = parse_SIP_Version();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Request_URI() {
        var result0;
        
        result0 = parse_SIP_URI();
        if (result0 === null) {
          result0 = parse_absoluteURI();
        }
        return result0;
      }
      
      function parse_absoluteURI() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_scheme();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_hier_part();
            if (result2 === null) {
              result2 = parse_opaque_part();
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_hier_part() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_net_path();
        if (result0 === null) {
          result0 = parse_abs_path();
        }
        if (result0 !== null) {
          pos1 = pos;
          if (input.charCodeAt(pos) === 63) {
            result1 = "?";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"?\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_query();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos1;
            }
          } else {
            result1 = null;
            pos = pos1;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_net_path() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "//") {
          result0 = "//";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"//\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_authority();
          if (result1 !== null) {
            result2 = parse_abs_path();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_abs_path() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        if (input.charCodeAt(pos) === 47) {
          result0 = "/";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"/\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_path_segments();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_opaque_part() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_uric_no_slash();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_uric();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_uric();
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_uric() {
        var result0;
        
        result0 = parse_reserved();
        if (result0 === null) {
          result0 = parse_unreserved();
          if (result0 === null) {
            result0 = parse_escaped();
          }
        }
        return result0;
      }
      
      function parse_uric_no_slash() {
        var result0;
        
        result0 = parse_unreserved();
        if (result0 === null) {
          result0 = parse_escaped();
          if (result0 === null) {
            if (input.charCodeAt(pos) === 59) {
              result0 = ";";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 63) {
                result0 = "?";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"?\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 58) {
                  result0 = ":";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\":\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 64) {
                    result0 = "@";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"@\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 38) {
                      result0 = "&";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"&\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 61) {
                        result0 = "=";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"=\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 43) {
                          result0 = "+";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"+\"");
                          }
                        }
                        if (result0 === null) {
                          if (input.charCodeAt(pos) === 36) {
                            result0 = "$";
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"$\"");
                            }
                          }
                          if (result0 === null) {
                            if (input.charCodeAt(pos) === 44) {
                              result0 = ",";
                              pos++;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\",\"");
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_path_segments() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_segment();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          if (input.charCodeAt(pos) === 47) {
            result2 = "/";
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result2 !== null) {
            result3 = parse_segment();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            if (input.charCodeAt(pos) === 47) {
              result2 = "/";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"/\"");
              }
            }
            if (result2 !== null) {
              result3 = parse_segment();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_segment() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = [];
        result1 = parse_pchar();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_pchar();
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          if (input.charCodeAt(pos) === 59) {
            result2 = ";";
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\";\"");
            }
          }
          if (result2 !== null) {
            result3 = parse_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            if (input.charCodeAt(pos) === 59) {
              result2 = ";";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            if (result2 !== null) {
              result3 = parse_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_param() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_pchar();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_pchar();
        }
        return result0;
      }
      
      function parse_pchar() {
        var result0;
        
        result0 = parse_unreserved();
        if (result0 === null) {
          result0 = parse_escaped();
          if (result0 === null) {
            if (input.charCodeAt(pos) === 58) {
              result0 = ":";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\":\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 64) {
                result0 = "@";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"@\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 38) {
                  result0 = "&";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"&\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 61) {
                    result0 = "=";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"=\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 43) {
                      result0 = "+";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"+\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 36) {
                        result0 = "$";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"$\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 44) {
                          result0 = ",";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\",\"");
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_scheme() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_ALPHA();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_ALPHA();
          if (result2 === null) {
            result2 = parse_DIGIT();
            if (result2 === null) {
              if (input.charCodeAt(pos) === 43) {
                result2 = "+";
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"+\"");
                }
              }
              if (result2 === null) {
                if (input.charCodeAt(pos) === 45) {
                  result2 = "-";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"-\"");
                  }
                }
                if (result2 === null) {
                  if (input.charCodeAt(pos) === 46) {
                    result2 = ".";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\".\"");
                    }
                  }
                }
              }
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_ALPHA();
            if (result2 === null) {
              result2 = parse_DIGIT();
              if (result2 === null) {
                if (input.charCodeAt(pos) === 43) {
                  result2 = "+";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"+\"");
                  }
                }
                if (result2 === null) {
                  if (input.charCodeAt(pos) === 45) {
                    result2 = "-";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"-\"");
                    }
                  }
                  if (result2 === null) {
                    if (input.charCodeAt(pos) === 46) {
                      result2 = ".";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\".\"");
                      }
                    }
                  }
                }
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.scheme= input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_authority() {
        var result0;
        
        result0 = parse_srvr();
        if (result0 === null) {
          result0 = parse_reg_name();
        }
        return result0;
      }
      
      function parse_srvr() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_userinfo();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 64) {
            result1 = "@";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"@\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          result1 = parse_hostport();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse_reg_name() {
        var result0, result1;
        
        result1 = parse_unreserved();
        if (result1 === null) {
          result1 = parse_escaped();
          if (result1 === null) {
            if (input.charCodeAt(pos) === 36) {
              result1 = "$";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"$\"");
              }
            }
            if (result1 === null) {
              if (input.charCodeAt(pos) === 44) {
                result1 = ",";
                pos++;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\",\"");
                }
              }
              if (result1 === null) {
                if (input.charCodeAt(pos) === 59) {
                  result1 = ";";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\";\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 58) {
                    result1 = ":";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\":\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 64) {
                      result1 = "@";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"@\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 38) {
                        result1 = "&";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"&\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 61) {
                          result1 = "=";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"=\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 43) {
                            result1 = "+";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"+\"");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_unreserved();
            if (result1 === null) {
              result1 = parse_escaped();
              if (result1 === null) {
                if (input.charCodeAt(pos) === 36) {
                  result1 = "$";
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"$\"");
                  }
                }
                if (result1 === null) {
                  if (input.charCodeAt(pos) === 44) {
                    result1 = ",";
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("\",\"");
                    }
                  }
                  if (result1 === null) {
                    if (input.charCodeAt(pos) === 59) {
                      result1 = ";";
                      pos++;
                    } else {
                      result1 = null;
                      if (reportFailures === 0) {
                        matchFailed("\";\"");
                      }
                    }
                    if (result1 === null) {
                      if (input.charCodeAt(pos) === 58) {
                        result1 = ":";
                        pos++;
                      } else {
                        result1 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result1 === null) {
                        if (input.charCodeAt(pos) === 64) {
                          result1 = "@";
                          pos++;
                        } else {
                          result1 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"@\"");
                          }
                        }
                        if (result1 === null) {
                          if (input.charCodeAt(pos) === 38) {
                            result1 = "&";
                            pos++;
                          } else {
                            result1 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"&\"");
                            }
                          }
                          if (result1 === null) {
                            if (input.charCodeAt(pos) === 61) {
                              result1 = "=";
                              pos++;
                            } else {
                              result1 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"=\"");
                              }
                            }
                            if (result1 === null) {
                              if (input.charCodeAt(pos) === 43) {
                                result1 = "+";
                                pos++;
                              } else {
                                result1 = null;
                                if (reportFailures === 0) {
                                  matchFailed("\"+\"");
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_query() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_uric();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_uric();
        }
        return result0;
      }
      
      function parse_SIP_Version() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 3).toLowerCase() === "sip") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"SIP\"");
          }
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 47) {
            result1 = "/";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
          if (result1 !== null) {
            result3 = parse_DIGIT();
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                result3 = parse_DIGIT();
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 46) {
                result3 = ".";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\".\"");
                }
              }
              if (result3 !== null) {
                result5 = parse_DIGIT();
                if (result5 !== null) {
                  result4 = [];
                  while (result5 !== null) {
                    result4.push(result5);
                    result5 = parse_DIGIT();
                  }
                } else {
                  result4 = null;
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.sip_version = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_INVITEm() {
        var result0;
        
        if (input.substr(pos, 6) === "INVITE") {
          result0 = "INVITE";
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"INVITE\"");
          }
        }
        return result0;
      }
      
      function parse_ACKm() {
        var result0;
        
        if (input.substr(pos, 3) === "ACK") {
          result0 = "ACK";
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"ACK\"");
          }
        }
        return result0;
      }
      
      function parse_OPTIONSm() {
        var result0;
        
        if (input.substr(pos, 7) === "OPTIONS") {
          result0 = "OPTIONS";
          pos += 7;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"OPTIONS\"");
          }
        }
        return result0;
      }
      
      function parse_BYEm() {
        var result0;
        
        if (input.substr(pos, 3) === "BYE") {
          result0 = "BYE";
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"BYE\"");
          }
        }
        return result0;
      }
      
      function parse_CANCELm() {
        var result0;
        
        if (input.substr(pos, 6) === "CANCEL") {
          result0 = "CANCEL";
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"CANCEL\"");
          }
        }
        return result0;
      }
      
      function parse_REGISTERm() {
        var result0;
        
        if (input.substr(pos, 8) === "REGISTER") {
          result0 = "REGISTER";
          pos += 8;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"REGISTER\"");
          }
        }
        return result0;
      }
      
      function parse_SUBSCRIBEm() {
        var result0;
        
        if (input.substr(pos, 9) === "SUBSCRIBE") {
          result0 = "SUBSCRIBE";
          pos += 9;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"SUBSCRIBE\"");
          }
        }
        return result0;
      }
      
      function parse_NOTIFYm() {
        var result0;
        
        if (input.substr(pos, 6) === "NOTIFY") {
          result0 = "NOTIFY";
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"NOTIFY\"");
          }
        }
        return result0;
      }
      
      function parse_Method() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_INVITEm();
        if (result0 === null) {
          result0 = parse_ACKm();
          if (result0 === null) {
            result0 = parse_OPTIONSm();
            if (result0 === null) {
              result0 = parse_BYEm();
              if (result0 === null) {
                result0 = parse_CANCELm();
                if (result0 === null) {
                  result0 = parse_REGISTERm();
                  if (result0 === null) {
                    result0 = parse_SUBSCRIBEm();
                    if (result0 === null) {
                      result0 = parse_NOTIFYm();
                      if (result0 === null) {
                        result0 = parse_token();
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                            data.method = input.substring(pos, offset);
                            return data.method; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Status_Line() {
        var result0, result1, result2, result3, result4;
        var pos0;
        
        pos0 = pos;
        result0 = parse_SIP_Version();
        if (result0 !== null) {
          result1 = parse_SP();
          if (result1 !== null) {
            result2 = parse_Status_Code();
            if (result2 !== null) {
              result3 = parse_SP();
              if (result3 !== null) {
                result4 = parse_Reason_Phrase();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Status_Code() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_extension_code();
        if (result0 !== null) {
          result0 = (function(offset, status_code) {
                          data.status_code = parseInt(status_code.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_extension_code() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_DIGIT();
        if (result0 !== null) {
          result1 = parse_DIGIT();
          if (result1 !== null) {
            result2 = parse_DIGIT();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Reason_Phrase() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = [];
        result1 = parse_reserved();
        if (result1 === null) {
          result1 = parse_unreserved();
          if (result1 === null) {
            result1 = parse_escaped();
            if (result1 === null) {
              result1 = parse_UTF8_NONASCII();
              if (result1 === null) {
                result1 = parse_UTF8_CONT();
                if (result1 === null) {
                  result1 = parse_SP();
                  if (result1 === null) {
                    result1 = parse_HTAB();
                  }
                }
              }
            }
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_reserved();
          if (result1 === null) {
            result1 = parse_unreserved();
            if (result1 === null) {
              result1 = parse_escaped();
              if (result1 === null) {
                result1 = parse_UTF8_NONASCII();
                if (result1 === null) {
                  result1 = parse_UTF8_CONT();
                  if (result1 === null) {
                    result1 = parse_SP();
                    if (result1 === null) {
                      result1 = parse_HTAB();
                    }
                  }
                }
              }
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          data.reason_phrase = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Allow_Events() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_event_type();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_event_type();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_event_type();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Call_ID() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_word();
        if (result0 !== null) {
          pos2 = pos;
          if (input.charCodeAt(pos) === 64) {
            result1 = "@";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"@\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_word();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                      data = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Contact() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        result0 = parse_STAR();
        if (result0 === null) {
          pos1 = pos;
          result0 = parse_contact_param();
          if (result0 !== null) {
            result1 = [];
            pos2 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_contact_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
            while (result2 !== null) {
              result1.push(result2);
              pos2 = pos;
              result2 = parse_COMMA();
              if (result2 !== null) {
                result3 = parse_contact_param();
                if (result3 !== null) {
                  result2 = [result2, result3];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                                var idx, length;
                                length = data.multi_header.length;
                                for (idx = 0; idx < length; idx++) {
                                  if (data.multi_header[idx].parsed === null) {
                                    data = null;
                                    break;
                                  }
                                }
                                if (data !== null) {
                                  data = data.multi_header;
                                } else {
                                  data = -1;
                                }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_contact_param() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SIP_URI_noparams();
        if (result0 === null) {
          result0 = parse_name_addr();
        }
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_contact_params();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_contact_params();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                                var header;
                                if(!data.multi_header) data.multi_header = [];
                                try {
                                  header = new ExSIP.NameAddrHeader(data.uri, data.display_name, data.params);
                                  delete data.uri;
                                  delete data.display_name;
                                  delete data.params;
                                } catch(e) {
                                  header = null;
                                }
                                data.multi_header.push( { 'possition': pos,
                                                          'offset': offset,
                                                          'parsed': header
                                                        });})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_name_addr() {
        var result0, result1, result2, result3;
        var pos0;
        
        pos0 = pos;
        result0 = parse_display_name();
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          result1 = parse_LAQUOT();
          if (result1 !== null) {
            result2 = parse_SIP_URI();
            if (result2 !== null) {
              result3 = parse_RAQUOT();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_display_name() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_LWS();
          if (result2 !== null) {
            result3 = parse_token();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_LWS();
            if (result2 !== null) {
              result3 = parse_token();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 === null) {
          result0 = parse_quoted_string();
        }
        if (result0 !== null) {
          result0 = (function(offset, display_name) {
                                display_name = input.substring(pos, offset).trim();
                                if (display_name[0] === '\"') {
                                  display_name = display_name.substring(1, display_name.length-1);
                                }
                                data.display_name = display_name; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_contact_params() {
        var result0;
        
        result0 = parse_c_p_q();
        if (result0 === null) {
          result0 = parse_c_p_expires();
          if (result0 === null) {
            result0 = parse_generic_param();
          }
        }
        return result0;
      }
      
      function parse_c_p_q() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 1).toLowerCase() === "q") {
          result0 = input.substr(pos, 1);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"q\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_qvalue();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, q) {
                                if(!data.params) data.params = {};
                                data.params['q'] = q; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_c_p_expires() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 7).toLowerCase() === "expires") {
          result0 = input.substr(pos, 7);
          pos += 7;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"expires\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_delta_seconds();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, expires) {
                                if(!data.params) data.params = {};
                                data.params['expires'] = expires; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_delta_seconds() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_DIGIT();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_DIGIT();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, delta_seconds) {
                                return parseInt(delta_seconds.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_qvalue() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 48) {
          result0 = "0";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"0\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          if (input.charCodeAt(pos) === 46) {
            result1 = ".";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_DIGIT();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = parse_DIGIT();
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = parse_DIGIT();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result1 = [result1, result2, result3, result4];
                } else {
                  result1 = null;
                  pos = pos2;
                }
              } else {
                result1 = null;
                pos = pos2;
              }
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                                return parseFloat(input.substring(pos, offset)); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_generic_param() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_gen_value();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, param, value) {
                                if(!data.params) data.params = {};
                                if (typeof value === 'undefined'){
                                  value = undefined;
                                }
                                else {
                                  value = value[1];
                                }
                                data.params[param.toLowerCase()] = value;})(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_gen_value() {
        var result0;
        
        result0 = parse_token();
        if (result0 === null) {
          result0 = parse_host();
          if (result0 === null) {
            result0 = parse_quoted_string();
          }
        }
        return result0;
      }
      
      function parse_Content_Disposition() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_disp_type();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_disp_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_disp_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_disp_type() {
        var result0;
        
        if (input.substr(pos, 6).toLowerCase() === "render") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"render\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 7).toLowerCase() === "session") {
            result0 = input.substr(pos, 7);
            pos += 7;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"session\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 4).toLowerCase() === "icon") {
              result0 = input.substr(pos, 4);
              pos += 4;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"icon\"");
              }
            }
            if (result0 === null) {
              if (input.substr(pos, 5).toLowerCase() === "alert") {
                result0 = input.substr(pos, 5);
                pos += 5;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"alert\"");
                }
              }
              if (result0 === null) {
                result0 = parse_token();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_disp_param() {
        var result0;
        
        result0 = parse_handling_param();
        if (result0 === null) {
          result0 = parse_generic_param();
        }
        return result0;
      }
      
      function parse_handling_param() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 8).toLowerCase() === "handling") {
          result0 = input.substr(pos, 8);
          pos += 8;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"handling\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            if (input.substr(pos, 8).toLowerCase() === "optional") {
              result2 = input.substr(pos, 8);
              pos += 8;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"optional\"");
              }
            }
            if (result2 === null) {
              if (input.substr(pos, 8).toLowerCase() === "required") {
                result2 = input.substr(pos, 8);
                pos += 8;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"required\"");
                }
              }
              if (result2 === null) {
                result2 = parse_token();
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Content_Encoding() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_token();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_token();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Content_Length() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_DIGIT();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_DIGIT();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, length) {
                                data = parseInt(length.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Content_Type() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_media_type();
        if (result0 !== null) {
          result0 = (function(offset) {
                                data = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_media_type() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_m_type();
        if (result0 !== null) {
          result1 = parse_SLASH();
          if (result1 !== null) {
            result2 = parse_m_subtype();
            if (result2 !== null) {
              result3 = [];
              pos1 = pos;
              result4 = parse_SEMI();
              if (result4 !== null) {
                result5 = parse_m_parameter();
                if (result5 !== null) {
                  result4 = [result4, result5];
                } else {
                  result4 = null;
                  pos = pos1;
                }
              } else {
                result4 = null;
                pos = pos1;
              }
              while (result4 !== null) {
                result3.push(result4);
                pos1 = pos;
                result4 = parse_SEMI();
                if (result4 !== null) {
                  result5 = parse_m_parameter();
                  if (result5 !== null) {
                    result4 = [result4, result5];
                  } else {
                    result4 = null;
                    pos = pos1;
                  }
                } else {
                  result4 = null;
                  pos = pos1;
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_m_type() {
        var result0;
        
        result0 = parse_discrete_type();
        if (result0 === null) {
          result0 = parse_composite_type();
        }
        return result0;
      }
      
      function parse_discrete_type() {
        var result0;
        
        if (input.substr(pos, 4).toLowerCase() === "text") {
          result0 = input.substr(pos, 4);
          pos += 4;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"text\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 5).toLowerCase() === "image") {
            result0 = input.substr(pos, 5);
            pos += 5;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"image\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 5).toLowerCase() === "audio") {
              result0 = input.substr(pos, 5);
              pos += 5;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"audio\"");
              }
            }
            if (result0 === null) {
              if (input.substr(pos, 5).toLowerCase() === "video") {
                result0 = input.substr(pos, 5);
                pos += 5;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"video\"");
                }
              }
              if (result0 === null) {
                if (input.substr(pos, 11).toLowerCase() === "application") {
                  result0 = input.substr(pos, 11);
                  pos += 11;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"application\"");
                  }
                }
                if (result0 === null) {
                  result0 = parse_extension_token();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_composite_type() {
        var result0;
        
        if (input.substr(pos, 7).toLowerCase() === "message") {
          result0 = input.substr(pos, 7);
          pos += 7;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"message\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 9).toLowerCase() === "multipart") {
            result0 = input.substr(pos, 9);
            pos += 9;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"multipart\"");
            }
          }
          if (result0 === null) {
            result0 = parse_extension_token();
          }
        }
        return result0;
      }
      
      function parse_extension_token() {
        var result0;
        
        result0 = parse_token();
        if (result0 === null) {
          result0 = parse_x_token();
        }
        return result0;
      }
      
      function parse_x_token() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 2).toLowerCase() === "x-") {
          result0 = input.substr(pos, 2);
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"x-\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_token();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_m_subtype() {
        var result0;
        
        result0 = parse_extension_token();
        if (result0 === null) {
          result0 = parse_token();
        }
        return result0;
      }
      
      function parse_m_parameter() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_m_value();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_m_value() {
        var result0;
        
        result0 = parse_token();
        if (result0 === null) {
          result0 = parse_quoted_string();
        }
        return result0;
      }
      
      function parse_CSeq() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_CSeq_value();
        if (result0 !== null) {
          result1 = parse_LWS();
          if (result1 !== null) {
            result2 = parse_Method();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_CSeq_value() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_DIGIT();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_DIGIT();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, cseq_value) {
                          data.value=parseInt(cseq_value.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Expires() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_delta_seconds();
        if (result0 !== null) {
          result0 = (function(offset, expires) {data = expires; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Event() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_event_type();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_generic_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_generic_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, event_type) {
                               data.event = event_type.join('').toLowerCase(); })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_event_type() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_token_nodot();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          if (input.charCodeAt(pos) === 46) {
            result2 = ".";
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result2 !== null) {
            result3 = parse_token_nodot();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            if (input.charCodeAt(pos) === 46) {
              result2 = ".";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result2 !== null) {
              result3 = parse_token_nodot();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_From() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SIP_URI_noparams();
        if (result0 === null) {
          result0 = parse_name_addr();
        }
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_from_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_from_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                        var tag = data.tag;
                        try {
                          data = new ExSIP.NameAddrHeader(data.uri, data.display_name, data.params);
                          if (tag) {data.setParam('tag',tag)}
                        } catch(e) {
                          data = -1;
                        }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_from_param() {
        var result0;
        
        result0 = parse_tag_param();
        if (result0 === null) {
          result0 = parse_generic_param();
        }
        return result0;
      }
      
      function parse_tag_param() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 3).toLowerCase() === "tag") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"tag\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_token();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, tag) {data.tag = tag; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Max_Forwards() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_DIGIT();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_DIGIT();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, forwards) {
                          data = parseInt(forwards.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Min_Expires() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_delta_seconds();
        if (result0 !== null) {
          result0 = (function(offset, min_expires) {data = min_expires; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Name_Addr_Header() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        result1 = parse_display_name();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_display_name();
        }
        if (result0 !== null) {
          result1 = parse_LAQUOT();
          if (result1 !== null) {
            result2 = parse_SIP_URI();
            if (result2 !== null) {
              result3 = parse_RAQUOT();
              if (result3 !== null) {
                result4 = [];
                pos2 = pos;
                result5 = parse_SEMI();
                if (result5 !== null) {
                  result6 = parse_generic_param();
                  if (result6 !== null) {
                    result5 = [result5, result6];
                  } else {
                    result5 = null;
                    pos = pos2;
                  }
                } else {
                  result5 = null;
                  pos = pos2;
                }
                while (result5 !== null) {
                  result4.push(result5);
                  pos2 = pos;
                  result5 = parse_SEMI();
                  if (result5 !== null) {
                    result6 = parse_generic_param();
                    if (result6 !== null) {
                      result5 = [result5, result6];
                    } else {
                      result5 = null;
                      pos = pos2;
                    }
                  } else {
                    result5 = null;
                    pos = pos2;
                  }
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                              try {
                                data = new ExSIP.NameAddrHeader(data.uri, data.display_name, data.params);
                              } catch(e) {
                                data = -1;
                              }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Proxy_Authenticate() {
        var result0;
        
        result0 = parse_challenge();
        return result0;
      }
      
      function parse_challenge() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.substr(pos, 6).toLowerCase() === "digest") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"Digest\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_LWS();
          if (result1 !== null) {
            result2 = parse_digest_cln();
            if (result2 !== null) {
              result3 = [];
              pos1 = pos;
              result4 = parse_COMMA();
              if (result4 !== null) {
                result5 = parse_digest_cln();
                if (result5 !== null) {
                  result4 = [result4, result5];
                } else {
                  result4 = null;
                  pos = pos1;
                }
              } else {
                result4 = null;
                pos = pos1;
              }
              while (result4 !== null) {
                result3.push(result4);
                pos1 = pos;
                result4 = parse_COMMA();
                if (result4 !== null) {
                  result5 = parse_digest_cln();
                  if (result5 !== null) {
                    result4 = [result4, result5];
                  } else {
                    result4 = null;
                    pos = pos1;
                  }
                } else {
                  result4 = null;
                  pos = pos1;
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_other_challenge();
        }
        return result0;
      }
      
      function parse_other_challenge() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = parse_LWS();
          if (result1 !== null) {
            result2 = parse_auth_param();
            if (result2 !== null) {
              result3 = [];
              pos1 = pos;
              result4 = parse_COMMA();
              if (result4 !== null) {
                result5 = parse_auth_param();
                if (result5 !== null) {
                  result4 = [result4, result5];
                } else {
                  result4 = null;
                  pos = pos1;
                }
              } else {
                result4 = null;
                pos = pos1;
              }
              while (result4 !== null) {
                result3.push(result4);
                pos1 = pos;
                result4 = parse_COMMA();
                if (result4 !== null) {
                  result5 = parse_auth_param();
                  if (result5 !== null) {
                    result4 = [result4, result5];
                  } else {
                    result4 = null;
                    pos = pos1;
                  }
                } else {
                  result4 = null;
                  pos = pos1;
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_auth_param() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_token();
            if (result2 === null) {
              result2 = parse_quoted_string();
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_digest_cln() {
        var result0;
        
        result0 = parse_realm();
        if (result0 === null) {
          result0 = parse_domain();
          if (result0 === null) {
            result0 = parse_nonce();
            if (result0 === null) {
              result0 = parse_opaque();
              if (result0 === null) {
                result0 = parse_stale();
                if (result0 === null) {
                  result0 = parse_algorithm();
                  if (result0 === null) {
                    result0 = parse_qop_options();
                    if (result0 === null) {
                      result0 = parse_auth_param();
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_realm() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "realm") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"realm\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_realm_value();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_realm_value() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_quoted_string_clean();
        if (result0 !== null) {
          result0 = (function(offset, realm) { data.realm = realm; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_domain() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.substr(pos, 6).toLowerCase() === "domain") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"domain\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_LDQUOT();
            if (result2 !== null) {
              result3 = parse_URI();
              if (result3 !== null) {
                result4 = [];
                pos1 = pos;
                result6 = parse_SP();
                if (result6 !== null) {
                  result5 = [];
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse_SP();
                  }
                } else {
                  result5 = null;
                }
                if (result5 !== null) {
                  result6 = parse_URI();
                  if (result6 !== null) {
                    result5 = [result5, result6];
                  } else {
                    result5 = null;
                    pos = pos1;
                  }
                } else {
                  result5 = null;
                  pos = pos1;
                }
                while (result5 !== null) {
                  result4.push(result5);
                  pos1 = pos;
                  result6 = parse_SP();
                  if (result6 !== null) {
                    result5 = [];
                    while (result6 !== null) {
                      result5.push(result6);
                      result6 = parse_SP();
                    }
                  } else {
                    result5 = null;
                  }
                  if (result5 !== null) {
                    result6 = parse_URI();
                    if (result6 !== null) {
                      result5 = [result5, result6];
                    } else {
                      result5 = null;
                      pos = pos1;
                    }
                  } else {
                    result5 = null;
                    pos = pos1;
                  }
                }
                if (result4 !== null) {
                  result5 = parse_RDQUOT();
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = pos0;
                  }
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_URI() {
        var result0;
        
        result0 = parse_absoluteURI();
        if (result0 === null) {
          result0 = parse_abs_path();
        }
        return result0;
      }
      
      function parse_nonce() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "nonce") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"nonce\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_nonce_value();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nonce_value() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_quoted_string_clean();
        if (result0 !== null) {
          result0 = (function(offset, nonce) { data.nonce=nonce; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_opaque() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 6).toLowerCase() === "opaque") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"opaque\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_quoted_string_clean();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, opaque) { data.opaque=opaque; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stale() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "stale") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"stale\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            pos1 = pos;
            if (input.substr(pos, 4).toLowerCase() === "true") {
              result2 = input.substr(pos, 4);
              pos += 4;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"true\"");
              }
            }
            if (result2 !== null) {
              result2 = (function(offset) { data.stale=true; })(pos1);
            }
            if (result2 === null) {
              pos = pos1;
            }
            if (result2 === null) {
              pos1 = pos;
              if (input.substr(pos, 5).toLowerCase() === "false") {
                result2 = input.substr(pos, 5);
                pos += 5;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"false\"");
                }
              }
              if (result2 !== null) {
                result2 = (function(offset) { data.stale=false; })(pos1);
              }
              if (result2 === null) {
                pos = pos1;
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_algorithm() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 9).toLowerCase() === "algorithm") {
          result0 = input.substr(pos, 9);
          pos += 9;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"algorithm\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            if (input.substr(pos, 3).toLowerCase() === "md5") {
              result2 = input.substr(pos, 3);
              pos += 3;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"MD5\"");
              }
            }
            if (result2 === null) {
              if (input.substr(pos, 8).toLowerCase() === "md5-sess") {
                result2 = input.substr(pos, 8);
                pos += 8;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"MD5-sess\"");
                }
              }
              if (result2 === null) {
                result2 = parse_token();
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, algorithm) {
                              data.algorithm=algorithm.toUpperCase(); })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_qop_options() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        if (input.substr(pos, 3).toLowerCase() === "qop") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"qop\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_LDQUOT();
            if (result2 !== null) {
              pos1 = pos;
              result3 = parse_qop_value();
              if (result3 !== null) {
                result4 = [];
                pos2 = pos;
                if (input.charCodeAt(pos) === 44) {
                  result5 = ",";
                  pos++;
                } else {
                  result5 = null;
                  if (reportFailures === 0) {
                    matchFailed("\",\"");
                  }
                }
                if (result5 !== null) {
                  result6 = parse_qop_value();
                  if (result6 !== null) {
                    result5 = [result5, result6];
                  } else {
                    result5 = null;
                    pos = pos2;
                  }
                } else {
                  result5 = null;
                  pos = pos2;
                }
                while (result5 !== null) {
                  result4.push(result5);
                  pos2 = pos;
                  if (input.charCodeAt(pos) === 44) {
                    result5 = ",";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\",\"");
                    }
                  }
                  if (result5 !== null) {
                    result6 = parse_qop_value();
                    if (result6 !== null) {
                      result5 = [result5, result6];
                    } else {
                      result5 = null;
                      pos = pos2;
                    }
                  } else {
                    result5 = null;
                    pos = pos2;
                  }
                }
                if (result4 !== null) {
                  result3 = [result3, result4];
                } else {
                  result3 = null;
                  pos = pos1;
                }
              } else {
                result3 = null;
                pos = pos1;
              }
              if (result3 !== null) {
                result4 = parse_RDQUOT();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_qop_value() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 8).toLowerCase() === "auth-int") {
          result0 = input.substr(pos, 8);
          pos += 8;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"auth-int\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 4).toLowerCase() === "auth") {
            result0 = input.substr(pos, 4);
            pos += 4;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"auth\"");
            }
          }
          if (result0 === null) {
            result0 = parse_token();
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, qop_value) {
                                data.qop || (data.qop=[]);
                                data.qop.push(qop_value.toLowerCase()); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Proxy_Require() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_token();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_token();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Record_Route() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_rec_route();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_rec_route();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_rec_route();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          var idx, length;
                          length = data.multi_header.length;
                          for (idx = 0; idx < length; idx++) {
                            if (data.multi_header[idx].parsed === null) {
                              data = null;
                              break;
                            }
                          }
                          if (data !== null) {
                            data = data.multi_header;
                          } else {
                            data = -1;
                          }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_rec_route() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_name_addr();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_generic_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_generic_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                          var header;
                          if(!data.multi_header) data.multi_header = [];
                          try {
                            header = new ExSIP.NameAddrHeader(data.uri, data.display_name, data.params);
                            delete data.uri;
                            delete data.display_name;
                            delete data.params;
                          } catch(e) {
                            header = null;
                          }
                          data.multi_header.push( { 'possition': pos,
                                                    'offset': offset,
                                                    'parsed': header
                                                  });})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Require() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_token();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_token();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Route() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_route_param();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_route_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_route_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_route_param() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_name_addr();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_generic_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_generic_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Subscription_State() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_substate_value();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_subexp_params();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_subexp_params();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_substate_value() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 6).toLowerCase() === "active") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"active\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 7).toLowerCase() === "pending") {
            result0 = input.substr(pos, 7);
            pos += 7;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"pending\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 10).toLowerCase() === "terminated") {
              result0 = input.substr(pos, 10);
              pos += 10;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"terminated\"");
              }
            }
            if (result0 === null) {
              result0 = parse_token();
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                                data.state = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_subexp_params() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 6).toLowerCase() === "reason") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"reason\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_event_reason_value();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, reason) {
                                if (typeof reason !== 'undefined') data.reason = reason; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.substr(pos, 7).toLowerCase() === "expires") {
            result0 = input.substr(pos, 7);
            pos += 7;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"expires\"");
            }
          }
          if (result0 !== null) {
            result1 = parse_EQUAL();
            if (result1 !== null) {
              result2 = parse_delta_seconds();
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, expires) {
                                  if (typeof expires !== 'undefined') data.expires = expires; })(pos0, result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (input.substr(pos, 11).toLowerCase() === "retry_after") {
              result0 = input.substr(pos, 11);
              pos += 11;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"retry_after\"");
              }
            }
            if (result0 !== null) {
              result1 = parse_EQUAL();
              if (result1 !== null) {
                result2 = parse_delta_seconds();
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, retry_after) {
                                    if (typeof retry_after !== 'undefined') data.retry_after = retry_after; })(pos0, result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              result0 = parse_generic_param();
            }
          }
        }
        return result0;
      }
      
      function parse_event_reason_value() {
        var result0;
        
        if (input.substr(pos, 11).toLowerCase() === "deactivated") {
          result0 = input.substr(pos, 11);
          pos += 11;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"deactivated\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 9).toLowerCase() === "probation") {
            result0 = input.substr(pos, 9);
            pos += 9;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"probation\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 8).toLowerCase() === "rejected") {
              result0 = input.substr(pos, 8);
              pos += 8;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"rejected\"");
              }
            }
            if (result0 === null) {
              if (input.substr(pos, 7).toLowerCase() === "timeout") {
                result0 = input.substr(pos, 7);
                pos += 7;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"timeout\"");
                }
              }
              if (result0 === null) {
                if (input.substr(pos, 6).toLowerCase() === "giveup") {
                  result0 = input.substr(pos, 6);
                  pos += 6;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"giveup\"");
                  }
                }
                if (result0 === null) {
                  if (input.substr(pos, 10).toLowerCase() === "noresource") {
                    result0 = input.substr(pos, 10);
                    pos += 10;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"noresource\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.substr(pos, 9).toLowerCase() === "invariant") {
                      result0 = input.substr(pos, 9);
                      pos += 9;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"invariant\"");
                      }
                    }
                    if (result0 === null) {
                      result0 = parse_token();
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_Subject() {
        var result0;
        
        result0 = parse_TEXT_UTF8_TRIM();
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse_Supported() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_token();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_token();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse_To() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_SIP_URI_noparams();
        if (result0 === null) {
          result0 = parse_name_addr();
        }
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse_SEMI();
          if (result2 !== null) {
            result3 = parse_to_param();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse_SEMI();
            if (result2 !== null) {
              result3 = parse_to_param();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                      var tag = data.tag;
                      try {
                        data = new ExSIP.NameAddrHeader(data.uri, data.display_name, data.params);
                        if (tag) {data.setParam('tag',tag)}
                      } catch(e) {
                        data = -1;
                      }})(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_to_param() {
        var result0;
        
        result0 = parse_tag_param();
        if (result0 === null) {
          result0 = parse_generic_param();
        }
        return result0;
      }
      
      function parse_Via() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_via_parm();
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          result2 = parse_COMMA();
          if (result2 !== null) {
            result3 = parse_via_parm();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            result2 = parse_COMMA();
            if (result2 !== null) {
              result3 = parse_via_parm();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_parm() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_sent_protocol();
        if (result0 !== null) {
          result1 = parse_LWS();
          if (result1 !== null) {
            result2 = parse_sent_by();
            if (result2 !== null) {
              result3 = [];
              pos1 = pos;
              result4 = parse_SEMI();
              if (result4 !== null) {
                result5 = parse_via_params();
                if (result5 !== null) {
                  result4 = [result4, result5];
                } else {
                  result4 = null;
                  pos = pos1;
                }
              } else {
                result4 = null;
                pos = pos1;
              }
              while (result4 !== null) {
                result3.push(result4);
                pos1 = pos;
                result4 = parse_SEMI();
                if (result4 !== null) {
                  result5 = parse_via_params();
                  if (result5 !== null) {
                    result4 = [result4, result5];
                  } else {
                    result4 = null;
                    pos = pos1;
                  }
                } else {
                  result4 = null;
                  pos = pos1;
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_params() {
        var result0;
        
        result0 = parse_via_ttl();
        if (result0 === null) {
          result0 = parse_via_maddr();
          if (result0 === null) {
            result0 = parse_via_received();
            if (result0 === null) {
              result0 = parse_via_branch();
              if (result0 === null) {
                result0 = parse_response_port();
                if (result0 === null) {
                  result0 = parse_generic_param();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_via_ttl() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 3).toLowerCase() === "ttl") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"ttl\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_ttl();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, via_ttl_value) {
                              data.ttl = via_ttl_value; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_maddr() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 5).toLowerCase() === "maddr") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"maddr\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_host();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, via_maddr) {
                              data.maddr = via_maddr; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_received() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 8).toLowerCase() === "received") {
          result0 = input.substr(pos, 8);
          pos += 8;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"received\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_IPv4address();
            if (result2 === null) {
              result2 = parse_IPv6address();
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, via_received) {
                              data.received = via_received; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_branch() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 6).toLowerCase() === "branch") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"branch\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = parse_token();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, via_branch) {
                              data.branch = via_branch; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_response_port() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 5).toLowerCase() === "rport") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"rport\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_EQUAL();
          if (result1 !== null) {
            result2 = [];
            result3 = parse_DIGIT();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_DIGIT();
            }
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                              if(typeof response_port !== 'undefined')
                                data.rport = response_port.join(''); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_sent_protocol() {
        var result0, result1, result2, result3, result4;
        var pos0;
        
        pos0 = pos;
        result0 = parse_protocol_name();
        if (result0 !== null) {
          result1 = parse_SLASH();
          if (result1 !== null) {
            result2 = parse_token();
            if (result2 !== null) {
              result3 = parse_SLASH();
              if (result3 !== null) {
                result4 = parse_transport();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_protocol_name() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 3).toLowerCase() === "sip") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"SIP\"");
          }
        }
        if (result0 === null) {
          result0 = parse_token();
        }
        if (result0 !== null) {
          result0 = (function(offset, via_protocol) {
                              data.protocol = via_protocol; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_transport() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 3).toLowerCase() === "udp") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"UDP\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 3).toLowerCase() === "tcp") {
            result0 = input.substr(pos, 3);
            pos += 3;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"TCP\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 3).toLowerCase() === "tls") {
              result0 = input.substr(pos, 3);
              pos += 3;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"TLS\"");
              }
            }
            if (result0 === null) {
              if (input.substr(pos, 4).toLowerCase() === "sctp") {
                result0 = input.substr(pos, 4);
                pos += 4;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"SCTP\"");
                }
              }
              if (result0 === null) {
                result0 = parse_token();
              }
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, via_transport) {
                              data.transport = via_transport; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_sent_by() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_via_host();
        if (result0 !== null) {
          pos1 = pos;
          result1 = parse_COLON();
          if (result1 !== null) {
            result2 = parse_via_port();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos1;
            }
          } else {
            result1 = null;
            pos = pos1;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_host() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_hostname();
        if (result0 === null) {
          result0 = parse_IPv4address();
          if (result0 === null) {
            result0 = parse_IPv6reference();
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                              data.host = input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_via_port() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_DIGIT();
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          result1 = parse_DIGIT();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_DIGIT();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = parse_DIGIT();
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = parse_DIGIT();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, via_sent_by_port) {
                              data.port = parseInt(via_sent_by_port.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_ttl() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_DIGIT();
        if (result0 !== null) {
          result1 = parse_DIGIT();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_DIGIT();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, ttl) {
                              return parseInt(ttl.join('')); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_WWW_Authenticate() {
        var result0;
        
        result0 = parse_challenge();
        return result0;
      }
      
      function parse_extension_header() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_token();
        if (result0 !== null) {
          result1 = parse_HCOLON();
          if (result1 !== null) {
            result2 = parse_header_value();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_header_value() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_TEXT_UTF8char();
        if (result1 === null) {
          result1 = parse_UTF8_CONT();
          if (result1 === null) {
            result1 = parse_LWS();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_TEXT_UTF8char();
          if (result1 === null) {
            result1 = parse_UTF8_CONT();
            if (result1 === null) {
              result1 = parse_LWS();
            }
          }
        }
        return result0;
      }
      
      function parse_message_body() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_OCTET();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_OCTET();
        }
        return result0;
      }
      
      function parse_stun_URI() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        result0 = parse_stun_scheme();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_stun_host_port();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stun_scheme() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "stuns") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"stuns\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 4).toLowerCase() === "stun") {
            result0 = input.substr(pos, 4);
            pos += 4;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"stun\"");
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, scheme) {
                              data.scheme = scheme; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stun_host_port() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_stun_host();
        if (result0 !== null) {
          pos1 = pos;
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_port();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos1;
            }
          } else {
            result1 = null;
            pos = pos1;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stun_host() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_IPv4address();
        if (result0 === null) {
          result0 = parse_IPv6reference();
          if (result0 === null) {
            result0 = parse_reg_name();
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, host) {
                              data.host = host; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_reg_name() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = [];
        result1 = parse_stun_unreserved();
        if (result1 === null) {
          result1 = parse_escaped();
          if (result1 === null) {
            result1 = parse_sub_delims();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_stun_unreserved();
          if (result1 === null) {
            result1 = parse_escaped();
            if (result1 === null) {
              result1 = parse_sub_delims();
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                              return input.substring(pos, offset); })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stun_unreserved() {
        var result0;
        
        result0 = parse_ALPHA();
        if (result0 === null) {
          result0 = parse_DIGIT();
          if (result0 === null) {
            if (input.charCodeAt(pos) === 45) {
              result0 = "-";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"-\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 46) {
                result0 = ".";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\".\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 95) {
                  result0 = "_";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"_\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 126) {
                    result0 = "~";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"~\"");
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_sub_delims() {
        var result0;
        
        if (input.charCodeAt(pos) === 33) {
          result0 = "!";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"!\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 36) {
            result0 = "$";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"$\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 38) {
              result0 = "&";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"&\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 39) {
                result0 = "'";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"'\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 40) {
                  result0 = "(";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"(\"");
                  }
                }
                if (result0 === null) {
                  if (input.charCodeAt(pos) === 41) {
                    result0 = ")";
                    pos++;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\")\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 42) {
                      result0 = "*";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"*\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.charCodeAt(pos) === 43) {
                        result0 = "+";
                        pos++;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"+\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 44) {
                          result0 = ",";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\",\"");
                          }
                        }
                        if (result0 === null) {
                          if (input.charCodeAt(pos) === 59) {
                            result0 = ";";
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("\";\"");
                            }
                          }
                          if (result0 === null) {
                            if (input.charCodeAt(pos) === 61) {
                              result0 = "=";
                              pos++;
                            } else {
                              result0 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"=\"");
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_turn_URI() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_turn_scheme();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 58) {
            result1 = ":";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\":\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_stun_host_port();
            if (result2 !== null) {
              pos1 = pos;
              if (input.substr(pos, 11) === "?transport=") {
                result3 = "?transport=";
                pos += 11;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\"?transport=\"");
                }
              }
              if (result3 !== null) {
                result4 = parse_transport();
                if (result4 !== null) {
                  result3 = [result3, result4];
                } else {
                  result3 = null;
                  pos = pos1;
                }
              } else {
                result3 = null;
                pos = pos1;
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_turn_scheme() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "turns") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"turns\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 4).toLowerCase() === "turn") {
            result0 = input.substr(pos, 4);
            pos += 4;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"turn\"");
            }
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, scheme) {
                              data.scheme = scheme; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_turn_transport() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_transport();
        if (result0 !== null) {
          if (input.substr(pos, 3).toLowerCase() === "udp") {
            result1 = input.substr(pos, 3);
            pos += 3;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"udp\"");
            }
          }
          if (result1 === null) {
            if (input.substr(pos, 3).toLowerCase() === "tcp") {
              result1 = input.substr(pos, 3);
              pos += 3;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"tcp\"");
              }
            }
            if (result1 === null) {
              result1 = [];
              result2 = parse_unreserved();
              while (result2 !== null) {
                result1.push(result2);
                result2 = parse_unreserved();
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) {
                              data.transport = transport; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
       var data = {}; 
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
        return -1;
      }
      
      return data;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
