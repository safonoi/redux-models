'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.normalizeMethods = normalizeMethods;
exports.createMixinsMethods = createMixinsMethods;

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 *
 * @param {*} methods
 * @return {Array}
 */
function normalizeMethods(methods) {
  var filter = function filter(method) {
    return (0, _isFunction2.default)(method) && method.name || (0, _isString2.default)(method);
  };

  if ((0, _isArray2.default)(methods)) {
    return methods.filter(filter);
  }

  return Object.keys(methods || {}).map(function (key) {
    return methods[key];
  }).filter(filter);
}

/**
 *
 * @param {Model} model
 * @return {Object}
 */
function createMixinsMethods(model) {
  return (model.config().mixins || []).filter(function (mixin) {
    return (0, _isFunction2.default)(mixin.createMethods);
  }).reduce(function (mixinsMethods, mixin) {
    var mixinMethods = mixin.createMethods(model);
    return _extends({}, mixinsMethods, _defineProperty({}, mixin.name, normalizeMethods(mixinMethods)));
  }, {});
}