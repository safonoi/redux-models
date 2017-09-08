'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.createSelectors = createSelectors;

var _isEqual = require('lodash/isEqual');

var _isEqual2 = _interopRequireDefault(_isEqual);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _difference = require('lodash/difference');

var _difference2 = _interopRequireDefault(_difference);

var _omit = require('lodash/omit');

var _omit2 = _interopRequireDefault(_omit);

var _mapValues = require('lodash/mapValues');

var _mapValues2 = _interopRequireDefault(_mapValues);

var _methods = require('./methods');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var globalState = {};

/**
 * @param {Boolean} hasCustomReducer
 * @return {Function}
 */
function createDefaultMethodSelector(hasCustomReducer) {
  if (hasCustomReducer) {
    return function () {
      return this.getMethodState();
    };
  }

  return function () {
    for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }

    return (this.getMethodState() || []).find(function (row) {
      return (0, _isEqual2.default)(params, row.params);
    }) || { result: null, requesting: false, requested: false };
  };
}

function createMethodSelector(model, method, hasCustomReducer) {
  var definedSelectors = model.config().selectors || {};
  var definedReducers = model.config().reducers || {};

  return definedSelectors[method.name || method] || createDefaultMethodSelector(hasCustomReducer || !!definedReducers[method.name || method]);
}

/**
 * @param {Model} model
 * @param {Function} stateToModel
 * @return {Object}
 */
function createSelectors(model, stateToModel) {
  var definedSelectors = model.config().selectors || {};

  function modelState() {
    return stateToModel(globalState) || {};
  }

  var binder = {
    getState: function getState() {
      return globalState;
    },
    getModelState: function getModelState() {
      return modelState();
    },
    model: model
  };

  var modelSelectors = (0, _methods.normalizeMethods)(model.config().methods || []).reduce(function (selectors, method) {
    var _extends2;

    var methodName = method.name || method;
    var selector = createMethodSelector(model, method).bind(_extends({}, binder, { getMethodState: function getMethodState() {
        return modelState()[methodName];
      }, name: methodName }));

    return _extends({}, selectors, (_extends2 = {}, _defineProperty(_extends2, methodName, selector), _defineProperty(_extends2, methodName + 'Result', function undefined() {
      return (selector.apply(undefined, arguments) || {}).result;
    }), _extends2));
  }, {});

  (0, _difference2.default)(Object.keys(definedSelectors), Object.keys(modelSelectors)).forEach(function (selectorName) {
    modelSelectors[selectorName] = definedSelectors[selectorName].bind(binder);
  });

  var mixinsSelectors = (model.config().mixins || []).reduce(function (mixinsSelectors, mixin) {
    var mixinName = mixin.name;

    if ((0, _isFunction2.default)(mixin.createSelectors)) {
      return _extends({}, mixinsSelectors, (0, _mapValues2.default)((0, _omit2.default)(mixin.createSelectors(model) || {}, Object.keys(modelSelectors)), function (selector) {
        return selector.bind(_extends({}, binder, { name: selector.name,
          getMethodState: function getMethodState() {
            return (0, _isFunction2.default)(mixin.createReducer) ? modelState()[mixinName][selector.name] : modelState()[selector.name];
          },
          getMixinState: function getMixinState() {
            return modelState()[mixinName];
          }
        }));
      }));
    }

    return _extends({}, mixinsSelectors, (model._mixinsMethods[mixinName] || []).filter(function (method) {
      return !modelSelectors[method.name || method];
    }).reduce(function (mixinsSelectors, method) {
      var _extends3;

      var methodName = method.name || method;
      var selector = createMethodSelector(model, method, (0, _isFunction2.default)(mixin.createReducer)).bind(_extends({}, binder, { name: methodName,
        getMethodState: function getMethodState() {
          return (0, _isFunction2.default)(mixin.createReducer) ? modelState()[mixinName] : modelState()[methodName];
        },
        getMixinState: function getMixinState() {
          return modelState()[mixinName];
        }
      }));

      return _extends({}, mixinsSelectors, (_extends3 = {}, _defineProperty(_extends3, methodName, selector), _defineProperty(_extends3, methodName + 'Result', function undefined() {
        return (selector.apply(undefined, arguments) || {}).result;
      }), _extends3));
    }, {}));
  }, {});

  var allSelectors = _extends({}, modelSelectors, mixinsSelectors);

  return function (state) {
    globalState = state;
    return allSelectors;
  };
}