'use strict';

const { parentPort } = require('worker_threads');
const fs = require('fs');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const clean = require('postcss-clean');
const rtlcss = require('rtlcss');
const sass = require('../utils').getSass();

const actions = {};

async function processScss(direction, scssOutput, data) {
	let css = scssOutput.css.toString();
	if (direction === 'rtl') {
		css = await postcss([rtlcss()]).process(css, {
			from: undefined,
		});
	}
	const postcssArgs = [autoprefixer];
	if (data.minify) {
		postcssArgs.push(clean({
			processImportFrom: ['local'],
		}));
	}
	return await postcss(postcssArgs).process(css, {
		from: undefined,
	});
}

actions.concat = async function concat(data) {
	try {
		const files = await Promise.all(data.files.map(async (file) => {
			const content = await fs.promises.readFile(file.srcPath, 'utf8');
			return content;
		}));
		const output = files.join('\n;');
		await fs.promises.writeFile(data.destPath, output);
		if (parentPort) {
			parentPort.postMessage({ type: 'end', result: output });
		}
	} catch (err) {
		if (parentPort) {
			parentPort.postMessage({ type: 'error', message: err.message });
		}
	}
};

actions.buildCSS = async function buildCSS(data) {
	try {
		const scssOutput = await sass.compileStringAsync(data.source, {
			loadPaths: data.paths,
		});

		const [ltrresult, rtlresult] = await Promise.all([
			processScss('ltr', scssOutput, data),
			processScss('rtl', scssOutput, data),
		]);

		if (parentPort) {
			parentPort.postMessage({
				type: 'end',
				result: {
					ltr: { code: ltrresult.css },
					rtl: { code: rtlresult.css },
				},
			});
		}
	} catch (err) {
		if (parentPort) {
			parentPort.postMessage({ type: 'error', message: err.message });
		}
	}
};

if (parentPort) {
	parentPort.on('message', async (message) => {
		if (message.type === 'action') {
			const { action } = message;
			if (typeof actions[action.act] !== 'function') {
				parentPort.postMessage({ type: 'error', message: 'Unknown action' });
				return;
			}
			try {
				await actions[action.act](action);
			} catch (err) {
				parentPort.postMessage({ type: 'error', message: err.message });
			}
		}
	});
}
