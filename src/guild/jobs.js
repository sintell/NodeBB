// jshint esversion: 6
'use strict';

var winston = require('winston');
var	cronJob = require('cron').CronJob;

module.exports = function(Guild) {
	Guild.startJobs = function() {
		new cronJob('0 28,58 * * * *', function() {
			winston.info('[guild.startJobs] Guild info update job (half hourly) started.');
			Guild.updateInfo((err) => {
                if (err) {
                    winston.error('[guild.startJobs] Guild info update job (half hourly) failed: ' + err);
                } else {
                    winston.info('[guild.startJobs] Guild info update job (half hourly) success');
                }
            });
		}, null, true);
	};
};
