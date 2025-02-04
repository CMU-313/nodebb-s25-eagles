'use strict';

const assert = require('assert');
const createACPModule = require('../public/src/admin/dashboard/searches');

describe('handleError', () => {
	let handleError;
	let ACP;
	beforeEach(() => {
		const alert = {
			error: (err) => {
				throw new Error(`Error: ${err.message}`);
			},
		};

		const ajaxify = {
			refresh: () => 'Refreshed!',
		};

		const socket = {
			emit: (event, callback) => {
				if (event === 'admin.clearSearchHistory') {
					callback(null);
				} else {
					callback(new Error('Unknown event detected'));
				}
			},
		};

		const stubACPModule = createACPModule(alert, ajaxify, socket, () => {});
		handleError = stubACPModule.handleError;
		ACP = stubACPModule.ACP;
	});

	it('should call alert.error when handleError receives an error', () => {
		try {
			handleError(new Error('Automated Test Error'));
			assert(false, 'handleError should have thrown an error');
		} catch (err) {
			assert.strictEqual(err.message, 'Error: Automated Test Error');
		}
	});

	it('should return "undefined" when handleError receives no error', () => {
		const result = handleError(null);
		assert.strictEqual(result, undefined);
	});
});
