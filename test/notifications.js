'use strict';


const assert = require('assert');
const nconf = require('nconf');
const util = require('util');

const db = require('./mocks/databasemock');
const meta = require('../src/meta');
const user = require('../src/user');
const topics = require('../src/topics');
const categories = require('../src/categories');
const notifications = require('../src/notifications');
const socketNotifications = require('../src/socket.io/notifications');

const sleep = util.promisify(setTimeout);

describe('Notifications', () => {
	let uid;
	let notification;

	before((done) => {
		user.create({ username: 'poster' }, (err, _uid) => {
			if (err) {
				return done(err);
			}

			uid = _uid;
			done();
		});
	});

	it('should not mark anything with invalid_uid or nid', () => new Promise((resolve, reject) => {
		socketNotifications.markUnread({ uid: null }, null, (err) => {
			if (err) return reject(err);

			socketNotifications.markUnread({ uid: uid }, null, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});
	}));

	it('should error if notification does not exist', () => new Promise((resolve, reject) => {
		socketNotifications.markUnread({ uid: uid }, 123123, (err) => {
			try {
				assert.equal(err.message, '[[error:no-notification]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}));

	it('should mark a notification unread', () => new Promise((resolve, reject) => {
		socketNotifications.markUnread({ uid: uid }, notification.nid, (err) => {
			if (err) return reject(err);

			db.isSortedSetMember(`uid:${uid}:notifications:unread`, notification.nid, (err, isMember) => {
				if (err) return reject(err);
				try {
					assert.equal(isMember, true);
				} catch (error) {
					return reject(error);
				}

				db.isSortedSetMember(`uid:${uid}:notifications:read`, notification.nid, (err, isMember) => {
					if (err) return reject(err);
					try {
						assert.equal(isMember, false);
					} catch (error) {
						return reject(error);
					}

					socketNotifications.getCount({ uid: uid }, null, (err, count) => {
						if (err) return reject(err);
						try {
							assert.equal(count, 1);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				});
			});
		});
	}));

	it('should mark all notifications read', () => new Promise((resolve, reject) => {
		socketNotifications.markAllRead({ uid: uid }, null, (err) => {
			if (err) return reject(err);

			db.isSortedSetMember(`uid:${uid}:notifications:unread`, notification.nid, (err, isMember) => {
				if (err) return reject(err);
				try {
					assert.equal(isMember, false);
				} catch (error) {
					return reject(error);
				}

				db.isSortedSetMember(`uid:${uid}:notifications:read`, notification.nid, (err, isMember) => {
					if (err) return reject(err);
					try {
						assert.equal(isMember, true);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		});
	}));

	it('should not do anything', () => new Promise((resolve, reject) => {
		socketNotifications.markAllRead({ uid: 1000 }, null, (err) => {
			if (err) return reject(err);
			resolve();
		});
	}));


	it('should not mark anything with an invalid_uid or nid', () => new Promise((resolve, reject) => {
		socketNotifications.markUnread({ uid: null }, null, (err) => {
			if (err) return reject(err);

			socketNotifications.markUnread({ uid: uid }, null, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});
	}));

	it('should error if notification is nonexistent', () => new Promise((resolve, reject) => {
		socketNotifications.markUnread({ uid: uid }, 123123, (err) => {
			try {
				assert.equal(err.message, '[[error:no-notification]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}));

	it('should mark a notification_unread', () => new Promise((resolve, reject) => {
		socketNotifications.markUnread({ uid: uid }, notification.nid, (err) => {
			if (err) return reject(err);

			db.isSortedSetMember(`uid:${uid}:notifications:unread`, notification.nid, (err, isMember) => {
				if (err) return reject(err);
				try {
					assert.equal(isMember, true);
				} catch (error) {
					return reject(error);
				}

				db.isSortedSetMember(`uid:${uid}:notifications:read`, notification.nid, (err, isMember) => {
					if (err) return reject(err);
					try {
						assert.equal(isMember, false);
					} catch (error) {
						return reject(error);
					}

					socketNotifications.getCount({ uid: uid }, null, (err, count) => {
						if (err) return reject(err);
						try {
							assert.equal(count, 1);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				});
			});
		});
	}));

	it('should mark all notifications as read', () => new Promise((resolve, reject) => {
		socketNotifications.markAllRead({ uid: uid }, null, (err) => {
			if (err) return reject(err);

			db.isSortedSetMember(`uid:${uid}:notifications:unread`, notification.nid, (err, isMember) => {
				if (err) return reject(err);
				try {
					assert.equal(isMember, false);
				} catch (error) {
					return reject(error);
				}

				db.isSortedSetMember(`uid:${uid}:notifications:read`, notification.nid, (err, isMember) => {
					if (err) return reject(err);
					try {
						assert.equal(isMember, true);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		});
	}));

	it('should not do_anything', () => new Promise((resolve, reject) => {
		socketNotifications.markAllRead({ uid: 1000 }, null, (err) => {
			if (err) return reject(err);
			resolve();
		});
	}));


	it('should link to the first unread post in a watched topic', async () => {
		const watcherUid = await user.create({ username: 'watcher' });
		const { cid } = await categories.create({
			name: 'Test Category',
			description: 'Test category created by testing script',
		});

		const { topicData } = await topics.post({
			uid: watcherUid,
			cid: cid,
			title: 'Test Topic Title',
			content: 'The content of test topic',
		});
		const { tid } = topicData;

		await topics.follow(tid, watcherUid);

		const { pid } = await topics.reply({
			uid: uid,
			content: 'This is the first reply.',
			tid: tid,
		});

		await topics.reply({
			uid: uid,
			content: 'This is the second reply.',
			tid: tid,
		});
		// notifications are sent asynchronously with a 1 second delay.
		await sleep(3000);
		const notifications = await user.notifications.get(watcherUid);
		assert.equal(notifications.unread.length, 1, 'there should be 1 unread notification');
		assert.equal(`${nconf.get('relative_path')}/post/${pid}`, notifications.unread[0].path, 'the notification should link to the first unread post');
	});

	new Promise((resolve, reject) => {
		socketNotifications.get({ uid: uid }, { nids: [notification.nid] }, (err, data) => {
			if (err) return reject(err);
			try {
				assert.equal(data[0].bodyShort, 'bodyShort');
				assert.equal(data[0].nid, 'notification_id');
				assert.equal(data[0].path, `${nconf.get('relative_path')}/notification/path`);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		socketNotifications.get({ uid: uid }, {}, (err, data) => {
			if (err) return reject(err);
			try {
				assert.equal(data.unread.length, 0);
				assert.equal(data.read[0].nid, 'notification_id');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		socketNotifications.deleteAll({ uid: 0 }, null, (err) => {
			if (err) {
				try {
					assert.equal(err.message, '[[error:no-privileges]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			} else {
				reject(new Error('Expected an error but none occurred'));
			}
		});
	}).catch(err => assert.ifError(err));


	new Promise((resolve, reject) => {
		socketNotifications.deleteAll({ uid: 0 }, null, (err) => {
			if (err) return reject(err);
			try {
				assert.equal(err.message, '[[error:no-privileges]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		socketNotifications.deleteAll({ uid: uid }, null, (err) => {
			if (err) return reject(err);
			socketNotifications.get({ uid: uid }, {}, (err, data) => {
				if (err) return reject(err);
				try {
					assert.equal(data.unread.length, 0);
					assert.equal(data.read.length, 0);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		user.notifications.get(0, (err, data) => {
			if (err) return reject(err);
			try {
				assert.equal(data.read.length, 0);
				assert.equal(data.unread.length, 0);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		const nid = 'willbefiltered';
		notifications.create({
			bodyShort: 'bodyShort',
			nid: nid,
			path: '/notification/path',
			type: 'post',
		}, (err, notification) => {
			if (err) return reject(err);
			notifications.push(notification, [uid], (err) => {
				if (err) return reject(err);
				setTimeout(() => {
					user.notifications.getAll(uid, 'post', (err, nids) => {
						if (err) return reject(err);
						try {
							assert(nids.includes(nid));
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				}, 3000);
			});
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		user.notifications.getNotifications(['doesnotexistnid1', 'doesnotexistnid2'], uid, (err, data) => {
			if (err) return reject(err);
			try {
				assert.deepEqual(data, []);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		user.notifications.getUnreadInterval(uid, '2 aeons', (err, data) => {
			if (err) return reject(err);
			try {
				assert.deepEqual(data, []);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		user.notifications.getUnreadCount(0, (err, count) => {
			if (err) return reject(err);
			try {
				assert.equal(count, 0);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		user.notifications.deleteAll(0, (err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	it('should send notification to followers of user when he posts', async () => {
		const followerUid = await user.create({ username: 'follower' });
		await user.follow(followerUid, uid);
		const { cid } = await categories.create({
			name: 'Test Category',
			description: 'Test category created by testing script',
		});
		await topics.post({
			uid: uid,
			cid: cid,
			title: 'Test Topic Title',
			content: 'The content of test topic',
		});
		await sleep(1100);
		const data = await user.notifications.getAll(followerUid, '');
		assert(data);
	});

	it('should send welcome notification', async () => {
		meta.config.welcomeNotification = 'welcome to the forums';
		await new Promise((resolve, reject) => {
			user.notifications.sendWelcomeNotification(uid, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});
		await new Promise((resolve, reject) => {
			user.notifications.sendWelcomeNotification(uid, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});
		await new Promise((resolve) => { setTimeout(resolve, 2000); });
		const data = await new Promise((resolve, reject) => {
			user.notifications.getAll(uid, '', (err, data) => {
				meta.config.welcomeNotification = '';
				if (err) return reject(err);
				resolve(data);
			});
		});
		assert(data.includes(`welcome_${uid}`), data);
	});

	it('should prune notifications', async () => {
		const notification = await new Promise((resolve, reject) => {
			notifications.create({
				bodyShort: 'bodyShort',
				nid: 'tobedeleted',
				path: '/notification/path',
			}, (err, notification) => {
				if (err) return reject(err);
				resolve(notification);
			});
		});

		await new Promise((resolve, reject) => {
			notifications.prune((err) => {
				if (err) return reject(err);
				resolve();
			});
		});

		const month = 2592000000;
		await new Promise((resolve, reject) => {
			db.sortedSetAdd('notifications', Date.now() - (2 * month), notification.nid, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});

		await new Promise((resolve, reject) => {
			notifications.prune((err) => {
				if (err) return reject(err);
				resolve();
			});
		});

		const data = await new Promise((resolve, reject) => {
			notifications.get(notification.nid, (err, data) => {
				if (err) return reject(err);
				resolve(data);
			});
		});

		assert(!data);
	});
});
