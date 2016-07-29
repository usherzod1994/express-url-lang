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
//const assert   = require('chai').assert;
const path     = require('path');
const express  = require('express');
//const debug    = require('debug')('volebonet:express:mw:lang:test');

/* ROOT of the package */
var rt = process.cwd();

describe('run express', function(){

	let app = express();
	let langmw = {};
	const deflang = 'en';

	before(function() {
		langmw = require(path.join(rt, ''))({
			defaultLanguage: deflang,
			availableLanguages: ['en', 'ru'],
		});
		langmw.esu(app);
	});

	describe('should return explicit lang code', function () {
		// set up handler
		before(function() {
			langmw.get('/code', (req, res, next) => {
				res.status(200).send(res.locals.lang.code);
				next();
			});
		});

		[
			{ path: '/code', resp: 'en' },
			{ path: '/ru/code', resp: 'ru' },
			{ path: '/en/code', resp: 'en' },
			{ path: '/ru-ru/code', resp: 'ru-RU' },
			{ path: '/ru-RU/code', resp: 'ru-RU' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(200, data.resp, done);
			});
		});
	});


	describe('should return default lang code', function() {
		// set up handler
		before(function() {
			langmw.get('/default', (req, res, next) => {
				res.status(200).send(res.locals.lang.defaultLanguage);
				next();
			});
		});

		[
			{ path: '/default' },
			{ path: '/ru/default' },
			{ path: '/en/default' },
			{ path: '/ru-ru/default' },
			{ path: '/ru-RU/default' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(200, deflang, done);
			});
		});
	});

	describe('should redirect to root', function() {

		let path = '/xx-YY/not-exists-culture';

		it(path, function(done) {
			langmw.get(path, (req, res, next) => {
				res.status(200).send(res.locals.lang.defaultLanguage);
				next();
			});

			request(app)
				.get(path)
				.expect(302, done);
		});
	});
});
