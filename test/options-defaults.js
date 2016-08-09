/*
Language-helper middleware for Express web server.

Copyright (C) 2016  Volebo.Net <volebo.net@gmail.com>
Copyright (C) 2016  Koryukov Maksim <maxkoryukov@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the MIT License, attached to this software package.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

You should have received a copy of the MIT License along with this
program. If not, see <https://opensource.org/licenses/MIT>.
*/

"use strict";

const request  = require('supertest');
const path     = require('path');
const express  = require('express');
const _        = require('lodash');
const debug    = require('debug')('volebonet:express:mw:lang:test');
const assert   = require('chai').assert;

/* ROOT of the package */
var rt = process.cwd();

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
				assert.isNotNull(res.locals.lang);
				assert.isNotNull(res.locals.lang.defaultLanguage);

				res.status(200).send(res.locals.lang.defaultLanguage);
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

				let av = res.locals.lang.available;
				debug('available langs for request:', av)

				let joined_codes = _(av)
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

				let av = res.locals.lang.available;
				debug('available langs for request:', av)

				let joined_codes = _(av)
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
