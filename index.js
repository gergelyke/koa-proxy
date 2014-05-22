'use strict';

var join = require('url').resolve;
var iconv = require('iconv-lite');
var request = require('koa-request');

module.exports = function(options) {
  options || (options = {});


  if (!(options.host || options.map || options.url)) {
    throw new Error('miss options');
  }

  var scripts = options.scripts;
  var styles = options.styles;
  var toAppend = '';


  if (scripts) {
    scripts.forEach(function (script) {
      toAppend += buildScriptTag(script);
    });
  }


  if (styles) {
    styles.forEach(function (style) {
      toAppend += buildLinkTag(style);
    });
  }

  return function* proxy(next) {
    var url = resolve(this.path, options);

    // don't match
    if (!url) {
      return yield* next;
    }

    var opt = {
      url: url + '?' + this.querystring,
      header: this.header,
      encoding: null
    };
    var res = yield request(opt);

    for (var name in res.headers) {
      this.set(name, res.headers[name]);
    }

    if (options.encoding === 'gbk') {
      this.body = iconv.decode(res.body, 'gbk');
      return;
    }

    this.body = res.body;
    this.body += toAppend;
  };
};


function resolve(path, options) {
  var url = options.url;
  if (url) {
    if (!/^http/.test(url)) {
      url = options.host ? join(options.host, url) : null;
    }
    return ignoreQuery(url);
  }

  if (options.map && options.map[path]) {
    path = ignoreQuery(options.map[path]);
  }

  return options.host ? join(options.host, path) : null;
}

function ignoreQuery(url) {
  return url ? url.split('?')[0] : null;
}

function buildScriptTag (url) {
  return '<script src="' + url + '"></script>';
}

function buildLinkTag (url) {
  return '<link rel="' + url + '" type="text/css"/>';
}
