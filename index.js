var dgram = require('dgram')
  , util = require('util')
  , events = require('events');


function Forwarder(options) {
  options = options || {};
  this.options = {};
  this.options.gw_addr = options.gw_addr || 'localhost';
  this.options.gw_port = options.gw_port || 1884;

  this._connections = {};

  events.EventEmitter.call(this);
}
util.inherits(Forwarder, events.EventEmitter);

Forwarder.prototype.close = function(id) {
  if(id) {
    if(this._connections.hasOwnProperty(id))
      this._connections[id].close();
  } else {
    for(c in this._connections)
      if(this._connections.hasOwnProperty(c))
        this._connections[c].close();
  }
};
Forwarder.prototype.send = function(id, msg, callback) {
  var connection;
  if(this._connections.hasOwnProperty(id)) {
    connection = this._connections[id];
  } else {
    //create new connection
    connection = dgram.createSocket('udp4');
    connection.on('error', function(err) {
      this.emit('error', id, err);
      connection.close();  
    }.bind(this));
    connection.on('close', function() {
      this.emit('close', id);
      delete this._connections[id];
    }.bind(this));
    connection.on('message', function(msg, rinfo) {
      this.emit('message', id, msg);
    }.bind(this));
    connection.bind();
    this._connections[id] = connection;
  }

  connection.send(msg, 0, msg.length, 
    this.options.gw_port, this.options.gw_addr, callback);
};

module.exports = Forwarder;

