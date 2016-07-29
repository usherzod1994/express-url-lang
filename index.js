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

//const moment          = require('moment');
//var i18n              = require("i18n")

let init = function(options) {

	const knownLangs = [
		{
			code: 'en',
			name: {
				short: 'en',
				full: 'English'
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

	let def_lang = options.defaultLanguage;
	let lc = _findLangInfo(def_lang);
	if (!lc) {
		debug(`Unknown value for default language: ${lcode}.`);
		// WARNING: 'en' should exist in the known languages!!
		def_lang = 'en';
	} else {
		def_lang = lc.code;
	}

	let available_lang_codes = options.availableLanguages || [];
	available_lang_codes.push(def_lang);

	let available = [];
	available_lang_codes = _(available_lang_codes)
		.uniq()
		.map(lcode => {
			let lc = _findLangInfo(lcode);

			if (lc) {
				available.push(lc);
				return lc.code;
			} else {
				debug(`Unknown language: ${lcode}.`);
				return null;
			}
		})
		.filter()
		.values();

	let url_wildcard = '/:lang(\\w\\w(?:[-_]\\w\\w))?/';

	/*
	=====================
	Handlers
	*/
	mw.handler = function(req, res, next) {

		// TODO : fix this , learn more about express, and remove this IF.
		if (res.headersSent){
			// We are after redirect from unknown languge ( checkout #unknowncult in this file)
			return;
		}

		debug('CURRENT LOCALE:', req.lang.lang, req.lang.elang, ` href=[${req.lang.href}]`, 'other locales:', _.size(req.lang.available));

		return next();
	};

	router.beforeMe = function(req, res, next){
		let lc = _findLangInfo(req.params.lang);

		if (! lc){
			// IMPORTANT: if culture is not allowed - redirect to root!!!
			// TODO : show message to user!
			// TODO : redirect to URL without culture settings (means - default culture)

			// #unknowncult
			return res.redirect('/');
		}

		let localeinfo = _.clone(lc);
		// TODO : not necessary
		lc = null;

		localeinfo.available = _.deepClone(available);

		localeinfo.href = localeinfo.lang || '';

		if (localeinfo.href){
			localeinfo.href = '/' + localeinfo.href;
		}

		res.locals.lang = lc;
		req.lang = lc;

		//i18n.setLocale(lc.elang + '-' + lc.ecult);
		i18n.setLocale(lc.elang);

		i18n.setLocale(req, lc.elang);
		i18n.setLocale(res, lc.elang);

		let oldrender = res.render;
		res.render = function render(vn, opt){
			if (opt){
				if (_.isObject(opt)){
					_.set(opt, 'helpers.__', res.locals.__);
				} else {
					logger.warn('unable to setup translation helper: __ for an request:', req.originalUrl);
				}
			} else {
				opt = { helpers: { __ : res.locals.__ } };
			}

			arguments[1] = opt;
			return oldrender.apply(this, arguments);
		}

		moment.locale(lc.elang);

		return next();
	};

	return router;
}

exports = module.exports = init;
