'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.methodNameToTypes = methodNameToTypes;
exports.actionTypes = actionTypes;
exports.createActionCreator = createActionCreator;
exports.createActions = createActions;

var _reduxActions = require('redux-actions');

var _snakeCase = require('lodash/snakeCase');

var _snakeCase2 = _interopRequireDefault(_snakeCase);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _values = require('lodash/values');

var _values2 = _interopRequireDefault(_values);

var _flatten = require('lodash/flatten');

var _flatten2 = _interopRequireDefault(_flatten);

var _methods = require('./methods');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var typePrefix = '@@redux-models/';

function methodNameToTypes(modelName, methodName) {
  var type = '' + typePrefix + (0, _snakeCase2.default)(modelName).toUpperCase() + '/' + (0, _snakeCase2.default)(methodName).toUpperCase();
  return [type + '_START', type + '_SUCCESS', type + '_ERROR'];
}

function actionTypes(modelName, methods) {
  return methods.reduce(function (types, method) {
    var methodName = method.name || method;

    var _methodNameToTypes = methodNameToTypes(modelName, methodName),
        _methodNameToTypes2 = _slicedToArray(_methodNameToTypes, 3),
        start = _methodNameToTypes2[0],
        success = _methodNameToTypes2[1],
        error = _methodNameToTypes2[2];

    types[(0, _snakeCase2.default)(methodName + 'Start').toUpperCase()] = start;
    types[(0, _snakeCase2.default)('' + methodName).toUpperCase()] = success;
    types[(0, _snakeCase2.default)(methodName + 'Success').toUpperCase()] = success;
    types[(0, _snakeCase2.default)(methodName + 'Error').toUpperCase()] = error;
    return types;
  }, {});
}

function createActionCreator(model, method) {
  var modelConfig = model.config();

  var _methodNameToTypes3 = methodNameToTypes(modelConfig.name, method.name || method),
      _methodNameToTypes4 = _slicedToArray(_methodNameToTypes3, 3),
      start = _methodNameToTypes4[0],
      success = _methodNameToTypes4[1],
      failure = _methodNameToTypes4[2];

  var methodResultNormalizer = modelConfig.normalizers && typeof modelConfig.normalizers[method.name || method] === 'function' ? modelConfig.normalizers[method.name || method] : function (result) {
    return result;
  };

  if (!(0, _isFunction2.default)(method)) {
    return (0, _reduxActions.createAction)(success, function () {
      return method;
    });
  }

  var startAction = (0, _reduxActions.createAction)(start, function () {
    for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }

    return params;
  });
  var successAction = (0, _reduxActions.createAction)(success, function (params, result) {
    return params;
  }, function (params, result) {
    return result;
  });
  var failureAction = (0, _reduxActions.createAction)(failure, function (params, result) {
    return params;
  }, function (params, error) {
    return error;
  });

  return function () {
    for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      params[_key2] = arguments[_key2];
    }

    return function (dispatch) {
      dispatch(startAction.apply(undefined, params));

      try {
        var methodResult = method.call.apply(method, [model.actions].concat(params, [dispatch]));
        var methodResultIsPromise = methodResult && methodResult.then && methodResult.catch;

        if (!methodResultIsPromise) {
          var normalizedResult = methodResultNormalizer(methodResult);
          dispatch(successAction(params, normalizedResult));
          return normalizedResult;
        }

        return methodResult.then(function (result) {
          return methodResultNormalizer(result);
        }).then(function (normalizedResult) {
          try {
            dispatch(successAction(params, normalizedResult));
          } catch (error) {
            // catch errors from components...
            console.error(error);
            throw error;
          }

          return normalizedResult;
        }).catch(function (error) {
          dispatch(failureAction(params, error));
          throw error;
        });
      } catch (error) {
        // catch errors from components...
        console.error(error);

        dispatch(failureAction(params, error));
        throw error;
      }
    };
  };
}

/**
 *
 * @param {Model} model
 * @return {Object}
 */
function createActions(model) {
  var modelMethods = (0, _methods.normalizeMethods)(model.config().methods);
  var mixinsMethods = (0, _flatten2.default)((0, _values2.default)(model._mixinsMethods)).filter(function (method) {
    return !(0, _find2.default)(modelMethods, function (modelMethod) {
      return modelMethod.name === method;
    });
  });

  var modelActions = modelMethods.reduce(function (actions, method) {
    return _extends({}, actions, _defineProperty({}, method.name || method, createActionCreator(model, method)));
  }, {});

  return _extends({}, modelActions, mixinsMethods.reduce(function (actions, method) {
    if (modelActions[method.name || method]) {
      return actions;
    }

    return _extends({}, actions, _defineProperty({}, method.name || method, createActionCreator(model, method)));
  }, {}));
}