

const assert = require('assert');
const async = require('async');

const nconf = require('nconf');

const db = require('./mocks/databasemock');
const meta = require('../src/meta');
const User = require('../src/user');
const Groups = require('../src/groups');
const request = require('../src/request');

describe('meta', () => {
	let fooUid;
	let bazUid;
	let herpUid;

	before((done) => {
		Groups.cache.reset();
		// Create 3 users: 1 admin, 2 regular
		async.series([
			async.apply(User.create, { username: 'foo', password: 'barbar' }), // admin
			async.apply(User.create, { username: 'baz', password: 'quuxquux' }), // restricted user
			async.apply(User.create, { username: 'herp', password: 'derpderp' }), // regular user
		], (err, uids) => {
			if (err) {
				return done(err);
			}

			fooUid = uids[0];
			bazUid = uids[1];
			herpUid = uids[2];

			Groups.join('administrators', fooUid, done);
		});
	});

	describe('settings', () => {
		const socketAdmin = require('../src/socket.io/admin');
		it('should set setting', () => new Promise((resolve, reject) => {
			socketAdmin.settings.set(
				{ uid: fooUid },
				{ hash: 'some:hash', values: { foo: '1', derp: 'value' } },
				(err) => {
					if (err) return reject(err);
					db.getObject('settings:some:hash', (err, data) => {
						if (err) return reject(err);
						try {
							assert.equal(data.foo, '1');
							assert.equal(data.derp, 'value');
							resolve();
						} catch (assertionError) {
							reject(assertionError);
						}
					});
				}
			);
		}));

		it('should get setting', () => new Promise((resolve, reject) => {
			socketAdmin.settings.get({ uid: fooUid }, { hash: 'some:hash' }, (err, data) => {
				if (err) return reject(err);
				try {
					assert.equal(data.foo, '1');
					assert.equal(data.derp, 'value');
					resolve();
				} catch (assertionError) {
					reject(assertionError);
				}
			});
		}));

		it('should not set setting if not empty', () => new Promise((resolve, reject) => {
			meta.settings.setOnEmpty('some:hash', { foo: 2 }, (err) => {
				if (err) return reject(err);
				db.getObject('settings:some:hash', (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.foo, '1');
						assert.equal(data.derp, 'value');
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				});
			});
		}));

		it('should set setting if empty', () => new Promise((resolve, reject) => {
			meta.settings.setOnEmpty('some:hash', { empty: '2' }, (err) => {
				if (err) return reject(err);
				db.getObject('settings:some:hash', (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.foo, '1');
						assert.equal(data.derp, 'value');
						assert.equal(data.empty, '2');
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				});
			});
		}));

		it('should set one and get one', () => new Promise((resolve, reject) => {
			meta.settings.setOne('some:hash', 'myField', 'myValue', (err) => {
				if (err) return reject(err);
				meta.settings.getOne('some:hash', 'myField', (err, myValue) => {
					if (err) return reject(err);
					try {
						assert.equal(myValue, 'myValue');
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				});
			});
		}));


		it('should return null if setting field does not exist', async () => {
			const val = await meta.settings.getOne('some:hash', 'does not exist');
			assert.strictEqual(val, null);
		});

		const someList = [
			{ name: 'andrew', status: 'best' },
			{ name: 'baris', status: 'wurst' },
		];
		const anotherList = [];

		it('should set setting with sorted list', () => new Promise((resolve, reject) => {
			socketAdmin.settings.set(
				{ uid: fooUid },
				{ hash: 'another:hash', values: { foo: '1', derp: 'value', someList, anotherList } },
				(err) => {
					if (err) return reject(err);

					db.getObject('settings:another:hash', (err, data) => {
						if (err) return reject(err);
						try {
							assert.equal(data.foo, '1');
							assert.equal(data.derp, 'value');
							assert.equal(data.someList, undefined);
							assert.equal(data.anotherList, undefined);
							resolve();
						} catch (assertionError) {
							reject(assertionError);
						}
					});
				}
			);
		}));

		it('should get setting with sorted list', () => new Promise((resolve, reject) => {
			socketAdmin.settings.get({ uid: fooUid }, { hash: 'another:hash' }, (err, data) => {
				if (err) return reject(err);
				try {
					assert.strictEqual(data.foo, '1');
					assert.strictEqual(data.derp, 'value');
					assert.deepStrictEqual(data.someList, someList);
					assert.deepStrictEqual(data.anotherList, anotherList);
					resolve();
				} catch (assertionError) {
					reject(assertionError);
				}
			});
		}));

		it('should not_set setting if not empty', () => new Promise((resolve, reject) => {
			meta.settings.setOnEmpty('some:hash', { foo: 2 }, (err) => {
				if (err) return reject(err);

				db.getObject('settings:some:hash', (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.foo, '1');
						assert.equal(data.derp, 'value');
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				});
			});
		}));

		it('should not set setting with sorted list if not empty', () => new Promise((resolve, reject) => {
			meta.settings.setOnEmpty('another:hash', { foo: anotherList }, (err) => {
				if (err) return reject(err);

				socketAdmin.settings.get({ uid: fooUid }, { hash: 'another:hash' }, (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.foo, '1');
						assert.equal(data.derp, 'value');
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				});
			});
		}));

		it('should set setting with sorted list if empty', () => new Promise((resolve, reject) => {
			meta.settings.setOnEmpty('another:hash', { empty: someList }, (err) => {
				if (err) return reject(err);

				socketAdmin.settings.get({ uid: fooUid }, { hash: 'another:hash' }, (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.foo, '1');
						assert.equal(data.derp, 'value');
						assert.deepEqual(data.empty, someList);
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				});
			});
		}));

		new Promise((resolve, reject) => {
			meta.settings.setOne('another:hash', 'someList', someList, (err) => {
				if (err) {
					return reject(err);
				}

				meta.settings.getOne('another:hash', 'someList', (err, _someList) => {
					if (err) {
						return reject(err);
					}

					try {
						assert.deepEqual(_someList, someList);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));
	});


	describe('config', () => {
		const socketAdmin = require('../src/socket.io/admin');
		before((done) => {
			db.setObject('config', { minimumTagLength: 3, maximumTagLength: 15 }, done);
		});

		new Promise((resolve, reject) => {
			meta.configs.getFields(['minimumTagLength', 'maximumTagLength'], (err, data) => {
				if (err) {
					return reject(err);
				}
				try {
					assert.strictEqual(data.minimumTagLength, 3);
					assert.strictEqual(data.maximumTagLength, 15);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('loginAttempts', '', (err) => {
				if (err) {
					return reject(err);
				}
				meta.configs.get('loginAttempts', (err, value) => {
					if (err) {
						return reject(err);
					}
					try {
						assert.strictEqual(value, 5);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('loginAttempts', '0', (err) => {
				if (err) {
					return reject(err);
				}
				meta.configs.get('loginAttempts', (err, value) => {
					if (err) {
						return reject(err);
					}
					try {
						assert.strictEqual(value, 0);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('title', 123, (err) => {
				if (err) {
					return reject(err);
				}
				meta.configs.get('title', (err, value) => {
					if (err) {
						return reject(err);
					}
					try {
						assert.strictEqual(value, '123');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('title', 0, (err) => {
				if (err) return reject(err);

				meta.configs.get('title', (err, value) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(value, '0');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('title', '', (err) => {
				if (err) return reject(err);

				meta.configs.get('title', (err, value) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(value, '');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('teaserPost', null, (err) => {
				if (err) return reject(err);

				meta.configs.get('teaserPost', (err, value) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(value, 'last-reply');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('', 'someValue', (err) => {
				try {
					assert.equal(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			socketAdmin.config.set({ uid: fooUid }, null, (err) => {
				try {
					assert.equal(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			socketAdmin.config.set({ uid: fooUid }, { key: 'someKey', value: 'someValue' }, (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['someKey'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.someKey, 'someValue');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('someField', 'someValue', (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['someField'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(data.someField, 'someValue');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('numericField', 123, (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['numericField'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(data.numericField, 123);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('booleanField', true, (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['booleanField'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(data.booleanField, true);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('booleanField', 'false', (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['booleanField'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(data.booleanField, false);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.set('stringField', '123', (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['stringField'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.strictEqual(data.stringField, 123);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			socketAdmin.config.setMultiple({ uid: fooUid }, null, (err) => {
				try {
					assert.equal(err.message, '[[error:invalid-data]]');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			socketAdmin.config.setMultiple({ uid: fooUid }, {
				someField1: 'someValue1',
				someField2: 'someValue2',
				customCSS: '.derp{color:#00ff00;}',
			}, (err) => {
				if (err) return reject(err);

				meta.configs.getFields(['someField1', 'someField2'], (err, data) => {
					if (err) return reject(err);
					try {
						assert.equal(data.someField1, 'someValue1');
						assert.equal(data.someField2, 'someValue2');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.configs.setOnEmpty({ someField1: 'foo' }, (err) => {
				if (err) return reject(err);

				meta.configs.get('someField1', (err, value) => {
					if (err) return reject(err);
					try {
						assert.equal(value, 'someValue1');
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			socketAdmin.config.remove({ uid: fooUid }, 'someField1', (err) => {
				if (err) return reject(err);

				db.isObjectField('config', 'someField1', (err, isObjectField) => {
					if (err) return reject(err);
					try {
						assert(!isObjectField);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}).catch(err => assert.ifError(err));
	});


	describe('session TTL', () => {
		new Promise((resolve, reject) => {
			try {
				assert.strictEqual(meta.getSessionTTLSeconds(), 1209600);
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				meta.config.loginDays = 7;
				assert.strictEqual(meta.getSessionTTLSeconds(), 604800);
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				meta.config.loginSeconds = 172800;
				assert.strictEqual(meta.getSessionTTLSeconds(), 172800);
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));
	});

	describe('dependencies', () => {
		new Promise((resolve, reject) => {
			meta.dependencies.checkModule('some-module-that-does-not-exist', (err) => {
				try {
					assert.equal(err.code, 'ENOENT');
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.dependencies.checkModule('nodebb-plugin-somePlugin', (err) => {
				if (err) return reject(err);
				resolve();
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			meta.dependencies.checkModule('nodebb-theme-someTheme', (err) => {
				if (err) return reject(err);
				resolve();
			});
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				const pkgData = meta.dependencies.parseModuleData('nodebb-plugin-test', '{"a": 1}');
				assert.equal(pkgData.a, 1);
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				const pkgData = meta.dependencies.parseModuleData('nodebb-plugin-test', 'asdasd');
				assert.strictEqual(pkgData, null);
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				assert(!meta.dependencies.doesSatisfy(null, '1.0.0'));
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				assert(!meta.dependencies.doesSatisfy({ name: 'nodebb-plugin-test', version: '0.9.0' }, '1.0.0'));
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));

		new Promise((resolve, reject) => {
			try {
				assert(meta.dependencies.doesSatisfy({ name: 'nodebb-plugin-test', _resolved: 'https://github.com/some/repo', version: '0.9.0' }, '1.0.0'));
				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));
	});

	describe('debugFork', () => {
		let oldArgv;
		before(() => {
			oldArgv = process.execArgv;
			process.execArgv = ['--debug=5858', '--foo=1'];
		});

		new Promise((resolve, reject) => {
			try {
				let debugFork = require('../src/meta/debugFork');
				assert(!debugFork.debugging);

				const debugForkPath = require.resolve('../src/meta/debugFork');
				delete require.cache[debugForkPath];

				debugFork = require('../src/meta/debugFork');
				assert(debugFork.debugging);

				resolve();
			} catch (error) {
				reject(error);
			}
		}).catch(err => assert.ifError(err));


		after(() => {
			process.execArgv = oldArgv;
		});
	});

	describe('Access-Control-Allow-Origin', () => {
		it('Access-Control-Allow-Origin header should be empty', async () => {
			const jar = request.jar();
			const { response } = await request.get(`${nconf.get('url')}/api/search?term=bug`, {
				jar: jar,
			});

			assert.equal(response.headers['access-control-allow-origin'], undefined);
		});

		it('should set proper Access-Control-Allow-Origin header', async () => {
			const jar = request.jar();
			const oldValue = meta.config['access-control-allow-origin'];
			meta.config['access-control-allow-origin'] = 'test.com, mydomain.com';
			const { response } = await request.get(`${nconf.get('url')}/api/search?term=bug`, {
				jar: jar,
				headers: {
					origin: 'mydomain.com',
				},
			});

			assert.equal(response.headers['access-control-allow-origin'], 'mydomain.com');
			meta.config['access-control-allow-origin'] = oldValue;
		});

		it('Access-Control-Allow-Origin header should be empty if origin does not match', async () => {
			const jar = request.jar();
			const oldValue = meta.config['access-control-allow-origin'];
			meta.config['access-control-allow-origin'] = 'test.com, mydomain.com';
			const { response } = await request.get(`${nconf.get('url')}/api/search?term=bug`, {
				data: {},
				jar: jar,
				headers: {
					origin: 'notallowed.com',
				},
			});
			assert.equal(response.headers['access-control-allow-origin'], undefined);
			meta.config['access-control-allow-origin'] = oldValue;
		});

		it('should set proper Access-Control Allow Origin header', async () => {
			const jar = request.jar();
			const oldValue = meta.config['access-control-allow-origin-regex'];
			meta.config['access-control-allow-origin-regex'] = 'match\\.this\\..+\\.domain.com, mydomain\\.com';
			const { response } = await request.get(`${nconf.get('url')}/api/search?term=bug`, {
				jar: jar,
				headers: {
					origin: 'match.this.anything123.domain.com',
				},
			});

			assert.equal(response.headers['access-control-allow-origin'], 'match.this.anything123.domain.com');
			meta.config['access-control-allow-origin-regex'] = oldValue;
		});

		it('Access Control Allow-Origin header should be empty if origin does not match', async () => {
			const jar = request.jar();
			const oldValue = meta.config['access-control-allow-origin-regex'];
			meta.config['access-control-allow-origin-regex'] = 'match\\.this\\..+\\.domain.com, mydomain\\.com';
			const { response } = await request.get(`${nconf.get('url')}/api/search?term=bug`, {
				jar: jar,
				headers: {
					origin: 'notallowed.com',
				},
			});
			assert.equal(response.headers['access-control-allow-origin'], undefined);
			meta.config['access-control-allow-origin-regex'] = oldValue;
		});

		it('should not error with invalid regexp', async () => {
			const jar = request.jar();
			const oldValue = meta.config['access-control-allow-origin-regex'];
			meta.config['access-control-allow-origin-regex'] = '[match\\.this\\..+\\.domain.com, mydomain\\.com';
			const { response } = await request.get(`${nconf.get('url')}/api/search?term=bug`, {
				jar: jar,
				headers: {
					origin: 'mydomain.com',
				},
			});
			assert.equal(response.headers['access-control-allow-origin'], 'mydomain.com');
			meta.config['access-control-allow-origin-regex'] = oldValue;
		});
	});

	new Promise((resolve, reject) => {
		try {
			const aliases = require('../src/meta/aliases');
			aliases.buildTargets();
			resolve();
		} catch (error) {
			reject(error);
		}
	}).catch(err => assert.ifError(err));
});
