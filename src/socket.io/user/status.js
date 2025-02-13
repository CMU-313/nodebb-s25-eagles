'use strict';

const user = require('../../user');
const websockets = require('../index');
const meta = require('../../meta');

module.exports = function (SocketUser) {
	SocketUser.checkStatus = async function (socket, uid) {
		if (!socket.uid) {
			throw new Error('[[error:invalid-uid]]');
		}
		const userData = await user.getUserFields(uid, ['lastonline', 'status']);
		return user.getStatus(userData);
	};

	SocketUser.setStatus = async function (socket, status) {
		if (socket.uid <= 0) {
			throw new Error('[[error:invalid-uid]]');
		}

		let allowedStatus = ['online', 'offline', 'dnd', 'away', 'anonymous'];
		if (!meta.config.enableAnonymousPosting) {
			allowedStatus = ['online', 'offline', 'dnd', 'away'];
		}
		if (!allowedStatus.includes(status)) {
			throw new Error('[[error:invalid-user-status]]');
		}

		const userData = { status: status };
		if (status !== 'offline') {
			userData.lastonline = Date.now();
		}
		if (status === 'anonymous') {
			userData.anonymous = true;
		} else {
			userData.anonymous = false;
		}
		await user.setUserFields(socket.uid, userData);
		if (status !== 'offline') {
			await user.updateOnlineUsers(socket.uid);
		}
		const eventData = {
			uid: socket.uid,
			status: status,
		};
		websockets.server.emit('event:user_status_change', eventData);
		return eventData;
	};
};
