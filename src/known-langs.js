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

const _ = require('lodash')

// TODO : load from ICU
const _langs = [
	{
		// NOTE: do not remove the EN locale, it is library default!
		// https://en.wikipedia.org/wiki/IETF_language_tag
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
		code: 'en-GB',
		name: {
			short: 'en (GB)',
			full: 'English (GB)',
			native: {
				short: 'en (GB)',
				full: 'English (GB)'
			}
		},
	},

	{
		code: 'en-US',
		name: {
			short: 'en (US)',
			full: 'English (US)',
			native: {
				short: 'en (US)',
				full: 'English (US)'
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
]

const _dic = _.keyBy(_langs, v => v.code.toLowerCase())

module.exports = _dic
