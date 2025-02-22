/*

// see https://gist.github.com/jfromaniello/4087861#gistcomment-1447029


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const util = require('util');

const sleep = util.promisify(setTimeout);
const assert = require('assert');
const nconf = require('nconf');

const db = require('./mocks/databasemock');
const user = require('../src/user');
const groups = require('../src/groups');
const categories = require('../src/categories');
const helpers = require('./helpers');
const meta = require('../src/meta');
const events = require('../src/events');

const socketAdmin = require('../src/socket.io/admin');

describe('socket.io', () => {
	let io;
	let cid;
	let tid;
	let adminUid;
	let regularUid;

	before(async () => {
		const data = await Promise.all([
			user.create({ username: 'admin', password: 'adminpwd' }),
			user.create({ username: 'regular', password: 'regularpwd' }),
			categories.create({
				name: 'Test Category',
				description: 'Test category created by testing script',
			}),
		]);
		adminUid = data[0];
		await groups.join('administrators', data[0]);

		regularUid = data[1];
		await user.setUserField(regularUid, 'email', 'regular@test.com');
		await user.email.confirmByUid(regularUid);

		cid = data[2].cid;
	});


	it('should connect and auth properly', async () => {
		const { response, csrf_token } = await helpers.loginUser('admin', 'adminpwd');
		io = await helpers.connectSocketIO(response, csrf_token);
		assert(io);
		assert(io.emit);
	});

	new Promise((resolve, reject) => {
		io.emit('unknown.event', (err) => {
			try {
				assert(err);
				assert.equal(err.message, '[[error:invalid-event, unknown.event]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('user.gdpr.__proto__.constructor.toString', (err) => {
			try {
				assert(err);
				assert.equal(err.message, '[[error:invalid-event, user.gdpr.__proto__.constructor.toString]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('constructor.toString', (err) => {
			try {
				assert(err);
				assert.equal(err.message, '[[error:invalid-event, constructor.toString]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('admin.themes.getInstalled', (err, data) => {
			try {
				assert.ifError(err);
				assert(data);
				const themes = ['nodebb-theme-persona'];
				const installed = data.map(theme => theme.id);
				themes.forEach((theme) => {
					assert(installed.includes(theme));
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});


	it('should ban a user', async () => {
		const apiUser = require('../src/api/users');
		await apiUser.ban({ uid: adminUid }, { uid: regularUid, reason: 'spammer' });
		const data = await user.getLatestBanInfo(regularUid);
		assert(data.uid);
		assert(data.timestamp);
		assert(data.hasOwnProperty('banned_until'));
		assert(data.hasOwnProperty('banned_until_readable'));
		assert.equal(data.reason, 'spammer');
	});

	new Promise((resolve, reject) => {
		user.bans.getReason(regularUid, (err, reason) => {
			try {
				assert.ifError(err);
				assert.equal(reason, 'spammer');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	it('should unban a user', async () => {
		const apiUser = require('../src/api/users');
		await apiUser.unban({ uid: adminUid }, { uid: regularUid });
		const isBanned = await user.bans.isBanned(regularUid);
		assert(!isBanned);
	});

	new Promise((resolve, reject) => {
		socketAdmin.user.makeAdmins({ uid: adminUid }, [regularUid], (err) => {
			if (err) {
				return reject(err);
			}
			groups.isMember(regularUid, 'administrators', (err, isMember) => {
				if (err) {
					return reject(err);
				}
				try {
					assert(isMember);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.user.removeAdmins({ uid: adminUid }, [regularUid], (err) => {
			if (err) {
				return reject(err);
			}
			groups.isMember(regularUid, 'administrators', (err, isMember) => {
				if (err) {
					return reject(err);
				}
				try {
					assert(!isMember);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});


	describe('user create/delete', () => {
		let uid;
		const apiUsers = require('../src/api/users');
		it('should create a user', async () => {
			const userData = await apiUsers.create({ uid: adminUid }, { username: 'foo1' });
			uid = userData.uid;
			const isMember = await groups.isMember(userData.uid, 'registered-users');
			assert(isMember);
		});

		it('should delete users', async () => {
			await apiUsers.delete({ uid: adminUid }, { uid });
			await sleep(500);
			const isMember = await groups.isMember(uid, 'registered-users');
			assert(!isMember);
		});

		it('should error if user does not exist', async () => {
			let err;
			try {
				await apiUsers.deleteMany({ uid: adminUid }, { uids: [uid] });
			} catch (_err) {
				err = _err;
			}
			assert.strictEqual(err.message, '[[error:no-user]]');
		});

		it('should delete users and their content', async () => {
			const userData = await apiUsers.create({ uid: adminUid }, { username: 'foo2' });
			await apiUsers.deleteMany({ uid: adminUid }, { uids: [userData.uid] });
			await sleep(500);
			const isMember = await groups.isMember(userData.uid, 'registered-users');
			assert(!isMember);
		});

		it('should error with invalid data', async () => {
			let err;
			try {
				await apiUsers.create({ uid: adminUid }, null);
			} catch (_err) {
				err = _err;
			}
			assert.strictEqual(err.message, '[[error:invalid-data]]');
		});
	});

	it('should load user groups', async () => {
		const { users } = await socketAdmin.user.loadGroups({ uid: adminUid }, [adminUid]);
		assert.strictEqual(users[0].username, 'admin');
		assert(Array.isArray(users[0].groups));
	});

	new Promise((resolve, reject) => {
		socketAdmin.user.resetLockouts({ uid: adminUid }, [regularUid], (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	describe('validation emails', () => {
		const plugins = require('../src/plugins');

		async function dummyEmailerHook(data) {
			// pretend to handle sending emails
		}
		before(() => {
			// Attach an emailer hook so related requests do not error
			plugins.hooks.register('emailer-test', {
				hook: 'static:email.send',
				method: dummyEmailerHook,
			});
		});
		after(() => {
			plugins.hooks.unregister('emailer-test', 'static:email.send');
		});

		new Promise((resolve, reject) => {
			socketAdmin.user.validateEmail({ uid: adminUid }, [regularUid], (err) => {
				if (err) {
					return reject(err);
				}
				user.getUserField(regularUid, 'email:confirmed', (err, emailConfirmed) => {
					if (err) {
						return reject(err);
					}
					try {
						assert.equal(parseInt(emailConfirmed, 10), 1);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		});

		new Promise((resolve, reject) => {
			socketAdmin.user.sendValidationEmail({ uid: adminUid }, null, (err) => {
				try {
					assert.equal(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			socketAdmin.user.sendValidationEmail({ uid: adminUid }, [regularUid], (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});

	new Promise((resolve, reject) => {
		const socketMeta = require('../src/socket.io/meta');
		socketMeta.reconnected({ uid: 1 }, {}, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	new Promise((resolve, reject) => {
		io.emit('meta.rooms.enter', null, (err) => {
			try {
				assert.equal(err.message, '[[error:invalid-data]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		const socketMeta = require('../src/socket.io/meta');
		socketMeta.rooms.enter({ uid: 0 }, null, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	new Promise((resolve, reject) => {
		io.emit('meta.rooms.enter', { enter: 'recent_topics' }, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	new Promise((resolve, reject) => {
		io.emit('meta.rooms.leaveCurrent', {}, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	new Promise((resolve, reject) => {
		io.emit('admin.getServerTime', null, (err, time) => {
			if (err) {
				return reject(err);
			}
			try {
				assert(time);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('admin.analytics.get', null, (err) => {
			try {
				assert.equal(err.message, '[[error:invalid-data]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('admin.analytics.get', { graph: 'traffic', units: 'days' }, (err, data) => {
			if (err) {
				return reject(err);
			}
			try {
				assert(data);
				assert(data.summary);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('admin.analytics.get', { graph: 'traffic', units: 'hours' }, (err, data) => {
			if (err) {
				return reject(err);
			}
			try {
				assert(data);
				assert(data.summary);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('admin.analytics.get', { graph: 'traffic', units: 'days', amount: '7' }, (err, data) => {
			if (err) {
				return reject(err);
			}
			try {
				assert(data);
				assert(data.pageviews);
				assert(data.uniqueVisitors);
				assert.strictEqual(7, data.pageviews.length);
				assert.strictEqual(7, data.uniqueVisitors.length);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.before({ uid: 10 }, 'someMethod', {}, (err) => {
			try {
				assert.equal(err.message, '[[error:no-privileges]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.emit('meta.rooms.enter', { enter: 'topic_1' }, (err) => {
			if (err) {
				return reject(err);
			}
			socketAdmin.rooms.getAll({ uid: 10 }, {}, (err) => {
				if (err) {
					return reject(err);
				}
				setTimeout(() => {
					socketAdmin.rooms.getAll({ uid: 10 }, {}, (err, data) => {
						if (err) {
							return reject(err);
						}
						try {
							assert(data.hasOwnProperty('onlineGuestCount'));
							assert(data.hasOwnProperty('onlineRegisteredCount'));
							assert(data.hasOwnProperty('socketCount'));
							assert(data.hasOwnProperty('topTenTopics'));
							assert(data.hasOwnProperty('users'));
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				}, 1000);
			});
		});
	});


	new Promise((resolve, reject) => {
		io.emit('meta.rooms.enter', { enter: 'category_1' }, (err) => {
			if (err) {
				return reject(err);
			}

			socketAdmin.rooms.getAll({ uid: 10 }, {}, (err) => {
				if (err) {
					return reject(err);
				}

				setTimeout(() => {
					socketAdmin.rooms.getAll({ uid: 10 }, {}, (err, data) => {
						if (err) {
							return reject(err);
						}
						try {
							assert.equal(data.users.category, 1, JSON.stringify(data, null, 4));
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				}, 1000);
			});
		});
	});


	new Promise((resolve, reject) => {
		socketAdmin.getSearchDict({ uid: adminUid }, {}, (err, data) => {
			if (err) {
				return reject(err);
			}
			try {
				assert(Array.isArray(data));
				assert(data[0].namespace);
				assert(data[0].translations);
				assert(data[0].title);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		io.on('testEvent', (data) => {
			try {
				assert.equal(data.foo, 1);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		socketAdmin.fireEvent({ uid: adminUid }, { name: 'testEvent', payload: { foo: 1 } }, (err) => {
			if (err) {
				return reject(err);
			}
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.themes.set({ uid: adminUid }, null, (err) => {
			try {
				assert.equal(err.message, '[[error:invalid-data]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.themes.set({ uid: adminUid }, {
			type: 'bootswatch',
			src: '//maxcdn.bootstrapcdn.com/bootswatch/latest/darkly/bootstrap.min.css',
			id: 'darkly',
		}, (err) => {
			if (err) {
				return reject(err);
			}
			meta.configs.getFields(['theme:src', 'bootswatchSkin'], (err, fields) => {
				if (err) {
					return reject(err);
				}
				try {
					assert.equal(fields['theme:src'], '//maxcdn.bootstrapcdn.com/bootswatch/latest/darkly/bootstrap.min.css');
					assert.equal(fields.bootswatchSkin, 'darkly');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.themes.set({ uid: adminUid }, { type: 'local', id: 'nodebb-theme-persona' }, (err) => {
			if (err) {
				return reject(err);
			}
			meta.configs.get('theme:id', (err, id) => {
				if (err) {
					return reject(err);
				}
				try {
					assert.equal(id, 'nodebb-theme-persona');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.plugins.toggleActive({ uid: adminUid }, 'nodebb-plugin-location-to-map', (err, data) => {
			if (err) {
				return reject(err);
			}
			try {
				assert.deepEqual(data, { id: 'nodebb-plugin-location-to-map', active: true });
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	describe('install/upgrade plugin', () => {
		new Promise((resolve, reject) => {
			this.timeout(0);
			const oldValue = process.env.NODE_ENV;
			process.env.NODE_ENV = 'development';

			socketAdmin.plugins.toggleInstall(
				{ uid: adminUid },
				{ id: 'nodebb-plugin-location-to-map', version: 'latest' },
				(err, data) => {
					if (err) {
						process.env.NODE_ENV = oldValue;
						return reject(err);
					}
					try {
						assert.equal(data.name, 'nodebb-plugin-location-to-map');
						process.env.NODE_ENV = oldValue;
						resolve();
					} catch (error) {
						process.env.NODE_ENV = oldValue;
						reject(error);
					}
				}
			);
		});

		new Promise((resolve, reject) => {
			this.timeout(0);
			const oldValue = process.env.NODE_ENV;
			process.env.NODE_ENV = 'development';

			socketAdmin.plugins.upgrade(
				{ uid: adminUid },
				{ id: 'nodebb-plugin-location-to-map', version: 'latest' },
				(err) => {
					if (err) {
						process.env.NODE_ENV = oldValue;
						return reject(err);
					}
					process.env.NODE_ENV = oldValue;
					resolve();
				}
			);
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.plugins.getActive({ uid: adminUid }, {}, (err, data) => {
			if (err) {
				return reject(err);
			}
			try {
				assert(Array.isArray(data));
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		const data = [
			{ name: 'nodebb-theme-persona', order: 0 },
			{ name: 'nodebb-plugin-dbsearch', order: 1 },
			{ name: 'nodebb-plugin-markdown', order: 2 },
			{ ignoreme: 'wrong data' },
		];

		socketAdmin.plugins.orderActivePlugins({ uid: adminUid }, data, (err) => {
			if (err) {
				return reject(err);
			}

			db.sortedSetRank('plugins:active', 'nodebb-plugin-dbsearch', (err, rank) => {
				if (err) {
					return reject(err);
				}
				try {
					assert.equal(rank, 1);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.widgets.set({ uid: adminUid }, null, (err) => {
			try {
				assert.equal(err.message, '[[error:invalid-data]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		const data = [
			{
				template: 'global',
				location: 'sidebar',
				widgets: [{ widget: 'html', data: { html: 'test', title: 'test', container: '' } }],
			},
		];

		socketAdmin.widgets.set({ uid: adminUid }, data, (err) => {
			if (err) {
				return reject(err);
			}

			db.getObjectField('widgets:global', 'sidebar', (err, widgetData) => {
				if (err) {
					return reject(err);
				}

				try {
					assert.equal(JSON.parse(widgetData)[0].data.html, 'test');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	it('should clear sitemap cache', async () => {
		await socketAdmin.settings.clearSitemapCache({ uid: adminUid }, {});
	});

	it('should send test email', async () => {
		const tpls = ['digest', 'banned', 'verify', 'welcome', 'notification', 'invitation'];
		try {
			for (const tpl of tpls) {
				// eslint-disable-next-line no-await-in-loop
				await socketAdmin.email.test({ uid: adminUid }, { template: tpl });
			}
		} catch (err) {
			if (err.message !== '[[error:sendmail-not-found]]') {
				assert.ifError(err);
			}
		}
	});

	it('should not error when resending digests', async () => {
		await socketAdmin.digest.resend({ uid: adminUid }, { action: 'resend-day', uid: adminUid });
		await socketAdmin.digest.resend({ uid: adminUid }, { action: 'resend-day' });
	});

	it('should error with invalid interval', async () => {
		const oldValue = meta.config.dailyDigestFreq;
		meta.config.dailyDigestFreq = 'off';
		try {
			await socketAdmin.digest.resend({ uid: adminUid }, { action: 'resend-' });
		} catch (err) {
			assert.strictEqual(err.message, '[[error:digest-not-enabled]]');
		}
		meta.config.dailyDigestFreq = oldValue;
	});

	new Promise((resolve, reject) => {
		const fs = require('fs');
		const path = require('path');
		meta.logs.path = path.join(nconf.get('base_dir'), 'test/files', 'output.log');

		fs.appendFile(meta.logs.path, 'some logs', (err) => {
			if (err) {
				return reject(err);
			}

			socketAdmin.logs.get({ uid: adminUid }, {}, (err, data) => {
				if (err) {
					return reject(err);
				}

				try {
					assert(data);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.logs.clear({ uid: adminUid }, {}, (err) => {
			if (err) {
				return reject(err);
			}

			socketAdmin.logs.get({ uid: adminUid }, {}, (err, data) => {
				if (err) {
					return reject(err);
				}

				try {
					assert.equal(data.length, 0);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		socketAdmin.errors.clear({ uid: adminUid }, {}, (err) => {
			if (err) {
				return reject(err);
			}

			db.exists('error:404', (err, exists) => {
				if (err) {
					return reject(err);
				}

				try {
					assert(!exists);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	new Promise((resolve, reject) => {
		db.getSortedSetRevRange('events:time', 0, 0, (err, eids) => {
			if (err) {
				return reject(err);
			}

			events.deleteEvents(eids, (err) => {
				if (err) {
					return reject(err);
				}

				db.isSortedSetMembers('events:time', eids, (err, isMembers) => {
					if (err) {
						return reject(err);
					}

					try {
						assert(!isMembers.includes(true));
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		});
	});

	new Promise((resolve, reject) => {
		events.deleteAll((err) => {
			if (err) {
				return reject(err);
			}

			db.sortedSetCard('events:time', (err, count) => {
				if (err) {
					return reject(err);
				}

				try {
					assert.equal(count, 0);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});


	describe('logger', () => {
		const logger = require('../src/logger');
		const index = require('../src/socket.io');
		const fs = require('fs');
		const path = require('path');

		new Promise((resolve, reject) => {
			meta.config.loggerStatus = 1;
			meta.config.loggerIOStatus = 1;
			const loggerPath = path.join(__dirname, '..', 'logs', 'logger.log');
			logger.monitorConfig({ io: index.server }, { key: 'loggerPath', value: loggerPath });

			setTimeout(() => {
				io.emit('meta.rooms.enter', { enter: 'recent_topics' }, (err) => {
					if (err) {
						return reject(err);
					}

					fs.readFile(loggerPath, 'utf-8', (err, content) => {
						if (err) {
							return reject(err);
						}

						try {
							assert(content);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				});
			}, 500);
		});

		new Promise((resolve) => {
			meta.config.loggerStatus = 0;
			meta.config.loggerIOStatus = 0;
			resolve();
		});
	});

	describe('password reset', () => {
		const socketUser = require('../src/socket.io/user');

		new Promise((resolve, reject) => {
			socketAdmin.user.sendPasswordResetEmail({ uid: adminUid }, null, (err) => {
				try {
					assert.strictEqual(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			socketAdmin.user.sendPasswordResetEmail({ uid: adminUid }, [adminUid], (err) => {
				try {
					assert.strictEqual(err.message, '[[error:user-doesnt-have-email, admin]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});


		it('should send password reset email', async () => {
			await user.setUserField(adminUid, 'email', 'admin_test@nodebb.org');
			await user.email.confirmByUid(adminUid);
			await socketAdmin.user.sendPasswordResetEmail({ uid: adminUid }, [adminUid]);
		});

		new Promise((resolve, reject) => {
			socketAdmin.user.forcePasswordReset({ uid: adminUid }, null, (err) => {
				try {
					assert.strictEqual(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});


		it('should for password reset', async () => {
			const then = Date.now();
			const uid = await user.create({ username: 'forceme', password: '123345' });
			await socketAdmin.user.forcePasswordReset({ uid: adminUid }, [uid]);
			const pwExpiry = await user.getUserField(uid, 'passwordExpiry');
			const sleep = util.promisify(setTimeout);
			await sleep(500);
			assert(pwExpiry > then && pwExpiry < Date.now());
		});

		it('should not error on valid email', async () => {
			await socketUser.reset.send({ uid: 0 }, 'regular@test.com');
			const [count, eventsData] = await Promise.all([
				db.sortedSetCount('reset:issueDate', 0, Date.now()),
				events.getEvents({ filter: '', start: 0, stop: 0 }),
			]);
			assert.strictEqual(count, 2);

			// Event validity
			assert.strictEqual(eventsData.length, 1);
			const event = eventsData[0];
			assert.strictEqual(event.type, 'password-reset');
			assert.strictEqual(event.text, '[[success:success]]');
		});

		it('should not generate code if rate limited', async () => {
			await assert.rejects(
				socketUser.reset.send({ uid: 0 }, 'regular@test.com'),
				{ message: '[[error:reset-rate-limited]]' },
			);
			const [count, eventsData] = await Promise.all([
				db.sortedSetCount('reset:issueDate', 0, Date.now()),
				events.getEvents({ filter: '', start: 0, stop: 0 }),
			]);
			assert.strictEqual(count, 2);

			// Event validity
			assert.strictEqual(eventsData.length, 1);
			const event = eventsData[0];
			assert.strictEqual(event.type, 'password-reset');
			assert.strictEqual(event.text, '[[error:reset-rate-limited]]');
		});

		it('should not error on invalid email (but not generate reset code)', async () => {
			await socketUser.reset.send({ uid: 0 }, 'irregular@test.com');
			const count = await db.sortedSetCount('reset:issueDate', 0, Date.now());
			assert.strictEqual(count, 2);
		});

		new Promise((resolve, reject) => {
			socketUser.reset.send({ uid: 0 }, '', (err) => {
				try {
					assert(err instanceof Error);
					assert.strictEqual(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	it('should clear caches', async () => {
		await socketAdmin.cache.clear({ uid: adminUid }, { name: 'post' });
		await socketAdmin.cache.clear({ uid: adminUid }, { name: 'object' });
		await socketAdmin.cache.clear({ uid: adminUid }, { name: 'group' });
		await socketAdmin.cache.clear({ uid: adminUid }, { name: 'local' });
	});

	it('should toggle caches', async () => {
		const caches = {
			post: require('../src/posts/cache').getOrCreate(),
			object: require('../src/database').objectCache,
			group: require('../src/groups').cache,
			local: require('../src/cache'),
		};

		await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'post', enabled: !caches.post.enabled });
		if (caches.object) {
			await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'object', enabled: !caches.object.enabled });
		}
		await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'group', enabled: !caches.group.enabled });
		await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'local', enabled: !caches.local.enabled });

		// call again to return back to original state
		await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'post', enabled: !caches.post.enabled });
		if (caches.object) {
			await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'object', enabled: !caches.object.enabled });
		}
		await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'group', enabled: !caches.group.enabled });
		await socketAdmin.cache.toggle({ uid: adminUid }, { name: 'local', enabled: !caches.local.enabled });
	});
});*/
