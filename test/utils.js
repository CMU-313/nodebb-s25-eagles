const assert = require('assert');
const validator = require('validator');
const { JSDOM } = require('jsdom');
const slugify = require('../src/slugify');
// const db = require('./mocks/databasemock');

describe('Utility Methods', () => {
	// Set up jsdom for jQuery
	const dom = new JSDOM('<html><body></body></html>');
	global.window = dom.window;
	global.document = dom.window.document;
	global.jQuery = require('jquery');
	global.$ = global.jQuery;
	const { $ } = global;

	const utils = require('../public/src/utils');

	it('should decode HTML entities', async () => {
		assert.strictEqual(
			utils.decodeHTMLEntities('Ken Thompson &amp; Dennis Ritchie'),
			'Ken Thompson & Dennis Ritchie'
		);
		assert.strictEqual(
			utils.decodeHTMLEntities('3 &lt; 4'),
			'3 < 4'
		);
		assert.strictEqual(
			utils.decodeHTMLEntities('http:&#47;&#47;'),
			'http://'
		);
	});

	it('should strip HTML tags while keeping allowed ones', async () => {
		assert.strictEqual(utils.stripHTMLTags('<p>just <b>some</b> text</p>'), 'just some text');
		assert.strictEqual(utils.stripHTMLTags('<p>just <b>some</b> text</p>', ['p']), 'just <b>some</b> text');
		assert.strictEqual(utils.stripHTMLTags('<i>just</i> some <image/> text', ['i']), 'just some <image/> text');
		assert.strictEqual(utils.stripHTMLTags('<i>just</i> some <image/> <div>text</div>', ['i', 'div']), 'just some <image/> text');
	});

	it('should preserve case if requested in slugify', async () => {
		assert.strictEqual(slugify('UPPER CASE', true), 'UPPER-CASE');
	});

	it('should work if a number is passed in slugify', async () => {
		assert.strictEqual(slugify(12345), '12345');
	});

	describe('username validation', () => {
		it('accepts latin-1 characters', () => {
			const username = "John\"'-. Doeäâèéë1234";
			assert(utils.isUserNameValid(username), 'invalid username');
		});

		it('rejects invalid usernames', () => {
			assert.strictEqual(utils.isUserNameValid(''), false, 'accepted empty username');
			assert.strictEqual(utils.isUserNameValid('myusername\r\n'), false, 'accepted newline username');
			assert.strictEqual(utils.isUserNameValid('myusername\n'), false, 'accepted newline username');
			assert.strictEqual(utils.isUserNameValid('myusername\t'), false, 'accepted tab username');
		});

		it('accepts special characters in usernames', () => {
			assert(utils.isUserNameValid('[best clan] julian'), 'invalid username with brackets');
			assert(utils.isUserNameValid('baris "the best" usakli'), 'invalid username with quotes');
		});
	});

	describe('email validation', () => {
		it('accepts valid email addresses', () => {
			assert(utils.isEmailValid('sample@example.com'), 'invalid email');
		});
		it('rejects invalid email addresses', () => {
			assert.strictEqual(utils.isEmailValid(''), false, 'accepted empty email');
		});
	});

	describe('UUID generation', () => {
		it('should return unique UUIDs', async () => {
			delete require.cache[require.resolve('../src/utils')];
			const { generateUUID } = require('../src/utils');
			const uuid1 = generateUUID();
			const uuid2 = generateUUID();
			assert.notStrictEqual(uuid1, uuid2, 'UUIDs match');
		});
	});

	describe('cleanUpTag', () => {
		it('should clean up a tag properly', async () => {
			const cleanedTag = utils.cleanUpTag(',/#!$^*;TaG1:{}=_`<>\'"~()?|');
			assert.strictEqual(cleanedTag, 'tag1');
		});

		it('should return empty string for invalid tags', async () => {
			assert.strictEqual(utils.cleanUpTag(undefined), '');
			assert.strictEqual(utils.cleanUpTag(null), '');
			assert.strictEqual(utils.cleanUpTag(false), '');
			assert.strictEqual(utils.cleanUpTag(1), '');
			assert.strictEqual(utils.cleanUpTag(0), '');
		});
	});

	it('should remove punctuation from text', async () => {
		const removed = utils.removePunctuation('some text with , ! punctuation inside "');
		assert.strictEqual(removed, 'some text with   punctuation inside ');
	});

	it('should get the correct language key', async () => {
		assert.strictEqual(utils.getLanguage(), 'en-GB');
		global.window.config = { userLang: 'tr' };
		assert.strictEqual(utils.getLanguage(), 'tr');
		global.window.config = { defaultLang: 'de' };
		assert.strictEqual(utils.getLanguage(), 'de');
	});

	it('should verify if a string has a language key', async () => {
		assert.strictEqual(utils.hasLanguageKey('some text [[topic:title]] and [[user:reputaiton]]'), true);
		assert.strictEqual(utils.hasLanguageKey('some text with no language keys'), false);
	});

	it('should return true if browser is Android', async () => {
		global.navigator = { userAgent: 'Mozilla/5.0 Android' };
		assert.strictEqual(utils.isAndroidBrowser(), true);
	});

	it('should return false if browser is not Android', async () => {
		global.navigator = { userAgent: 'Mozilla/5.0 Windows' };
		assert.strictEqual(utils.isAndroidBrowser(), false);
	});

	describe('URL parameters', () => {
		it('should return empty object for missing URL params', async () => {
			assert.deepStrictEqual(utils.params(), {});
		});

		it('should correctly parse URL parameters', async () => {
			const params = utils.params({ url: 'http://nodebb.org?foo=1&bar=test&herp[]=2&herp[]=3' });
			assert.strictEqual(params.foo, 1);
			assert.strictEqual(params.bar, 'test');
			assert.deepStrictEqual(params.herp, [2, 3]);
		});

		it('should return the full URLSearchParams object when requested', async () => {
			const params = utils.params({ url: 'http://nodebb.org?foo=1&bar=test', full: true });
			assert(params instanceof URLSearchParams);
			assert.strictEqual(params.get('foo'), '1');
			assert.strictEqual(params.get('bar'), 'test');
		});
	});

	it('should generate valid UUIDs', async () => {
		assert(validator.isUUID(utils.generateUUID()));
	});

	describe('utils.props', () => {
		const data = {};

		it('should set and retrieve nested data', async () => {
			assert.strictEqual(utils.props(data, 'a.b.c.d', 10), 10);
			assert.strictEqual(utils.props(data, 'a.b.c.d'), 10);
		});

		it('should return undefined for missing properties', async () => {
			assert.strictEqual(utils.props(data, 'a.b.c.foo.bar'), undefined);
			assert.strictEqual(utils.props(undefined, null), undefined);
		});
	});

	describe('Internal URI detection', () => {
		const target = { host: '', protocol: 'https' };
		const reference = { host: '', protocol: 'https' };

		it('should return true for matching hosts and protocols', async () => {
			assert(utils.isInternalURI(target, reference, ''));
		});

		it('should handle relative paths correctly', async () => {
			target.pathname = '/forum';
			assert(utils.isInternalURI(target, reference, '/forum'));
		});

		it('should return false for different hosts', async () => {
			target.host = 'nodebb.org';
			reference.host = 'designcreateplay.com';
			assert.strictEqual(utils.isInternalURI(target, reference), false);
		});
	});
});
