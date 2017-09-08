'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.createReducer = createReducer;

var _isEqual = require('lodash/isEqual');

var _isEqual2 = _interopRequireDefault(_isEqual);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _snakeCase = require('lodash/snakeCase');

var _snakeCase2 = _interopRequireDefault(_snakeCase);

var _actions = require('./actions');

var _methods = require('./methods');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * @param {Model} model
 * @param {String|Function} method
 * @return {Function}
 */
function createDefaultMethodReducer(model, method) {
  if (!(0, _isFunction2.default)(method)) {
    return function (state, action) {
      return action;
    };
  }

  var resultInitialState = {
    params: null,
    result: null,
    requesting: false,
    requested: false,
    error: null
  };

  var initialState = [];

  var _methodNameToTypes = (0, _actions.methodNameToTypes)(model.config().name, method.name || method),
      _methodNameToTypes2 = _slicedToArray(_methodNameToTypes, 3),
      START = _methodNameToTypes2[0],
      SUCCESS = _methodNameToTypes2[1],
      ERROR = _methodNameToTypes2[2];

  function reducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    if (![START, SUCCESS, ERROR].includes(action.type)) {
      return state;
    }

    var error = action.type === ERROR ? action.meta : null;
    var params = action.payload || null;
    var requesting = action.type === START;
    var requested = action.type === SUCCESS || action.type === ERROR;
    var index = state.findIndex(function (row) {
      return (0, _isEqual2.default)(row.params, params);
    });

    if (index === -1) {
      return [].concat(_toConsumableArray(state), [_extends({}, resultInitialState, { params: params, error: error, requesting: requesting, requested: requested })]);
    }

    var result = action.type === START ? state[index].result : action.type !== ERROR ? action.meta || null : null;

    return [].concat(_toConsumableArray(state.slice(0, index)), [_extends({}, state[index], { result: result, error: error, requesting: requesting, requested: true })], _toConsumableArray(state.slice(index + 1, state.length)));
  }

  reducer.isDefault = true;

  return reducer;
}

function createMethodReducer(model, method) {
  var definedReducers = model.config().reducers || {};

  var _methodNameToTypes3 = (0, _actions.methodNameToTypes)(model.config().name, method.name || method),
      _methodNameToTypes4 = _slicedToArray(_methodNameToTypes3, 3),
      START = _methodNameToTypes4[0],
      SUCCESS = _methodNameToTypes4[1],
      ERROR = _methodNameToTypes4[2];

  return (0, _isFunction2.default)(definedReducers[method.name || method]) ? definedReducers[method.name || method]({ START: START, SUCCESS: SUCCESS, ERROR: ERROR }) : createDefaultMethodReducer(model, method);
}

/**
 * @param {Model} model
 * @param {Function} combineReducers
 * @return {Function}
 */
function createReducer(model, combineReducers) {
  var methods = (0, _methods.normalizeMethods)(model.config().methods || {});

  var reducers = methods.reduce(function (reducers, method) {
    return _extends({}, reducers, _defineProperty({}, method.name || method, createMethodReducer(model, method)));
  }, {});

  if ((0, _isFunction2.default)(model.config().reducer)) {
    reducers.model = model.config().reducer((0, _actions.actionTypes)(model.config().name, Object.keys(model.actions)));
  }

  var mixinsReducers = (model.config().mixins || []).reduce(function (mixinsReducers, mixin) {
    if ((0, _isFunction2.default)(mixin.createReducer)) {
      var types = (0, _actions.actionTypes)(model.config().name, model._mixinsMethods[mixin.name] || []);
      return _extends({}, mixinsReducers, _defineProperty({}, mixin.name, mixin.createReducer(model, types, combineReducers)));
    }

    return _extends({}, mixinsReducers, (model._mixinsMethods[mixin.name] || []).filter(function (method) {
      return !reducers[method.name || method];
    }).reduce(function (mixinsReducers, method) {
      return _extends({}, mixinsReducers, _defineProperty({}, method.name || method, createMethodReducer(model, method)));
    }, {}));
  }, {});

  return combineReducers(_extends({}, mixinsReducers, reducers));
}