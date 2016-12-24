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

// TODO : load from ICU
module.exports = [
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
