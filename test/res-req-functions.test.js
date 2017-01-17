"use strict";

const request  = require('supertest');
const assert   = require('chai').assert;
const path     = require('path');
const express  = require('express');
//const debug    = require('debug')('volebonet:express:mw:lang:test');

/* ROOT of the package */
const rt = process.cwd();

describe('Res/Req `lang` functions', function(){

	const app = express();
	let langmw = {};
	const deflang = 'zh';

	before(function() {
		langmw = require(path.join(rt, ''))({
			defaultLanguage: deflang,
			availableLanguages: ['en', 'ru', 'zh-CHS'],
		});
		langmw.esu(app);
	});

	describe('on valid request `res` and `req`', function() {

		describe('property: lang', function() {

			before(function() {
				langmw.get('/valid-path', (req, res, next) => {

					assert.isNotNull(req.lang);
					assert.isNotNull(res.locals.lang);
					assert.strictEqual(req.lang, res.locals.lang);

					assert.property(req.lang, 'code');
					assert.property(req.lang, 'available');

					res.status(200).send('pong');
					next();
				});
			});

			it('`lang` has all properties', done => {
				request(app)
					.get('/valid-path')
					.expect(200, done);
			});
		});

		describe('function: lang.routeTo', function () {

			describe('routeTo(path)', () => {

				let toRoutePath = '/home-page/article/12';

				// set up handler
				before(function() {
					langmw.get('/routeTo/', (req, res, next) => {
						const act = req.lang.routeTo(toRoutePath);
						res.status(200).send(act);
						next();
					});
				});

				const testcases = [
					{ path: '/routeTo/',        urlpath: '/article/12',   exp: '/article/12' },
					{ path: '/zh/routeTo/',     urlpath: '/article/12',   exp: '/article/12' },
					{ path: '/zh-chs/routeTo/', urlpath: '/article/12',   exp: '/zh-CHS/article/12' },
					{ path: '/en/routeTo/',     urlpath: '/article/12',   exp: '/en/article/12' },
					{ path: '/ru/routeTo/',     urlpath: '/article/12',   exp: '/ru/article/12' },
				];

				testcases.forEach( data => {
					it(`${data.path} (${data.urlpath}) => [${data.exp}]`, function(done) {
						toRoutePath = data.urlpath;
						request(app)
							.get(data.path)
							.expect(200, data.exp, done);
					});
				});
			});

			describe('routeTo(path, lang)', () => {

				let toRouteLang = '';
				let toRoutePath = '';

				// set up handler
				before(function() {
					langmw.get('/routeToLang/', (req, res, next) => {
						const act = req.lang.routeTo(toRoutePath, toRouteLang);
						res.status(200).send(act);
						next();
					});
				});

				const testcases = [
					{ note: '', path: '/routeToLang/',        urlpath: '/home/post/about-me',   lang:'zh',  exp: '/home/post/about-me' },
					{ note: '', path: '/zh/routeToLang/',     urlpath: '/home/post/about-me',   lang:'zh',  exp: '/home/post/about-me' },
					{ note: '', path: '/zh-chs/routeToLang/', urlpath: '/home/post/about-me',   lang:'zh-CHS',  exp: '/zh-CHS/home/post/about-me' },
					{ note: '', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'ru',  exp: '/ru/home/post/about-me' },

					{ note: '', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'zh',  exp: '/home/post/about-me' },
					{ note: '', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'ru',  exp: '/ru/home/post/about-me' },
					{ note: '', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'en',  exp: '/en/home/post/about-me' },

					// Tests for the spec in README file: `routeTo`
					{ note: 'UNKNOWN lang', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'xx',  exp: '/home/post/about-me' },
					{ note: 'NULL lang', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:null,  exp: '/ru/home/post/about-me' },
					{ note: 'EMPTY lang', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'',  exp: '/home/post/about-me' },
					{ note: 'UNAVAILABLE lang', path: '/ru/routeToLang/',     urlpath: '/home/post/about-me',   lang:'ru-ru',  exp: '/home/post/about-me' },
				];

				testcases.forEach( data => {

					const note = data.note ? data.note + ': ' : '';
					it(`${note}${data.path} (${data.urlpath} ${data.lang}) => [${data.exp}]`, function(done) {

						toRoutePath = data.urlpath;
						toRouteLang = data.lang;

						request(app)
							.get(data.path)
							.expect(200, data.exp, done);
					});
				});
			});

		});

		// on valid request END DESCRIBE
	});

});
