"use strict";

const request  = require('supertest');
const path     = require('path');
const express  = require('express');
const _        = require('lodash');
const debug    = require('debug')('volebo-express-mw-lang:test');
const assert   = require('chai').assert;

/* ROOT of the package */
const rt = process.cwd();

describe('Test config behaviour', function(){

	let app = null;
	let langmw = null;

	describe('on unknown defaultLanguage in config', function () {
		// set up handler
		before(function() {
			app = express();
			langmw = require(path.join(rt, ''))({
				defaultLanguage: 'xx',
				availableLanguages: ['en', 'ru'],
			});
			langmw.esu(app);

			langmw.get('/any-path', (req, res, next) => {
				// send the used default lang
				assert.isNotNull(req.lang);
				assert.isNotNull(req.lang.defaultLanguage);

				res.status(200).send(req.lang.defaultLanguage);
				next();
			});
		});

		after(function() {
			langmw = null;
		});

		it('should use "en"', function(done) {
			request(app)
				.get('/any-path')
				.expect(200, 'en', done);
		});
	});

	describe('on unknown availableLanguages in config', function () {
		// set up handler
		before(function() {
			app = express();
			langmw = require(path.join(rt, ''))({
				defaultLanguage: 'ru-RU',
				availableLanguages: ['xx', 'en'],
			});
			langmw.esu(app);

			langmw.get('/any-path', (req, res, next) => {

				const av = req.lang.available;
				debug('available langs for request:', av)

				const joined_codes = _(av)
					.map('code')
					.uniq()
					.orderBy()
					.reduce((s,v) => s += v + ',', '');

				res.status(200).send(joined_codes);
				next();
			});
		});

		after(function() {
			langmw = null;
		});

		it('should omit unknown', function(done) {
			request(app)
				.get('/any-path')
				.expect(200, 'en,ru-RU,', done);
		});
	});

	describe('on NO availableLanguages in config', function () {
		// set up handler
		before(function() {
			app = express();
			langmw = require(path.join(rt, ''))({
				defaultLanguage: 'ru-RU',
			});
			langmw.esu(app);

			langmw.get('/no-available', (req, res, next) => {

				const av = req.lang.available;
				debug('available langs for request:', av)

				const joined_codes = _(av)
					.map('code')
					.uniq()
					.orderBy()
					.reduce((s,v) => s += v + ',', '');

				res.status(200).send(joined_codes);
				next();
			});
		});


		it('should return default lang', function(done) {
			request(app)
				.get('/no-available')
				.expect(200, 'ru-RU,', done);
		});
	});
});
