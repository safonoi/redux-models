'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createModels = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createModel = createModel;

var _redux = require('redux');

var _methods = require('./methods');

var _actions = require('./actions');

var _reducer = require('./reducer');

var _selectors = require('./selectors');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Model
 */
var Model = function () {
  function Model(modelConfig) {
    var _this = this;

    _classCallCheck(this, Model);

    this._config = modelConfig;

    var combineReducers = modelConfig.combineReducers || _redux.combineReducers;
    var stateToModel = modelConfig.stateToModel || function (state) {
      return state[_this.config().name];
    };
    this._mixinsMethods = (0, _methods.createMixinsMethods)(this);

    this.actions = (0, _actions.createActions)(this);
    this.reducer = (0, _reducer.createReducer)(this, combineReducers);
    this.selectors = (0, _selectors.createSelectors)(this, stateToModel);
  }

  _createClass(Model, [{
    key: 'config',
    value: function config() {
      return this._config;
    }
  }]);

  return Model;
}();

/**
 * @param {Model} model
 * @return {{ actions: Object, selectors: Object, reducer: Function, model: Model }}
 */


function _createModel(model) {
  return _extends({}, model.actions, {
    selectors: model.selectors,
    reducer: model.reducer,
    model: model
  });
}

/**
 * @param {Object} config
 * @param {String} config.name
 * @param {Object} config.methods
 * @param {Object} config.normalizers
 * @param {Object} config.reducers
 * @param {Object} config.selectors
 * @param {Function} [config.stateToModel]
 * @return {{ actions: Object, selectors: Object, reducer: Object, model: Model }}
 */
function createModel(config) {
  var model = new Model(config);
  return _createModel(model);
}

/**
 * @param {Array} models
 * @param {Array} [mixins]
 * @param {Function} [combineReducers]
 * @param {Function} [stateToModel]
 * @return {{ models: [{ actions: Object, selectors: Object, reducer: Function, model: Model }], reducer: Function }}
 */
function createModels(_ref) {
  var models = _ref.models,
      _ref$mixins = _ref.mixins,
      mixins = _ref$mixins === undefined ? [] : _ref$mixins,
      _ref$combineReducers = _ref.combineReducers,
      combineReducers = _ref$combineReducers === undefined ? _redux.combineReducers : _ref$combineReducers,
      _ref$stateToModel = _ref.stateToModel,
      _stateToModel = _ref$stateToModel === undefined ? function (state) {
    return state.models;
  } : _ref$stateToModel;

  var impls = models.map(function (modelConfig) {
    return new Model(_extends({}, modelConfig, {
      combineReducers: combineReducers || modelConfig.combineReducers,
      mixins: [].concat(_toConsumableArray(mixins), _toConsumableArray(modelConfig.mixins || [])),
      stateToModel: function stateToModel(state) {
        return _stateToModel(state)[modelConfig.name];
      }
    }));
  });

  var modelsObject = impls.reduce(function (models, model) {
    return _extends({}, models, _defineProperty({}, model.config().name, _createModel(model)));
  }, {});

  var reducer = combineReducers(impls.reduce(function (reducers, model) {
    return _extends({}, reducers, _defineProperty({}, model.config().name, model.reducer));
  }, {}));

  return { models: modelsObject, reducer: reducer };
}
exports.createModels = createModels;