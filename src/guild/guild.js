// jshint esversion: 6

const async = require('async');
const bnet = require('../bnet');
const db = require('../database');
const user = require('../user');
const winston = require('winston');
const Groups = require('../groups'),


LOWEST_RANK = 9;
GUILD_GROUP_NAME = 'Snails';


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
                        // throw away all characters that not in guild
                        if (!((c.guildRealm + ':' + c.guild).toLowerCase() === process.env.BNET_GUILD.toLowerCase())) {
                            return false;
                        }
                        // check if character is really a member of a guild
                        // do not trust character props as it may not be updated
                        if (!guildMates[c.name]) {
                            winston.error(`No match for ${c.name} in guildMates\n ${JSON.stringify(c, null, 4)}`);
                            return false;
                        }
                        return true;
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

    Guild.getMembersNames = function(callback) {
        async.waterfall([
            async.apply(Guild.getMembersList),
            (guildMembers, next) => {
                return next(null, guildMembers.map((c) => {
                    return c.name;
                }));
            }
        ], callback);
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

    Guild.validateMembers = function(callback) {
        async.waterfall([
            async.apply(Groups.getMemberCount, GUILD_GROUP_NAME),
            (count, next) => {
                async.parallel({
                    'guildMembers': Guild.getMembersNames,
                    'guildGroupMembers': async.apply(Groups.getMemberUsers, [GUILD_GROUP_NAME], 0, count)
                }, next)
            },
            (data, next) => {
                const membersToKick = data.guildGroupMembers[0].filter((c) => data.guildMembers.indexOf(c.username) === -1);
                membersToKick.forEach((m) => {
                    winston.info(`Kicking ${m.username} from ${GUILD_GROUP_NAME}`);
                    return Groups.kick(m.uid, GUILD_GROUP_NAME, false, next);
                });
                next();
            }
        ], callback);
    };
})(module.exports);
