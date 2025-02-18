'use strict';

const assert = require('assert');
const nconf = require('nconf');

const db = require('./mocks/databasemock');
const pubsub = require('../src/pubsub');

describe('pubsub', () => {
	new Promise((resolve, reject) => {
		nconf.set('isCluster', false);
		pubsub.reset();
		pubsub.on('testEvent', (message) => {
			try {
				assert.equal(message.foo, 1);
				pubsub.removeAllListeners('testEvent');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
		pubsub.publish('testEvent', { foo: 1 });
	});

	new Promise((resolve, reject) => {
		pubsub.on('dummyEvent', (message) => {
			try {
				assert.equal(message.foo, 2);
				pubsub.removeAllListeners('dummyEvent');
				pubsub.reset();
				resolve();
			} catch (error) {
				reject(error);
			}
		});
		pubsub.publish('dummyEvent', { foo: 2 });
	});

	new Promise((resolve, reject) => {
		const oldValue = nconf.get('singleHostCluster');
		nconf.set('singleHostCluster', true);
		pubsub.on('testEvent', (message) => {
			try {
				assert.equal(message.foo, 3);
				nconf.set('singleHostCluster', oldValue);
				pubsub.removeAllListeners('testEvent');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
		pubsub.publish('testEvent', { foo: 3 });
	});

	new Promise((resolve, reject) => {
		const oldValue = nconf.get('singleHostCluster');
		pubsub.on('dummyEvent', (message) => {
			try {
				assert.equal(message.foo, 4);
				nconf.set('singleHostCluster', oldValue);
				pubsub.removeAllListeners('dummyEvent');
				pubsub.reset();
				resolve();
			} catch (error) {
				reject(error);
			}
		});
		pubsub.publish('dummyEvent', { foo: 4 });
	});
});
