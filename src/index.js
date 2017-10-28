/*
################################################################################
#                                                                              #
# db    db  .8888.  dP     888888b 8888ba   .8888.     d8b   db 888888b d8888P #
# 88    88 d8'  `8b 88     88      88  `8b d8'  `8b    88V8  88 88        88   #
# Y8    8P 88    88 88    a88aaa   88aa8P' 88    88    88 V8 88 88aaa     88   #
# `8b  d8' 88    88 88     88      88  `8b 88    88    88  V888 88        88   #
#  `8bd8'  Y8.  .8P 88     88      88  .88 Y8.  .8P dP 88   V88 88        88   #
#    YP     `888P'  88888P 888888P 888888'  `888P'  88 VP    8P 888888P   dP   #
#                                                                              #
################################################################################

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

'use strict'

const debug           = require('debug')('volebo:express:mw:lang')
const _               = require('lodash')
const express         = require('express')
const deepFreeze      = require('deep-freeze')

const urlBuilder      = require('url').parse

const knownLangs = require('./known-langs')
// dict with langs structures,
//
//	 keys   : ISO 639-x codes (lowercase)
//	 values : looks like this:
//
//	 {
//	 	code: 'en',
//	 	name: {
//	 		short: 'en',
//	 		full: 'English',
//	 		native: {
//	 			short: 'en',
//	 			full: 'English'
//	 		}
//	 	}
//	 }


const LangMw = function(options) {

	const _opt = options || {}

	let defLangCode = _.toString(_opt.defaultLanguage) || 'en'
	const defLangData = knownLangs[_.toLower(defLangCode)]

	if (!defLangData) {
		throw new Error(`Unknown defaultLanguage: [${defLangCode}]`)
	}

	defLangCode = defLangData.code

	const available_lang_codes = _opt.availableLanguages || []
	available_lang_codes.push(defLangCode)

	const _available = _(available_lang_codes)
		.uniq()
		.map(lcode => knownLangs[_.toLower(lcode)])
		.filter()
		.value()
	const availableFrozen = deepFreeze(_available)
	const _availableDict = _.keyBy(availableFrozen, v => _.toLower(v.code))

	const _onLangDetected = _opt.onLangDetected || _.noop

	if (!_.isFunction(_onLangDetected)) {
		throw new TypeError('options.onLangDetected MUST be a function')
	}

	// -------------------------------------------------------------------------
	// OPTIONS PARSED
	// -------------------------------------------------------------------------
	// debug('defaultLanguage', defLangCode)
	// debug('availableFrozen', availableFrozen)

	const mw_lang_pre_handler = function mw_lang_pre_handler(req, res, next) {
		let lang_code = _.get(req.params, 'lang')
		let is_defLangCode

		if (_.isNil(lang_code)) {
			is_defLangCode = true
			lang_code = defLangCode
		} else {
			is_defLangCode = false
			const cult_code = _.get(req.params, 'cult', '')
			lang_code = lang_code + cult_code
		}

		let lc = _availableDict[_.toLower(lang_code)]

		if (!lc){
			// TODO: is this solution slow?

			const _urlPathname = urlBuilder(req.originalUrl).pathname

			// if the `originalUrl` ends with a slash - everything will work
			// just fine.
			// but if the `originalUrl` is something like [/me] or [/vk-ME]
			// than express-url-trimmer will do bad work for us.
			// To avoid this it is enough to add an additional slash at the
			// begging of req.url
			//
			// HACK: but this solution could be considered as a hack!
			//
			const _prependSlash = '/' !== _urlPathname[_urlPathname.length-1]

			const _newUrl = _prependSlash ? '/' + req.originalUrl : req.originalUrl
			debug('use default culture and restore URL to original value [%s]', _newUrl)
			req.url = _newUrl

			lc = defLangData
			is_defLangCode = true
		}

		const localeinfo = {}

		localeinfo.defaultLanguage = defLangCode
		localeinfo.available = availableFrozen
		localeinfo.usingDefault = is_defLangCode

		localeinfo.routeTo = function _routeTo(local_path, explicit_lang_code) {
			if (_.isNil(explicit_lang_code)) {
				explicit_lang_code = localeinfo.code
			}

			// TODO: it could be precalculated
			// validate explicit_lang_code:
			const lang = _availableDict[_.toLower(explicit_lang_code)]
			const effective_lang_code = lang ? lang.code : defLangCode

			let p = local_path
			if (effective_lang_code !== defLangCode) {
				p = `/${effective_lang_code}${local_path}`
			}

			return p
		}

		localeinfo.setLocale = function _setLocale(lc) {

			const new_lc = _availableDict[_.toLower(lc)]

			if (!new_lc) {
				throw new Error(`Locale not found: ${lc}`)
			}

			_.assign(this, new_lc)

			_onLangDetected(new_lc.code, req, res)
		}

		// Set up req and res:
		res.locals.lang = localeinfo
		req.lang = localeinfo

		localeinfo.setLocale(lc.code)

		return next()
	}

	const _router = new express.Router()
	_router.available = availableFrozen
	_router.defaultLanguage = defLangCode

	_router.esu = function(app) {
		//
		app.use('/:lang(\\w{2})?:cult([-_]\\w{2,3})?', mw_lang_pre_handler, _router)
	}

	return _router
}

exports = module.exports = LangMw
