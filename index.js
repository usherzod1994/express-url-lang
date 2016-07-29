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

const debug           = require('debug')('volebonet:express:mw:lang');
const _               = require('lodash');
const express         = require('express');

let init = function(options) {

	const knownLangs = [
		{
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
	];

	let _findLangInfo = function (langcode) {
		return _.find(knownLangs, kl => _.lowerCase(kl.code) === _.lowerCase(langcode));
	}

	let def_lang = _.toString(options.defaultLanguage);
	let lc = _findLangInfo(def_lang);
	if (!lc) {
		debug(`Unknown value for default language: ${def_lang}.`);
		// WARNING: 'en' should exist in the known languages!!
		def_lang = 'en';
	} else {
		def_lang = lc.code;
	}

	let available_lang_codes = options.availableLanguages || [];
	available_lang_codes.push(def_lang);

	let available = _(available_lang_codes)
		.uniq()
		.map(lcode => {
			let lc = _findLangInfo(lcode);

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

	let router = express.Router();

	let lang_parser = function(req, res, next) {
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

		let lc = _findLangInfo(lang_code);

		if (!lc){
			// IMPORTANT: if culture is not allowed - redirect to root!!!
			// TODO : show message to user!
			// TODO : redirect to URL without culture settings (means - default culture)

			// #unknowncult
			return res.redirect('/');
		}

		let localeinfo = _.clone(lc);

		// TODO : not necessary
		lc = null;

		localeinfo.defaultLanguage = def_lang;
		localeinfo.available = _.cloneDeep(available);
		localeinfo.usingDefault = is_def_lang;

		localeinfo.routeTo = function(local_path, lang_code) {
			if (_.isNil(lang_code)) {
				// TODO: check closure
				lang_code = localeinfo.code;
			}

			// TODO: it could be precalculated
			// validate lang_code:
			let lang = _findLangInfo(lang_code);
			if (!lang) {
				lang_code = def_lang;
			} else {
				lang_code = lang.code;
			};

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
		app.use('/:lang(\\w{2})?:cult([-_]\\w{2})?/', lang_parser, router);
	};

	return router;
}

exports = module.exports = init;
