// jshint esversion: 6

const async = require('async');
const bnet = require('../bnet');
const db = require('../database');
const user = require('../user');
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
                var guildMates = {};
                guildMembers.forEach((m) => guildMates[m.name] = {rank: m.rank, class: m.class, race: m.race});

        		if (characters) {
        		    var data = characters.filter((c) => {
                        return (c.guildRealm + ':' + c.guild).toLowerCase() === process.env.BNET_GUILD.toLowerCase();
                    }).sort((a, b) => {
            		    return a.level > b.level ? -1 : 1;
            		}).map((c) => {
                        c.rank = guildMates[c.name].rank;
                        c.race = guildMates[c.name].race;
                        c.class = guildMates[c.name].class;
                        return c;
                    }).sort((a, b) => {
                        return a.rank > b.rank ? 1 : -1;
                    });

                    if (data[0]) {
                        data[0].isMain = true;
                    }

                    var availableNicknames = data.map(c => c.name);

                    next(null, data, availableNicknames);
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

    Guild.setMainCharacter = function(uid, charName, callback) {
        user.getUserField(uid, 'bnetData', (err, bnetData) => {
            bnetData.characters.forEach(c => {
                if (c.name === charName) {
                    c.isMain = true;
                } else {
                    delete c.isMain;
                }
            });
            user.setUserField(uid, 'bnetData', bnetData, callback);
        });
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
