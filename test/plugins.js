/*

const assert = require('assert');
const path = require('path');
const nconf = require('nconf');

const fs = require('fs');

const db = require('./mocks/databasemock');
const plugins = require('../src/plugins');
const request = require('../src/request');

describe('Plugins', () => {
	new Promise((resolve, reject) => {
		const pluginId = 'nodebb-plugin-markdown';
		plugins.loadPlugin(path.join(nconf.get('base_dir'), `node_modules/${pluginId}`), (err) => {
			try {
				assert.ifError(err);
				assert(plugins.libraries[pluginId]);
				assert(plugins.loadedHooks['static:app.load']);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));


	new Promise((resolve) => {
		assert(plugins.hooks.hasListeners('filter:parse.post'));
		resolve();
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		function filterMethod1(data, callback) {
			data.foo += 1;
			callback(null, data);
		}

		function filterMethod2(data, callback) {
			data.foo += 5;
			callback(null, data);
		}

		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook', method: filterMethod1 });
		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook', method: filterMethod2 });

		plugins.hooks.fire('filter:test.hook', { foo: 1 }, (err, data) => {
			try {
				assert.ifError(err);
				assert.strictEqual(data.foo, 7);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	it('should register and fire a filter hook having 3 methods', async () => {
		function method1(data, callback) {
			data.foo += 1;
			callback(null, data);
		}
		async function method2(data) {
			return new Promise((resolve) => {
				data.foo += 5;
				resolve(data);
			});
		}
		function method3(data) {
			data.foo += 1;
			return data;
		}

		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook2', method: method1 });
		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook2', method: method2 });
		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook2', method: method3 });

		const data = await plugins.hooks.fire('filter:test.hook2', { foo: 1 });
		assert.strictEqual(data.foo, 8);
	});

	it('should not error with invalid hooks', async () => {
		function method1(data, callback) {
			data.foo += 1;
			return data;
		}
		function method2(data, callback) {
			data.foo += 2;
			// this is invalid
			callback(null, data);
			return data;
		}

		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook3', method: method1 });
		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook3', method: method2 });

		const data = await plugins.hooks.fire('filter:test.hook3', { foo: 1 });
		assert.strictEqual(data.foo, 4);
	});

	new Promise((resolve, reject) => {
		async function method(data) {
			try {
				data.foo += 5;
				throw new Error('nope');
			} catch (error) {
				reject(error);
			}
		}
		plugins.hooks.register('test-plugin', { hook: 'filter:test.hook4', method: method });

		plugins.hooks.fire('filter:test.hook4', { foo: 1 }, (err) => {
			if (err) {
				resolve();
			} else {
				reject(new Error('Expected an error but none was thrown'));
			}
		});
	}).catch(err => assert(err));

	new Promise((resolve, reject) => {
		function actionMethod(data) {
			try {
				assert.strictEqual(data.bar, 'test');
				resolve();
			} catch (error) {
				reject(error);
			}
		}

		plugins.hooks.register('test-plugin', { hook: 'action:test.hook', method: actionMethod });
		plugins.hooks.fire('action:test.hook', { bar: 'test' });
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		function actionMethod(data, callback) {
			try {
				assert.strictEqual(data.bar, 'test');
				callback();
				resolve();
			} catch (error) {
				reject(error);
			}
		}

		plugins.hooks.register('test-plugin', { hook: 'static:test.hook', method: actionMethod });

		plugins.hooks.fire('static:test.hook', { bar: 'test' }, (err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		async function method(data) {
			try {
				assert.strictEqual(data.bar, 'test');
				return resolve();
			} catch (error) {
				reject(error);
			}
		}

		plugins.hooks.register('test-plugin', { hook: 'static:test.hook', method: method });

		plugins.hooks.fire('static:test.hook', { bar: 'test' }, (err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		async function method(data) {
			try {
				assert.strictEqual(data.bar, 'test');
				throw new Error('just because');
			} catch (error) {
				reject(error);
			}
		}

		plugins.hooks.register('test-plugin', { hook: 'static:test.hook', method: method });

		plugins.hooks.fire('static:test.hook', { bar: 'test' }, (err) => {
			try {
				assert.strictEqual(err.message, 'just because');
				plugins.hooks.unregister('test-plugin', 'static:test.hook', method);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));


	new Promise((resolve, reject) => {
		async function method(data) {
			try {
				assert.strictEqual(data.bar, 'test');
				new Promise((res) => { setTimeout(res, 6000); });
				resolve();
			} catch (error) {
				reject(error);
			}
		}

		plugins.hooks.register('test-plugin', { hook: 'static:test.hook', method: method });

		plugins.hooks.fire('static:test.hook', { bar: 'test' }, (err) => {
			if (err) return reject(err);
			plugins.hooks.unregister('test-plugin', 'static:test.hook', method);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		plugins.get('nodebb-plugin-markdown', (err, data) => {
			if (err) return reject(err);
			try {
				const keys = ['id', 'name', 'url', 'description', 'latest', 'installed', 'active', 'latest'];
				assert.strictEqual(data.name, 'nodebb-plugin-markdown');
				assert.strictEqual(data.id, 'nodebb-plugin-markdown');
				keys.forEach(key => assert(data.hasOwnProperty(key)));
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		plugins.list((err, data) => {
			if (err) return reject(err);
			try {
				const keys = ['id', 'name', 'url', 'description', 'latest', 'installed', 'active', 'latest'];
				assert(Array.isArray(data));
				keys.forEach(key => assert(data[0].hasOwnProperty(key)));
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		const { nodeModulesPath } = plugins;
		plugins.nodeModulesPath = path.join(__dirname, './mocks/plugin_modules');

		plugins.showInstalled((err, pluginsData) => {
			if (err) return reject(err);
			try {
				const paths = pluginsData.map(plugin => path.relative(plugins.nodeModulesPath, plugin.path).replace(/\\/g, '/'));
				assert(paths.includes('nodebb-plugin-xyz'));
				assert(paths.includes('@nodebb/nodebb-plugin-abc'));

				plugins.nodeModulesPath = nodeModulesPath;
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		plugins.submitUsageData((err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));


	describe('install/activate/uninstall', () => {
		let latest;
		const pluginName = 'nodebb-plugin-imgur';
		const oldValue = process.env.NODE_ENV;
		before((done) => {
			process.env.NODE_ENV = 'development';
			done();
		});
		after((done) => {
			process.env.NODE_ENV = oldValue;
			done();
		});

		new Promise((resolve, reject) => {
			try {
				plugins.toggleInstall(pluginName, '1.0.16', (err, pluginData) => {
					if (err) return reject(err);
					try {
						assert.ifError(err);
						latest = pluginData.latest;

						assert.strictEqual(pluginData.name, pluginName);
						assert.strictEqual(pluginData.id, pluginName);
						assert.strictEqual(pluginData.url, 'https://github.com/barisusakli/nodebb-plugin-imgur#readme');
						assert.strictEqual(pluginData.description, 'A Plugin that uploads images to imgur');
						assert.strictEqual(pluginData.active, false);
						assert.strictEqual(pluginData.installed, true);

						const packageFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
						assert(packageFile.dependencies[pluginName]);

						resolve();
					} catch (error) {
						reject(error);
					}
				});
			} catch (error) {
				reject(error);
			}
		});


		new Promise((resolve, reject) => {
			plugins.toggleActive(pluginName, (err) => {
				if (err) return reject(err);
				try {
					assert.ifError(err);
					plugins.isActive(pluginName, (err, isActive) => {
						if (err) return reject(err);
						try {
							assert.ifError(err);
							assert(isActive);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				} catch (error) {
					reject(error);
				}
			});
		});

		it('should error if plugin id is invalid', async () => {
			await assert.rejects(
				plugins.toggleActive('\t\nnodebb-plugin'),
				{ message: '[[error:invalid-plugin-id]]' }
			);

			await assert.rejects(
				plugins.toggleActive('notaplugin'),
				{ message: '[[error:invalid-plugin-id]]' }
			);
		});

		new Promise((resolve, reject) => {
			plugins.upgrade(pluginName, 'latest', (err, isActive) => {
				if (err) return reject(err);
				try {
					assert.ifError(err);
					assert(isActive);
					plugins.loadPluginInfo(path.join(nconf.get('base_dir'), 'node_modules', pluginName), (err, pluginInfo) => {
						if (err) return reject(err);
						try {
							assert.ifError(err);
							assert.equal(pluginInfo.version, latest);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			plugins.toggleInstall(pluginName, 'latest', (err, pluginData) => {
				if (err) return reject(err);
				try {
					assert.ifError(err);
					assert.equal(pluginData.installed, false);
					assert.equal(pluginData.active, false);

					const packageFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
					assert(!packageFile.dependencies[pluginName]);

					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	});

	describe('static assets', () => {
		it('should 404 if resource does not exist', async () => {
			const { response, body } = await request.get(`${nconf.get('url')}/plugins/doesnotexist/should404.tpl`);
			assert.equal(response.statusCode, 404);
			assert(body);
		});

		it('should 404 if the resource does not exist', async () => {
			const url = `${nconf.get('url')}/plugins/nodebb-plugin-dbsearch/dbsearch/templates/admin/plugins/should404.tpl`;
			const { response, body } = await request.get(url);
			assert.equal(response.statusCode, 404);
			assert(body);
		});

		it('should get resource', async () => {
			const url = `${nconf.get('url')}/assets/templates/admin/plugins/dbsearch.tpl`;
			const { response, body } = await request.get(url);
			assert.equal(response.statusCode, 200);
			assert(body);
		});
	});

	describe('plugin state set in configuration', () => {
		const activePlugins = [
			'nodebb-plugin-markdown',
			'nodebb-plugin-mentions',
		];
		const inactivePlugin = 'nodebb-plugin-emoji';
		beforeEach(() => new Promise((resolve) => {
			nconf.set('plugins:active', activePlugins);
			resolve();
		}));

		afterEach(() => new Promise((resolve) => {
			nconf.set('plugins:active', undefined);
			resolve();
		}));

		new Promise((resolve, reject) => {
			plugins.isActive(activePlugins[0], (err, isActive) => {
				try {
					assert.ifError(err);
					assert(isActive);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			plugins.isActive(inactivePlugin, (err, isActive) => {
				try {
					assert.ifError(err);
					assert(!isActive);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			plugins.list((err, data) => {
				try {
					assert.ifError(err);
					const keys = ['id', 'name', 'url', 'description', 'latest', 'installed', 'active', 'latest'];
					assert(Array.isArray(data));
					keys.forEach((key) => {
						assert(data[0].hasOwnProperty(key));
					});
					data.forEach((pluginData) => {
						assert.equal(pluginData.active, activePlugins.includes(pluginData.id));
					});
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			plugins.getActive((err, data) => {
				try {
					assert.ifError(err);
					assert(Array.isArray(data));
					data.forEach((pluginData) => {
						assert(activePlugins.includes(pluginData));
					});
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});

		new Promise((resolve, reject) => {
			assert.rejects(plugins.toggleActive(activePlugins[0]), Error)
				.then(() => {
					plugins.isActive(activePlugins[0], (err, isActive) => {
						try {
							assert.ifError(err);
							assert(isActive);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				})
				.catch(reject);
		});

		new Promise((resolve, reject) => {
			assert.rejects(plugins.toggleActive(inactivePlugin), Error)
				.then(() => {
					plugins.isActive(inactivePlugin, (err, isActive) => {
						try {
							assert.ifError(err);
							assert(!isActive);
							resolve();
						} catch (error) {
							reject(error);
						}
					});
				})
				.catch(reject);
		});
	});
});

*/
