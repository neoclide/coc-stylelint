'use strict';
/* eslint-disable no-console */

const { dirname, join } = require('path');
const { performance } = require('perf_hooks');
const { strictEqual } = require('assert');
// Test file – it’s ok for tests to only run on newer versions of Node than what the project supports.
// eslint-disable-next-line node/no-unsupported-features/node-builtins
const { symlink } = require('fs').promises;

const attempt = require('lodash/attempt');
const findPkg = require('find-pkg').sync;
const findPkgDir = require('..');
const findRoot = require('find-root');
const isError = require('lodash/fp/isError');
const pkgDir = require('pkg-dir').sync;
const rmfr = require('rmfr');
const times = require('lodash/fp/times');

const TIME = 10000;

function measure(fn, title) {
	const MAX_LENGTH = 39;

	title = title.padEnd(MAX_LENGTH);

	const start = performance.now();
	const result = attempt(() => times(fn)(TIME));

	if (isError(result)) {
		console.log(`${title}        N/A (operation failed)`);
	} else {
		console.log(
			`${title}${((performance.now() - start) / (TIME / 1000))
				.toFixed(15)
				.padStart(19)} ms/op avg.`,
		);
	}
}

(async () => {
	await rmfr(join(__dirname, 'symlink'));
	await symlink(join(__dirname, 'flat'), join(__dirname, 'symlink'));

	for (const [fnName, fn] of Object.entries({
		'find-pkg-dir (this project)': findPkgDir,
		'find-pkg + path.dirname()': (dir) => dirname(findPkg(dir)),
		'find-root': findRoot,
		'pkg-dir': pkgDir,
	})) {
		console.log(`${fnName}:`);

		measure(() => {
			strictEqual(fn(join(__dirname, 'flat')), join(__dirname, 'flat'));
		}, 'Find from the current directory');

		measure(() => {
			strictEqual(fn(join(__dirname, 'deep/0/1/2/3/4/5/6/7/8/9/_')), join(__dirname, 'deep'));
		}, 'Find from the deep directory');

		measure(() => {
			strictEqual(fn(join(__dirname, 'symlink')), join(__dirname, 'flat'));
		}, 'Resolve symlinks');

		measure(() => {
			strictEqual(fn(join(__dirname, 'package.json')), join(__dirname, '..'));
		}, 'Find from the `package.json` directory');

		console.log();
	}
})();
/* eslint-enable no-console */
