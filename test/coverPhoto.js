

const assert = require('assert');
const nconf = require('nconf');

const db = require('./mocks/databasemock');
const coverPhoto = require('../src/coverPhoto');
const meta = require('../src/meta');

describe('coverPhoto', () => {
	it('should get default group cover', () => new Promise((done) => {
		meta.config['groups:defaultCovers'] = '/assets/image1.png, /assets/image2.png';
		const result = coverPhoto.getDefaultGroupCover('registered-users');
		assert.equal(result, `${nconf.get('relative_path')}/assets/image2.png`);
		done();
	}));

	it('should get default default profile cover', () => new Promise((done) => {
		meta.config['profile:defaultCovers'] = ' /assets/image1.png, /assets/image2.png ';
		const result = coverPhoto.getDefaultProfileCover(1);
		assert.equal(result, `${nconf.get('relative_path')}/assets/image2.png`);
		done();
	}));
});
