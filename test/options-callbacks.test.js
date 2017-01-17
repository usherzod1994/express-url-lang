"use strict";

const request  = require('supertest');
const express  = require('express');
const assert   = require('chai').assert;

const LangMw = require(packageRoot);

let app = null;
let langmw = null;

describe('Test callbacks, passed in options', function() {
	describe('onLangCodeReady', function () {

		// set up handler
		before(function() {
			app = express();
			langmw = new LangMw({
				availableLanguages: ['ru', 'en'],
				onLangCodeReady: function(lang_code, req, res) {
					assert.isNotNull(lang_code);
					assert.isString(lang_code);
					assert.isNotNull(req);
					assert.isNotNull(res);
				}
			});
			langmw.esu(app);

			langmw.get('/callback/onLangCodeReady', (req, res, next) => {
				res.status(200).send(req.lang.code);
				next();
			});
		});

		after(function() {
			langmw = null;
		});

		[
			{ path_prefix: '' },
			{ path_prefix: '/ru' }
		].forEach(data => {
			const upath = data.path_prefix + '/callback/onLangCodeReady';
			it(upath, function(done) {
				request(app)
					.get(upath)
					.expect(200, done);
			});
		});
	});
});
