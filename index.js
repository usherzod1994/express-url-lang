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

const debug           = require('debug')('volebo:express:mw:lang');
const _               = require('lodash');
const express         = require('express');

let init = function(options) {

	// with ISO 639-x codes
	const knownLangs = [
		{
			// NOTE: do not remove the EN locale, it is library default!
			code: 'en',
			name: {
				short: 'en',
				full: 'English',
				native: {
					short: 'en',
					full: 'English'
				}
			},
		},

		{
			code: 'ru',
			name: {
				short: 'ru',
				full: 'Russian',
				native: {
					short: 'рус',
					full: 'Русский'
				}
			},
		},
		{
			code: 'ru-RU',
			name: {
				short: 'ru (RU)',
				full: 'Russian (Russia)',
				native: {
					short: 'рус (Рос)',
					full: 'Русский (Россия)'
				}
			},
		},

		{
			code: 'zh',
			name: {
				short: 'zh',
				full: 'Chinese',
				native: {
					short: '吉恩斯',
					full: '吉恩斯'
				}
			},
		},
		{
			code: 'zh-CHS',
			name: {
				short: 'zh-CHS',
				full: 'Chinese (Simplified)',
				native: {
					short: '那么-ES',
					full: '吉恩斯（简体）'
				}
			},
		},
	];

	let _findLangInfo = function (langcode, arr) {
		return _.find(arr, kl => _.lowerCase(kl.code) === _.lowerCase(langcode));
	}

	let def_lang = _.toString(options.defaultLanguage);
	let def_lang_data = _findLangInfo(def_lang, knownLangs);
	if (!def_lang_data) {
		debug(`Unknown value for default language: ${def_lang}.`);
		// WARNING: 'en' should exist in the known languages!!
		def_lang = 'en';
		def_lang_data = _findLangInfo(def_lang, knownLangs);
	} else {
		def_lang = def_lang_data.code;
	}

	let available_lang_codes = options.availableLanguages || [];
	available_lang_codes.push(def_lang);

	let available = _(available_lang_codes)
		.uniq()
		.map(lcode => {
			let lc = _findLangInfo(lcode, knownLangs);

			if (lc) {
				return lc;
			}

			debug(`Unknown language: ${lcode}.`);
			return null;
		})
		.filter()
		.value();

	//debug('defaultLanguage', def_lang);
	//debug('available', available);

	let router = new express.Router();

	let mw_lang_pre_handler = function mw_lang_pre_handler(req, res, next) {
		let lang_code = _.get(req.params, 'lang');
		let is_def_lang;

		if (_.isNil(lang_code)) {
			is_def_lang = true;
			lang_code = def_lang;
		} else {
			is_def_lang = false;
			let cult_code = _.get(req.params, 'cult', '');
			lang_code = lang_code + cult_code;
		}

		let lc = _findLangInfo(lang_code, available);

		if (!lc){
			// TODO : show message to user!

			// TODO: is this solution slow?
			// url-prefix should not be eaten!
			req.url = req.baseUrl + req.path;

			lc = def_lang_data;
		}

		let localeinfo = _.clone(lc);

		localeinfo.defaultLanguage = def_lang;
		localeinfo.available = _.cloneDeep(available);
		localeinfo.usingDefault = is_def_lang;

		localeinfo.routeTo = function(local_path, lang_code) {
			if (_.isNil(lang_code)) {
				lang_code = localeinfo.code;
			}

			// TODO: it could be precalculated
			// validate lang_code:
			let lang = _findLangInfo(lang_code, available);
			if (!lang) {
				lang_code = def_lang;
			} else {
				lang_code = lang.code;
			}

			let p = local_path;
			if (lang_code !== def_lang) {
				p = `/${lang_code}${local_path}`;
			}

			return p;
		}

		// Set up req and res:
		res.locals.lang = localeinfo;
		req.lang = localeinfo;

		if (_.isFunction(options.onLangCodeReady)) {
			options.onLangCodeReady(localeinfo.code, req, res);
		}

		return next();
	};

	router.esu = function(app) {
		app.use('/:lang(\\w{2})?:cult([-_]\\w{2,3})?/', mw_lang_pre_handler, router);
	};

	return router;
}

exports = module.exports = init;
