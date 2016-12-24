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
			let upath = data.path_prefix + '/callback/onLangCodeReady';
			it(upath, function(done) {
				request(app)
					.get(upath)
					.expect(200, done);
			});
		});
	});
});
