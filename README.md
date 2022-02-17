# express-mw-lang

[![Build Status](https://travis-ci.org/volebo/express-mw-lang.svg?branch=master)](https://travis-ci.org/volebo/express-mw-lang)
[![codecov](https://codecov.io/gh/volebo/express-mw-lang/branch/master/graph/badge.svg)](https://codecov.io/gh/volebo/express-mw-lang)
[![bitHound Overall Score](https://www.bithound.io/github/volebo/express-mw-lang/badges/score.svg)](https://www.bithound.io/github/volebo/express-mw-lang)
[![bitHound Dependencies](https://www.bithound.io/github/volebo/express-mw-lang/badges/dependencies.svg)](https://www.bithound.io/github/volebo/express-mw-lang/master/dependencies/npm)
[![npm version](https://img.shields.io/npm/v/express-mw-lang.svg)](https://www.npmjs.com/package/express-mw-lang)
[![npm downloads](https://img.shields.io/npm/dm/express-mw-lang.svg)](https://www.npmjs.com/package/express-mw-lang)

Localization helper for Express web server.

Cuts off the **language** part from the path, and allow to use simple routes!

This middleware helps to determine the language, and handles urls of incoming requests for next middlewares. `express-mw-lang` does **not** use `Accept-Language` (but it is a good idea, to use the value of this HTTP-Header on first contact with the user, to predict his language).

To determine the language `express-mw-lang` uses only **URL** of the request. Expected format of the URL:

```
schema://host/< LANG >/path?params
```

Sample URL, handled in French:

```
https://example.net/fr/article/1
```

As you could see - `lang` is a first part of the path, and could be ommited, in this case the **default** language will be used.

Actually, `express-mw-lang` **acts and is** an [express-router](http://expressjs.com/en/4x/api.html#router). The best practice is appending **your** router/routes (`use`/`route`/`get`/`post`/...) to the `express-mw-lang`, instead of habitual way with the Express-application itself.

See the [Example section](#examples) for more details.

[Contributions are welcome][contributing]!

## Usage

Install:

```bash
$ npm install express-url-lang
```

Configure and use in the `app.js`:

```javascript
// ...
var langGen = require('express-url-lang');
var app = express();

// ...

let langmw = langGen();
langmw.esu(app);

```

## Example

```javascript
"use strict";

var express         = require('express');
var logger          = require('morgan');          // just for example, not required
var bodyParser      = require('body-parser');     // just for example, not required
var langGen         = require('express-url-lang');

var app = express();

app.use(logger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// STEP 1: CREATING the middleware instance with options:
var langmw = langGen({
	defaultLanguage: 'en',
	availableLanguages: ['en', 'ru'],
});
// STEP 2: append middleware to application
// ( `esu` - is a reverse of `use`, because app and mw are swapped):
langmw.esu(app);


// appending main routes to the app (through lang-mw):
var router = express.Router();
router
	.route('/home')
	.get(function(req, res, next){
		res.status(200).send('Hello [' + req.lang.code + ']');
	});
// STEP 3: append your routes to lang-mw
langmw.use(router);

app.listen(3000, function() {
	console.log('Example app listening on port 3000!');
});

// http://192.168.1.68:3000/en/home
// -> Hello [en]
// http://192.168.1.68:3000/ru/home
// -> Hello [ru]
// http://192.168.1.68:3000/home
// -> Hello [en]
```

## Options

```javascript
const options = {
	defaultLanguage: 'en',
	availableLanguages: [],
	onLangDetected: function(langCode, req, res) {}
};
```

#### `defaultLanguage`

Default: **`'en'`**, _string ([ISO 639](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes))_.

Default language

#### `availableLanguages`

Default: **`[]`**, _array of strings (each string - ISO 639 code)_.

Languages, which will be recognized by middleware.

1. Default language is always available
2. For requests to unavailable language the response will contain redirect to the `/` of the site.

#### `onLangDetected`

Defalt: **`null`**, _function(langCode, req, res)_

Callback, called when the lang is determined. Convenient place to setup the locale for `momentjs` or choosen i18n library.

##### Example

```javascript

var i18n            = require("i18n")
var moment          = require('moment')

// ...

let options = {
	defaultLanguage: 'en',
	availableLanguages: ['en', 'ru'],
	onLangDetected: function(lang_code, req, res) {

		i18n.setLocale(lang_code)
		i18n.setLocale(req, lang_code)
		i18n.setLocale(res, lang_code)

		moment.locale(lang_code)
	}
}
```

## `req` and `res` extensions

This middleware extends the `req` and `res` objects with a `lang` property, so extensions are:

1. `req.lang`
2. `res.locals.lang`

Further - description of the `lang` object.

#### `defaultLanguage`

_string_, default language, taken from options.

#### `available`

_array_ of available options. Each item is an object with `code`-property (string, ISO 639)

#### `usingDefault`

_bool_ indicates, that request is handled using default language (probably, there was an error, when the MW tried to determine the required language of the request).

#### `routeTo`

_function(local_path, lang_code)_ , this function could help you to build paths to other pages of the site (taking the current language into account).

Notes about argument `lang_code`:

1. it is optional
2. UNKNOWN/UNAVAILABLE lang_code - cause to use the default lang
3. NULL lang_code - cause to use CURRENT lang (determined by MW from URL)
4. EMPTY ('') lang_code - cause to use default lang!!

## Contributing

You could take part in the development process, just follow this [guideline][contributing].

## License

Please, read the [`LICENSE`](LICENSE) file in the root of the repository (or downloaded package).

[contributing]: CONTRIBUTING.md
