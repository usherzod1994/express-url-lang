'use strict'

const chai            = require('chai')
const mh              = require('@volebo/mocha-helpers')

global.expect = chai.expect
global.filename2suitename = mh.filename2suitename

/* ROOT of the package */
global.packageRoot = process.cwd()
