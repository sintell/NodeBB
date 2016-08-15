// jshint esversion: 6

const async = require('async');
const bnet = require('../bnet');
const db = require('../database');
const winston = require('winston');


(function(Guild) {
    'use strict';

    require('./jobs')(Guild);

    Guild.composeUserCharacters = function(characters, callback) {
        if (!characters) {
            callback(null, []);
        }

        async.waterfall([
            async.apply(db.getObjectField, 'guild', 'members'),
            (guildMembers, next) => {
                var charRanks = {};
                guildMembers.forEach((m) => {charRanks[m.name] = m.rank;});

        		if (characters) {

        		    var data = characters.filter((c) => {
                        return (c.guildRealm + ':' + c.guild).toLowerCase() === process.env.BNET_GUILD.toLowerCase();
                    }).sort((a, b) => {
            		    return a.level > b.level ? -1 : 1;
            		}).map((c) => {
                        c.rank = charRanks[c.name];
                        return c;
                    }).sort((a, b) => {
                        return a.rank > b.rank ? 1 : -1;
                    });

                    if (data[0]) {
                        data[0].isMain = true;
                    }

                    next(null, data);
        		}
            }
        ], callback);
    };

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
