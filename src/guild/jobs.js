// jshint esversion: 6
'use strict';

var winston = require('winston');
var	cronJob = require('cron').CronJob;

module.exports = function(Guild) {
	Guild.startJobs = function() {
        // Get current roster from bnet API
		new cronJob('0 18,58 * * * *', function() {
			winston.info('[guild.startJobs] Guild info update job (half hourly) started.');
			Guild.updateInfo((err) => {
                if (err) {
                    winston.error('[guild.startJobs] Guild info update job (half hourly) failed: ' + err);
                } else {
                    winston.info('[guild.startJobs] Guild info update job (half hourly) success');
                }
            });
		}, null, true);

        // Validate if members of the guild forum group are viable
        new cronJob('0 15,45 * * * *', function() {
			winston.info('[guild.startJobs] Guild members validation job (half hourly) started.');
			Guild.validateMembers((err) => {
                if (err) {
                    winston.error('[guild.startJobs] Guild members validation job (half hourly) failed: ' + err);
                } else {
                    winston.info('[guild.startJobs] Guild members validation job (half hourly) success');
                }
            });
		}, null, true);
	};
};
