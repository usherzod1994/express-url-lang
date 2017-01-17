"use strict";

const request  = require('supertest');
const express  = require('express');
const debug    = require('debug')('volebo-express-mw-lang:test');

const LangMw = require(packageRoot);

describe('Language detection', function(){

	const app = express();
	let langmw = {};
	const deflang = 'en';

	before(function() {
		langmw = new LangMw({
			defaultLanguage: deflang,
			availableLanguages: ['en', 'ru', 'zh-CHS'],
		});
		langmw.esu(app);
	});

	describe('should return explicit lang code (from available list)', function () {
		// set up handler
		before(function() {
			langmw.get('/code', (req, res, next) => {
				res.status(200).send(req.lang.code);
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
				res.status(200).send(req.lang.defaultLanguage);
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
				debug(req.lang.code);
				res.status(200).send(RESP_NO_LANG);
				next();
			});

			langmw.post(PATH_VK, (req, res, next) => {
				debug(req.lang.code);
				res.status(200).send(RESP_VK);
				next();
			});

		});

		it(PATH_NO_LANG + ' and should not eat the prefix', function(done) {
			request(app)
				.get(PATH_NO_LANG)
				.expect(200, RESP_NO_LANG, done);
		});

		[
			PATH_VK,
			'/ru' + PATH_VK,
			'/en' + PATH_VK
		].forEach(function(urlpath){
			it(urlpath + ' and should not eat the prefix', function(done) {
				request(app)
					.post(urlpath)
					.expect(200, RESP_VK, done);
			});
		});

		[
			PATH_VK_NO,
			'/ru' + PATH_VK_NO,
			'/en' + PATH_VK_NO
		].forEach(function(urlpath){
			it(urlpath, function(done) {
				request(app)
					.get(urlpath)
					.expect(404, done);
			});
		});

	});

	// behaviour changed, see https://github.com/VoleboNet/express-mw-lang/issues/8
	describe('should RUN NEXT MW for unavailable lang NOT TRIMMING the url', function () {
		// set up handler
		before(function() {

			// the MW will not eat the LANG PREFIX (because it is not
			// available), so we should add handler for the full path:
			langmw.get('/ru-ru/code-def-unavail-lang', (req, res, next) => {
				res.status(200).send(req.lang.code);
				next();
			});

			langmw.get('/zh/code-def-unavail-lang', (req, res, next) => {
				res.status(200).send(req.lang.code);
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
			{ path: '/ru-ru/code-unavail-lang-404' },
			{ path: '/ru-RU/code-unavail-lang-404' },
			{ path: '/zh/code-unavail-lang-404' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(404, done);
			});
		});
	});

});
