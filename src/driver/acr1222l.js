"use strict";
exports.__esModule = true;
var pcsc = require("pcsclite");
var rxjs_1 = require("rxjs");
var DriverMessage_1 = require("./DriverMessage");
var Acr1222l = (function () {
    function Acr1222l(logger) {
        var _this = this;
        this.logger = logger;
        this.subject = new rxjs_1.Subject();
        this.readerName = "TODO";
        this.pcsc = pcsc();
        if (this.logger == null) {
            this.logger = {
                error: function (e) { return console.error(e); },
                log: function (s) { return console.log(s); }
            };
        }
        this.pcsc.on('reader', function (reader) {
            _this.logger.log("New reader detected " + reader.name);
            if (reader.name !== _this.readerName) {
                _this.logger.log(reader.name + " doesn't match defined name " + _this.readerName + ", ignoring");
                return;
            }
            _this.reader = reader;
            reader.on('error', function (err) { return _this.onError(err); });
            reader.on('status', function (status) { return _this.onStatus(status); });
            reader.on('end', function () { return _this.onEnd(); });
        });
        this.pcsc.on('error', function (err) { return _this.onError(err); });
    }
    Acr1222l.prototype.onStatus = function (status) {
        var _this = this;
        this.logger.log("Status ('" + this.readerName + "'): , " + status);
        /* check what has changed */
        var changes = this.pcsc.state ^ status.state;
        if (changes) {
            if ((changes & this.pcsc.SCARD_STATE_EMPTY) && (status.state & this.pcsc.SCARD_STATE_EMPTY)) {
                this.logger.log('card removed');
                this.subject.next(new DriverMessage_1.DriverMessage("TAG_REMOVED", {}));
                this.disconnectCard();
            }
            else if ((changes & this.pcsc.SCARD_STATE_PRESENT) && (status.state & this.pcsc.SCARD_STATE_PRESENT)) {
                console.log('card inserted'); /* card inserted */
                this.subject.next(new DriverMessage_1.DriverMessage("TAG_INSERTED", {}));
                this.reader.connect({ share_mode: this.pcsc.SCARD_SHARE_SHARED }, function (err, protocol) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('Protocol(', _this.reader.name, '):', protocol);
                        _this.readUid(err, protocol);
                    }
                });
            }
        }
    };
    Acr1222l.prototype.readUid = function (err, protocol) {
        var _this = this;
        this.reader.transmit(new Buffer([0xFF, 0xCA, 0x00, 0x00, 0x00]), 20, protocol, function (err, data) {
            if (err) {
                _this.logger.error("ERROR reading UID: " + err);
            }
            else {
                _this.logger.error("UID: " + data.toJSON());
                var uid = '';
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var value = data_1[_i];
                    uid += '|' + value;
                }
                _this.subject.next(new DriverMessage_1.DriverMessage('TAG_UID', uid));
            }
        });
    };
    Acr1222l.prototype.disconnectCard = function () {
        var _this = this;
        this.reader.disconnect(this.pcsc.SCARD_LEAVE_CARD, function (err) {
            if (err) {
                _this.logger.error(err);
            }
            else {
                _this.logger.log('disconnected card');
            }
        });
    };
    Acr1222l.prototype.onEnd = function () {
        this.subject.error('reader removed');
        this.logger.log("Reader " + this.readerName + " removed");
    };
    Acr1222l.prototype.onError = function (err) {
        this.logger.error("reader/pcsc error: " + err.message);
    };
    Acr1222l.prototype.listen = function () {
        return this.subject;
    };
    return Acr1222l;
}());
exports.Acr1222l = Acr1222l;
