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

const moment          = require('moment');
//var i18n              = require("i18n")

const knownLangs = {
	'en': {
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

	'ru': {
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
	'ru-RU': {
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
};

let init = function(options) {

	let def_lang = options.defaultLanguage || 'en';
	let def_cult = options.defaultCulture || null;
	let url_regex = '/:lang(\\w\\w)?:cult([-_]\\w\\w)?/';
	let available_lang =

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
		let lc = router._normalizeCultureAndLang(req.params.lang, req.params.cult);

		if (! (lc.elang in cultures)){
			// IMPORTANT: if culture is not allowed - redirect to root!!!
			// TODO : show message to user!

			// #unknowncult
			return res.redirect('/');
		}

		lc.info = cultures[lc.elang];
		// normalize
		lc.elang = lc.info.code;

		lc.available = _(cultures)
			.values()
			.map(x => _.extend({}, x, { href : '/' + x.code } ))
			.value();

// ---------------------------------------------------
// culture validated through DB too
// ---------------------------------------------------

		lc.href = lc.lang || '';
		if (lc.cult) {
			lc.href = lc.href + '-' + lc.cult;
		}
		if (lc.href){
			lc.href = '/' + lc.href;
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

	router._normalizeCultureAndLang = function _normalizeCultureAndLang(lang, cult){
		let tworeg = /[a-z]{2}/i;

		var l = {
			lang : lang || null,
			cult : cult || null,
		};

		if (l.lang) {
			l.lang = _.toLower(tworeg.exec(l.lang)[0]);
			l.elang = l.lang;
		} else {
			l.elang = this.default_language
		}

		if (l.cult){
			l.cult = _.toUpper(tworeg.exec(l.cult)[0]);
			l.ecult = l.cult;
		} else {
			if (!l.lang){
				l.ecult = this.default_culture;
			}
		}

		return l;
	};


	return router;
}

exports = module.exports = init;
