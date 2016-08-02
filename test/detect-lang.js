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
//const path     = require('path');
const express  = require('express');
//const debug    = require('debug')('volebonet:express:mw:lang:test');

/* ROOT of the package */
var rt = process.cwd();

describe('Language detection', function(){

	let app = express();
	let langmw = {};
	const deflang = 'en';

	before(function() {
		langmw = require(rt)({
			defaultLanguage: deflang,
			availableLanguages: ['en', 'ru', 'zh-CHS'],
		});
		langmw.esu(app);
	});

	describe('should return explicit lang code (from available list)', function () {
		// set up handler
		before(function() {
			langmw.get('/code', (req, res, next) => {
				res.status(200).send(res.locals.lang.code);
				next();
			});
		});

		[
			// to check default twice
			{ path: '/code', resp: 'en' },

			{ path: '/ru/code', resp: 'ru' },
			{ path: '/en/code', resp: 'en' },
			{ path: '/zh-chs/code', resp: 'zh-CHS' },
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
			{ path: '/zh-chs/default' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(200, deflang, done);
			});
		});
	});

	describe('should RUN NEXT MW on unknown language/culture', function() {

		const RESP_NO_LANG = 'looks like a lang';
		const RESP_VK = 'vk response';

		const PATH_NO_LANG = '/xx-YY/looks-like-lang-but-no';
		const PATH_VK = '/vk/auth';
		const PATH_VK_NO = '/vk/no-such-page';

		before(function() {
			// appending next middlewares
			langmw.get(PATH_NO_LANG, (req, res, next) => {
				res.status(200).send(RESP_NO_LANG);
				next();
			});

			langmw.post(PATH_VK, (req, res, next) => {
				res.status(200).send(RESP_VK);
				next();
			});

		});

		it(PATH_NO_LANG, function(done) {
			request(app)
				.get(PATH_NO_LANG)
				.expect(200, RESP_NO_LANG, done);
		});

		[
			PATH_VK,
			'/ru' + PATH_VK,
			'/en' + PATH_VK
		].forEach(function(urlpath){
			it(urlpath, function(done) {
				request(app)
					.post(urlpath)
					.expect(200, RESP_VK, done);
			});
		});

		it(PATH_VK_NO, function(done) {
			request(app)
				.get(PATH_VK_NO)
				.expect(404, done);
		});


	});

	// behaviour changed, see https://github.com/VoleboNet/express-mw-lang/issues/8
	describe('should RUN NEXT MW for existing but unavailable lang', function () {
		// set up handler
		before(function() {
			langmw.get('/code-def-unavail-lang', (req, res, next) => {
				res.status(200).send(res.locals.lang.code);
				next();
			});
		});

		[
			{ path: '/ru-ru/code-def-unavail-lang' },
			{ path: '/ru-RU/code-def-unavail-lang' },
			{ path: '/zh/code-def-unavail-lang' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(200, deflang, done);
			});
		});


		[
			{ path: '/ru-ru/code-def-unavail-lang-404' },
			{ path: '/ru-RU/code-def-unavail-lang-404' },
			{ path: '/zh/code-def-unavail-lang-404' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(404, done);
			});
		});
	});

});
