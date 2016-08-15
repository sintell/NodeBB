// jshint esversion: 6
'use strict';

const get = require('https').get;
const winston = require('winston');
const async = require('async');

function composeBnetRequest(endpoint, fields) {
    const region = process.env.BNET_LOCATION;
    const key = process.env.BNET_ID;
    const secret = process.env.BNET_SECRET;
    const [realm, guildName] = process.env.BNET_GUILD.split(':');
    const locale = process.env.BNET_LOCALE;

    switch(endpoint) {
        case 'guild': {
            return `https://${region}.api.battle.net/wow/guild/${encodeURIComponent(realm)}/${encodeURIComponent(guildName)}` +
                            `?locale=${locale}&fields=${encodeURIComponent(fields.join(','))}&apikey=${key}`;
        }

        case 'classes': {
            return `https://${region}.api.battle.net/wow/data/character/classes?locale=${locale}&apikey=${key}`;
        }
        case 'races': {
            return `https://${region}.api.battle.net/wow/data/character/races?locale=${locale}&apikey=${key}`;
        }
    }

}

(function(Bnet) {
    Bnet.getGuildInfo = function(callback) {
        async.waterfall([
            Bnet.getResourcesData,
            (resources) => {
                get(composeBnetRequest('guild',['members']), (res) => {
                    var data = new Buffer.alloc(0);
                    res.on('data', (chunk) => {
                        data = Buffer.concat([data, chunk], data.length + chunk.length);
                    }).on('end', () => {
                        var guildInfo;
                        var response = {};

                        try {
                            guildInfo = JSON.parse(data.toString('utf-8'));

                        } catch(err) {
                            winston.error(err);
                            return callback(err);
                        }
                        response.members = guildInfo.members.map((m) => {
                            return {name: m.character.name,
                                class: {id: m.class, name: resources.classes[m.character.class]},
                                race: {id: m.race, name: resources.races[m.character.race]},
                                gender: m.character.gender,
                                level: m.character.level,
                                rank: m.rank};
                        });

                            response.lastModified = guildInfo.lastModified;
                            callback(null, response);
                    }).on('error', (err) => {
                        winston.error(err);
                        callback(err);
                    });
                });
            }
        ]);
    };

    Bnet.getResourcesData = function(callback) {
        async.parallel({
            'races': (next) => {
                get(composeBnetRequest('races', []), (res) => {
                    var data = new Buffer.alloc(0);
                    res.on('data', (chunk) => {
                        data = Buffer.concat([data, chunk], data.length + chunk.length);
                    }).on('end', () => {
                        var response = {};
                        try {
                            JSON.parse(data.toString('utf-8')).races.forEach((r) => {response[r.id] = r.name;});
                        } catch(err) {
                            winston.error(err);
                            return next(err);
                        }

                        next(null, response);
                    }).on('error', (err) => {
                        winston.error(err);
                        next(err);
                    });
                });
            },
            'classes': (next) => {
                get(composeBnetRequest('classes', []), (res) => {
                    var data = new Buffer.alloc(0);
                    res.on('data', (chunk) => {
                        data = Buffer.concat([data, chunk], data.length + chunk.length);
                    }).on('end', () => {
                        var response = {};
                        try {
                            JSON.parse(data.toString('utf-8')).classes.forEach((c) => {response[c.id] = c.name;});
                        } catch(err) {
                            winston.error(err);
                            return next(err);
                        }

                        next(null, response);
                    }).on('error', (err) => {
                        winston.error(err);
                        next(err);
                    });
                });
            }
        }, (err, results) => callback(err, results));
    };
})(exports);
