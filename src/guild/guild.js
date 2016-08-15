// jshint esversion: 6

const async = require('async');
const bnet = require('../bnet');
const db = require('../database');


(function(Guild) {
    'use strict';

    require('./jobs')(Guild);

    Guild.getMembersList = function(callback) {
        db.getObjectField('guild', 'members', callback);
    };

    Guild.setMembersList = function(members, callback) {
        db.setObjectField('guild', 'members', members, callback);
    };

    Guild.updateInfo = function(callback) {
        async.waterfall([
            (next) => {
                bnet.getGuildInfo(next);
            },
            (guildData, next) => {
                Guild.setMembersList(guildData.members, next);
            }
        ], callback);
    };

})(module.exports);
