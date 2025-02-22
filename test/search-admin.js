


const assert = require('assert');
const search = require('../src/admin/search');

describe('admin search', () => {
	describe('filterDirectories', () => {
		new Promise((resolve, reject) => {
			try {
				assert.deepEqual(search.filterDirectories([
					'hfjksfd/fdsgagag/admin/gdhgfsdg/sggag.tpl',
				]), [
					'admin/gdhgfsdg/sggag',
				]);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		new Promise((resolve, reject) => {
			try {
				assert.deepEqual(search.filterDirectories([
					'hfjksfd/fdsgagag/admin/gdhgfsdg/sggag.tpl',
					'dfahdfsgf/admin/hgkfds/fdhsdfh.js',
				]), [
					'admin/gdhgfsdg/sggag',
				]);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		new Promise((resolve, reject) => {
			try {
				assert.deepEqual(search.filterDirectories([
					'hfjksfd/fdsgagag/admin/gdhgfsdg/sggag.tpl',
					'dfahdfsgf/admin/partials/hgkfds/fdhsdfh.tpl',
				]), [
					'admin/gdhgfsdg/sggag',
				]);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		new Promise((resolve, reject) => {
			try {
				assert.deepEqual(search.filterDirectories([
					'hfjksfd/fdsgagag/admin/gdhgfsdg/sggag.tpl',
					'dfdasg/admin/hjkdfsk.tpl',
				]), [
					'admin/gdhgfsdg/sggag',
				]);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	describe('sanitize', () => {
		new Promise((resolve, reject) => {
			try {
				assert.equal(
					search.sanitize('Pellentesque tristique senectus' +
						'<script>alert("nope");</script> habitant morbi'),
					'Pellentesque tristique senectus' +
						' habitant morbi'
				);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		new Promise((resolve, reject) => {
			try {
				assert.equal(
					search.sanitize('<p>Pellentesque <b>habitant morbi</b> tristique senectus' +
						'Aenean <i>vitae</i> est.Mauris <a href="placerat">eleifend</a> leo.</p>'),
					'Pellentesque habitant morbi tristique senectus' +
						'Aenean vitae est.Mauris eleifend leo.'
				);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	describe('simplify', () => {
		new Promise((resolve, reject) => {
			try {
				assert.equal(
					search.simplify('Pellentesque tristique {{senectus}}habitant morbi' +
						'liquam tincidunt {mauris.eu}risus'),
					'Pellentesque tristique habitant morbi' +
						'liquam tincidunt risus'
				);
				resolve();
			} catch (error) {
				reject(error);
			}
		});

		new Promise((resolve, reject) => {
			try {
				assert.equal(
					search.simplify('Pellentesque tristique   habitant morbi' +
						'  \n\n    liquam tincidunt mauris eu risus.'),
					'Pellentesque tristique habitant morbi' +
						'\nliquam tincidunt mauris eu risus.'
				);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});
});
