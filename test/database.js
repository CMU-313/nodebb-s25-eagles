


const assert = require('assert');
const nconf = require('nconf');
const db = require('./mocks/databasemock');


describe('Test database', () => {
	it('should work', () => {
		assert.doesNotThrow(() => {
			require('./mocks/databasemock');
		});
	});

	describe('info', () => {
		it('should return info about database', () => new Promise((done) => {
			db.info(db.client, (err, info) => {
				assert.ifError(err);
				assert(info);
				done();
			});
		}));

		it('should not error and return info if client is falsy', () => new Promise((done) => {
			db.info(null, (err, info) => {
				assert.ifError(err);
				assert(info);
				done();
			});
		}));
	});

	describe('checkCompatibility', () => {
		it('should not throw', () => new Promise((done) => {
			db.checkCompatibility(done);
		}));

		it('should return error with a too low version', () => new Promise((done) => {
			const dbName = nconf.get('database');
			if (dbName === 'redis') {
				db.checkCompatibilityVersion('2.4.0', (err) => {
					assert.equal(err.message, 'Your Redis version is not new enough to support NodeBB, please upgrade Redis to v2.8.9 or higher.');
					done();
				});
			} else if (dbName === 'mongo') {
				db.checkCompatibilityVersion('1.8.0', (err) => {
					assert.equal(err.message, 'The `mongodb` package is out-of-date, please run `./nodebb setup` again.');
					done();
				});
			} else if (dbName === 'postgres') {
				db.checkCompatibilityVersion('6.3.0', (err) => {
					assert.equal(err.message, 'The `pg` package is out-of-date, please run `./nodebb setup` again.');
					done();
				});
			}
		}));
	});


	require('./database/keys');
	require('./database/list');
	require('./database/sets');
	require('./database/hash');
	require('./database/sorted');
});
