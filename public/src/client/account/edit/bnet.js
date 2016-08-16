'use strict';

/* globals define, ajaxify, socket, app, utils, config  */

define('forum/account/edit/bnet', ['forum/account/header'], function(header) {
	var AccountEditUsername = {};

	AccountEditUsername.init = function() {
		header.init();

		$('#submitBtn').on('click', function updateUsername() {
			var userData = {
				uid: $('#inputUID').val(),
				username: $('#inputNewUsername').val(),
				email: $('#inputNewEmail').val(),
				password: $('#inputCurrentPassword').val()
			};

			if (!userData.username || !userData.email) {
				return app.alertError('[[user:email_can_not_be_empty]]');
			}

			if (userData.username === userData.password) {
				return app.alertError('[[user:username_same_as_password]]');
			}

			var btn = $(this);
			btn.addClass('disabled').find('i').removeClass('hide');
			socket.emit('user.changeUsernameEmail', userData, function(err, data) {
				btn.removeClass('disabled').find('i').addClass('hide');
				if (err) {
					return app.alertError(err.message);
				}

				var userslug = utils.slugify(userData.username);
				if (userData.username && userslug && parseInt(userData.uid, 10) === parseInt(app.user.uid, 10)) {
					$('[component="header/profilelink"]').attr('href', config.relative_path + '/user/' + userslug);
                    $('[component="header/settingslink"').attr('href', config.relative_path + '/user/' + userslug + '/settings' );
                    $('[component="header/editlink"').attr('href', config.relative_path + '/user/' + userslug + '/edit');
					$('[component="header/username"]').text(userData.username);
					$('[component="header/usericon"]').css('background-color', data['icon:bgColor']).text(data['icon:text']);
				}

				ajaxify.go('user/' + userslug);
			});

			return false;
		});
	};

	return AccountEditUsername;
});
