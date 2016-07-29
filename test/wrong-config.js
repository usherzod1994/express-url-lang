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
const debug    = require('debug')('volebonet:express:mw:lang:test');

/* ROOT of the package */
var rt = process.cwd();

describe('run express', function(){

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
				availableLanguages: ['xx', 'ru'],
			});
			langmw.esu(app);

			langmw.get('/any-path', (req, res, next) => {

				let av = res.locals.lang.available;
				debug('available langs for request:', av)

				_.
				res.status(200).send(res.locals.lang.available);
				next();
			});
		});

		after(function() {
			langmw = null;
		});

		it('should omit unknown', function(done) {
			request(app)
				.get('/any-path')
				.expect(200, 'en', done);
		});
	});
});
