'use strict'

const request  = require('supertest')
const express  = require('express')
const debug    = require('debug')('volebo-express-mw-lang:test')

const LangMw = require(packageRoot)

describe(filename2suitename(__filename), function(){

	describe('Expect "lang::default" response from appropriate handler', () => {

		let app
		let langmw

		beforeEach(() => {
			app = express()
			langmw = new LangMw({
				defaultLanguage: 'ru',
				availableLanguages: ['en', 'ru', 'zh-CHS'],
			})

			langmw.esu(app)

			function _hlpr(req, res, prefix) {
				const str = `${prefix}::${req.lang.code}::${req.lang.defaultLanguage}`
				res.status(200).send(str)
			}

			// attach different handlers
			app.get('/appGet', (req, res, next) => {
				_hlpr(req, res, 'app')
				next()
			})

			app.get('/ap', (req, res, next) => {
				_hlpr(req, res, 'apTwo')
				next()
			})

			langmw.get('/mwGet', (req, res, next) => {
				_hlpr(req, res, 'mw')
				next()
			})

			langmw.get('/dd', (req, res, next) => {
				_hlpr(req, res, 'mw/twoChar')
				next()
			})

			app.get('/pa', (req, res, next) => {
				_hlpr(req, res, 'paTwo')
				next()
			})

			app.get('/appGetAfterMw/1', (req, res, next) => {
				_hlpr(req, res, 'app/after')
				next()
			})

			const router = new express.Router()
			router.get('/me', (req, res, next) => {
				_hlpr(req, res, 'rtGet')
				next()
			})

			langmw.use(router)

			const routerSlash = new express.Router()
			router.get('/ss/', (req, res, next) => {
				_hlpr(req, res, 'router/two/slashed')
				next()
			})

			langmw.use(routerSlash)
		})

		describe('Valid URLs should have status 200', () => {
			const testCases = [
				{url: '/appGet?x=123',    res: 'app::ru::ru',        name: 'app-get before MW'},
				{url: '/appGetAfterMw/1', res: 'app/after::ru::ru',     name: 'app-get after MW'},

				// TWO letter routes on APP doesn't work...
				//{url: '/ap',              res: 'apTwo::ru::ru',     name: 'app-get two letter URL'},
				//{url: '/pa?f=no',         res: 'paTwo::ru::ru',     name: 'app-get connected after MW (two letter URL)'},

				{url: '/mwGet',           res: 'mw::ru::ru',     name: 'mw-get NO lang'},
				{url: '/en/mwGet?q=far',  res: 'mw::en::ru',     name: 'mw-get lang [en]'},
				{url: '/zh-CHS/mwGet',    res: 'mw::zh-CHS::ru', name: 'mw-get lang [zh-CHS]'},
				{url: '/zH-cHs/mwGet',    res: 'mw::zh-CHS::ru', name: 'mw-get lang [zh-chs] (ignore case in URL)'},
				{url: '/ZH-chs/mwGet',    res: 'mw::zh-CHS::ru', name: 'mw-get lang [zh-chs] (correct case in resp)'},

				{url: '/dd',              res: 'mw/twoChar::ru::ru',     name: 'mw-get (two char route) NO lang'},
				{url: '/dd/',             res: 'mw/twoChar::ru::ru',     name: 'mw-get (two char route) NO lang with trailing slash'},
				{url: '/en/dd?q=far',     res: 'mw/twoChar::en::ru',     name: 'mw-get (two char route) lang [en]'},
				{url: '/zh-CHS/dd',       res: 'mw/twoChar::zh-CHS::ru', name: 'mw-get (two char route) lang [zh-CHS]'},
				{url: '/zH-cHs/dd',       res: 'mw/twoChar::zh-CHS::ru', name: 'mw-get (two char route) lang [zh-chs] (ignore case in URL)'},
				{url: '/ZH-chs/dd',       res: 'mw/twoChar::zh-CHS::ru', name: 'mw-get (two char route) lang [zh-chs] (correct case in resp)'},

				// should go to router
				{url: '/me?a=111',        res: 'rtGet::ru::ru', name: 'router-get without lang'},
				{url: '/me/?a=112',       res: 'rtGet::ru::ru', name: 'router-get without lang with trailing slash'},
				{url: '/ru/me?uuu',       res: 'rtGet::ru::ru', name: 'router-get with explicit lang (equals to default)'},
				{url: '/en/me#1000',      res: 'rtGet::en::ru', name: 'router-get with explicit lang'},

				// should go to router (slashed)
				{url: '/ss?m=01',        res: 'router/two/slashed::ru::ru', name: 'router-get without lang'},
			]

			testCases.forEach(tc => {
				describe(`${tc.name}`, () => {
					it(`${tc.url} => [${tc.res}]`, function(done) {
						request(app)
							.get(tc.url)
							.expect(200, tc.res, done)
					})
				})
			})
		})

		describe('Wrong URL', () => {
			const testCases = [
				{url: '/zh/appGet',     name: 'app itself does not handle lang'},
				{url: '/zh-CHS/appGet', name: 'app itself does not handle lang'},
				{url: '/zh/mwGet',      name: 'only full lang [zh-CHS] is available in MW'},

				{url: '/NO/mwGet',      name: '[NO] is not a language code and there is no handler'},

				{url: '/me/me?a=113',   name: 'ignore duplicate lang-like paths'},
			]

			testCases.forEach(tc => {
				describe(`${tc.name}`, () => {
					it(`should return 404: ${tc.url}`, function(done) {
						request(app)
							.get(tc.url)
							.expect(404, done)
					})
				})
			})
		})
	})


	describe('on should detect explicit lang code (from available list)', function () {

		const app = express()
		let langmw = {}
		const deflang = 'en'

		// set up handler
		before(function() {

			langmw = new LangMw({
				defaultLanguage: deflang,
				availableLanguages: ['en', 'ru', 'zh-CHS'],
			})
			langmw.esu(app)

			langmw.get('/code', (req, res, next) => {
				res.status(200).send(req.lang.code);
				next();
			})
		})

		const testCases = [
			// to check default twice
			{ path: '/code', resp: 'en' },

			{ path: '/ru/code', resp: 'ru' },
			{ path: '/en/code', resp: 'en' },
			{ path: '/zh-chs/code', resp: 'zh-CHS' },
		]
		testCases.forEach(tc => {

			it(tc.path, function(done) {
				request(app)
					.get(tc.path)
					.expect(200, tc.resp, done);
			})
		})
	})

	describe('should return default lang code', function() {
		const app = express()
		let langmw = {}
		const deflang = 'en'

		// set up handler
		before(function() {
			langmw = new LangMw({
				defaultLanguage: deflang,
				availableLanguages: ['en', 'ru', 'zh-CHS'],
			})
			langmw.esu(app)

			langmw.get('/default', (req, res, next) => {
				res.status(200).send(req.lang.defaultLanguage)
				next();
			});
		});

		[
			{ path: '/default' },
			{ path: '/ru/default' },
			{ path: '/en/default' },
			{ path: '/zh-chs/default' },
		].forEach( data => {

			it(data.path, function(done) {
				request(app)
					.get(data.path)
					.expect(200, deflang, done)
			})
		})
	})

	describe('should handle GET/POST/PATCH... on unknown language/culture', function() {

		const app = express()
		let langmw = {}
		const deflang = 'en'

		const RESP_NO_LANG = 'looks like a lang'
		const RESP_VK = 'vk response'

		const PATH_NO_LANG = '/xx-YY/looks-like-lang-but-no'
		const PATH_VK = '/vk/auth'
		const PATH_VK_NO = '/vk/no-such-page'

		before(function() {
			langmw = new LangMw({
				defaultLanguage: deflang,
				availableLanguages: ['en', 'ru', 'zh-CHS'],
			})
			langmw.esu(app)

			// appending next middlewares
			langmw.get(PATH_NO_LANG, (req, res, next) => {
				debug(req.lang.code)
				res.status(200).send(RESP_NO_LANG)
				next()
			})

			langmw.post(PATH_VK, (req, res, next) => {
				debug(req.lang.code)
				res.status(200).send(RESP_VK)
				next()
			})
		})

		it(PATH_NO_LANG + ' and should not eat the prefix', function(done) {
			request(app)
				.get(PATH_NO_LANG)
				.expect(200, RESP_NO_LANG, done)
		})

		const urlpaths = [
			PATH_VK,
			'/ru' + PATH_VK,
			'/en' + PATH_VK
		]
		urlpaths.forEach(function(urlpath){
			it(urlpath + ' and should not eat the prefix', function(done) {
				request(app)
					.post(urlpath)
					.expect(200, RESP_VK, done)
			})
		})

		const urlpaths2 = [
			PATH_VK_NO,
			'/ru' + PATH_VK_NO,
			'/en' + PATH_VK_NO
		]
		urlpaths2.forEach(function(urlpath){
			it(urlpath, function(done) {
				request(app)
					.post(urlpath)
					.expect(404, done)
			})
		})

	})

	// behaviour changed, see https://github.com/Volebo/express-mw-lang/issues/8
	describe('should RUN NEXT MW for unavailable lang NOT TRIMMING the url', function () {
		const app = express()
		let langmw = {}
		const deflang = 'en'

		// set up handler
		before(function() {
			langmw = new LangMw({
				defaultLanguage: deflang,
				availableLanguages: ['en', 'ru', 'zh-CHS'],
			})
			langmw.esu(app)

			// the MW will not eat the LANG PREFIX (because it is not
			// available), so we should add handler for the full path:
			langmw.get('/ru-ru/code-def-unavail-lang', (req, res, next) => {
				res.status(200).send(req.lang.code)
				next()
			})

			langmw.get('/zh/code-def-unavail-lang', (req, res, next) => {
				res.status(200).send(req.lang.code)
				next()
			})

		})

		const testCases1 = [
			{ path: '/ru-ru/code-def-unavail-lang' },
			{ path: '/ru-RU/code-def-unavail-lang' },
			{ path: '/zh/code-def-unavail-lang' },
		]

		testCases1.forEach( tc => {

			it(tc.path, function(done) {
				request(app)
					.get(tc.path)
					.expect(200, deflang, done)
			})
		})


		const testCases2 = [
			{ path: '/ru-ru/code-unavail-lang-404' },
			{ path: '/ru-RU/code-unavail-lang-404' },
			{ path: '/zh/code-unavail-lang-404' },
		]
		testCases2.forEach( tc => {

			it(tc.path, function(done) {
				request(app)
					.get(tc.path)
					.expect(404, done);
			});
		});
	});

});
