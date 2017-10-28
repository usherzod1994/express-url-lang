'use strict'

const request  = require('supertest')
const path     = require('path')
const express  = require('express')
const _        = require('lodash')
const debug    = require('debug')('volebo-express-mw-lang:test')

const LangMw   = require(path.normalize('../'))


describe(filename2suitename(__filename), function(){

	let app = null
	let langmw = null

	beforeEach(function() {
		app = express()
	})

	afterEach(function() {
		app = null
		langmw = null
	})

	describe('defaultLanguage', function () {

		describe('when bullshit (i.e. xx) is used instead of lang code', () => {

			it('should throw', () => {
				expect(() => {
					langmw = new LangMw({
						defaultLanguage: 'xx',
						availableLanguages: ['en', 'ru'],
					})
				}).throw('Unknown defaultLanguage')
			})
		})

		describe('when not defined', () => {

			it('fallback to "en"', () => {
				langmw = new LangMw({
					availableLanguages: ['en', 'ru'],
				})

				expect(langmw).has.property('defaultLanguage', 'en')
			})
		})
	})

	describe('availableLanguages', function () {

		describe('on unknown or bullshit (i.e. xx, xx-66) languages are present', () => {
			// set up handler
			beforeEach(function() {
				langmw = new LangMw({
					defaultLanguage: 'ru-RU',
					availableLanguages: ['xx', 'en'],
				})
				langmw.esu(app)

				langmw.get('/any-path', (req, res, next) => {

					const av = req.lang.available
					debug('available langs for request:', av)

					const joined_codes = _(av)
						.map('code')
						.uniq()
						.orderBy()
						.reduce((s,v) => s += v + ',', '')

					res.status(200).send(joined_codes)
					next()
				})
			})

			it('should omit unknown', function(done) {
				request(app)
					.get('/any-path')
					.expect(200, 'en,ru-RU,', done)
			})
		})

		describe('when not defined', function () {
			// set up handler
			beforeEach(function() {
				langmw = new LangMw({
					defaultLanguage: 'ru-RU',
				});
				langmw.esu(app)

				langmw.get('/not-available', (req, res, next) => {

					const av = req.lang.available
					debug('available langs for request:', av)

					const joined_codes = _(av)
						.map('code')
						.uniq()
						.orderBy()
						.reduce((s,v) => s += v + ',', '')

					res.status(200).send(joined_codes)
					next()
				})
			})

			it('should be equal to array with one default lang', function(done) {
				request(app)
					.get('/not-available')
					.expect(200, 'ru-RU,', done)
			})
		})
	})


	describe('onLangDetected', function () {

		describe('just test it is working', () => {

			beforeEach(function() {

				langmw = new LangMw({
					availableLanguages: ['ru', 'en'],
					onLangDetected: function(lang_code, req, res) {

						expect(lang_code).exist
						expect(lang_code).is.a('string')
						expect(req).exist
						expect(res).exist

						// request handler will send the value of wasCalled
						// as a web-server response, and this will be an
						// assertions, that method was called
						res.locals.wasCalled = 'aye'
					}
				})
				langmw.esu(app)

				langmw.get('/call/to/on/Lang/Detected', (_unused_req, res, next) => {

					res.status(200).send(res.locals.wasCalled)
					next()
				})
			})

			const testCases = [
				{ path_prefix: '' },
				{ path_prefix: '/ru' }
			]
			testCases.forEach(data => {
				const upath = data.path_prefix + '/call/to/on/Lang/Detected'
				it(upath, function(done) {
					request(app)
						.get(upath)
						.expect(200, 'aye', done)
				})
			})
		})

		describe('when not a function passed', () => {

			const testCases = [
				111,
				true,
			]

			testCases.forEach(tc => {
				it(`should throw on ${tc} (${typeof tc})`, () => {
					expect(() => {
						langmw = new LangMw({
							onLangDetected: tc,
						})
					}).throw('options.onLangDetected MUST be a function')
				})
			})

		})
	})

})
