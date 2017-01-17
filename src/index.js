/*
Language-helper middleware for Express web server.

Copyright (C) 2016-2017 Volebo <dev@volebo.net>
Copyright (C) 2016-2017 Maksim Koryukov <maxkoryukov@gmail.com>

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

// array with land structures, with ISO 639-x codes
// {
// 	code: 'en',
// 	name: {
// 		short: 'en',
// 		full: 'English',
// 		native: {
// 			short: 'en',
// 			full: 'English'
// 		}
// 	}
// }

const knownLangs = require('./known-langs');

const LangMw = function(options) {
	//this._options = options;
	//this._router = new express.Router();

	const _router = new express.Router();

	const _findLangInfo = function (langcode, arr) {
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

	const available_lang_codes = options.availableLanguages || [];
	available_lang_codes.push(def_lang);

	const available = _(available_lang_codes)
		.uniq()
		.map(lcode => {
			const lc = _findLangInfo(lcode, knownLangs);

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

	//let router = new express.Router();

	const mw_lang_pre_handler = function mw_lang_pre_handler(req, res, next) {
		let lang_code = _.get(req.params, 'lang');
		let is_def_lang;

		if (_.isNil(lang_code)) {
			is_def_lang = true;
			lang_code = def_lang;
		} else {
			is_def_lang = false;
			const cult_code = _.get(req.params, 'cult', '');
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

		const localeinfo = {};

		localeinfo.defaultLanguage = def_lang;
		localeinfo.available = _.cloneDeep(available);
		localeinfo.usingDefault = is_def_lang;

		localeinfo.routeTo = function _routeTo(local_path, explicit_lang_code) {
			if (_.isNil(explicit_lang_code)) {
				explicit_lang_code = localeinfo.code;
			}

			// TODO: it could be precalculated
			// validate explicit_lang_code:
			const lang = _findLangInfo(explicit_lang_code, available);
			if (!lang) {
				explicit_lang_code = def_lang;
			} else {
				explicit_lang_code = lang.code;
			}

			let p = local_path;
			if (explicit_lang_code !== def_lang) {
				p = `/${explicit_lang_code}${local_path}`;
			}

			return p;
		}

		localeinfo.setLocale = function _setLocale(new_lang_code) {

			const new_lc = _findLangInfo(new_lang_code, available);

			if (!new_lc) {
				throw new Error(`Locale not found: ${new_lang_code}`);
			}

			_.assign(this, new_lc);

			if (_.isFunction(options.onLangCodeReady)) {
				options.onLangCodeReady(new_lc.code, req, res);
			}
		}

		// Set up req and res:
		res.locals.lang = localeinfo;
		req.lang = localeinfo;

		localeinfo.setLocale(lc.code);

		return next();
	};

	_router.esu = function(app) {
		app.use('/:lang(\\w{2})?:cult([-_]\\w{2,3})?/', mw_lang_pre_handler, this);
	}

	return _router;
}

exports = module.exports = LangMw;
