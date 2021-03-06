import { createAction } from 'redux-actions';
import snakeCase from 'lodash/snakeCase';
import find from 'lodash/find';
import isFunction from 'lodash/isFunction';
import values from 'lodash/values';
import flatten from 'lodash/flatten';
import { normalizeMethods, createMixinsMethods } from './methods';

const typePrefix = '@@redux-models/';

export function methodNameToTypes(modelName, methodName) {
  const type = `${typePrefix}${snakeCase(modelName).toUpperCase()}/${snakeCase(methodName).toUpperCase()}`;
  return [
    `${type}_START`, `${type}_SUCCESS`, `${type}_ERROR`
  ]
}

export function actionTypes(modelName, methods) {
  return methods
    .reduce((types, method) => {
      const methodName = method.name || method;
      const [start, success, error] = methodNameToTypes(modelName, methodName);
      types[snakeCase(`${methodName}Start`).toUpperCase()] = start;
      types[snakeCase(`${methodName}`).toUpperCase()] = success;
      types[snakeCase(`${methodName}Success`).toUpperCase()] = success;
      types[snakeCase(`${methodName}Error`).toUpperCase()] = error;
      return types;
    }, {});
}

export function createActionCreator(model, method) {
  const modelConfig = model.config();
  const [start, success, failure] = methodNameToTypes(modelConfig.name, method.name || method);
  const methodResultNormalizer = modelConfig.normalizers &&
    typeof modelConfig.normalizers[method.name || method] === 'function'
      ? modelConfig.normalizers[method.name || method]
      : result => result;

  if (!isFunction(method)) {
    return createAction(success, () => method);
  }

  const startAction = createAction(start, (...params) => params);
  const successAction = createAction(success, (params, result) => params, (params, result) => result);
  const failureAction = createAction(failure, (params, result) => params, (params, error) => error);

  return (...params) => (dispatch) => {
    dispatch(startAction(...params));

    try {
      const methodResult = method.call(model.actions, ...params, dispatch);
      const methodResultIsPromise = methodResult && methodResult.then && methodResult.catch;

      if (!methodResultIsPromise) {
        const normalizedResult = methodResultNormalizer(methodResult);
        dispatch(successAction(params, normalizedResult));
        return normalizedResult;
      }

      return methodResult
        .then(result => methodResultNormalizer(result))
        .then(normalizedResult => {
          try {
            dispatch(successAction(params, normalizedResult));
          } catch (error) {
            // catch errors from components...
            console.error(error);
            throw error;
          }

          return normalizedResult;
        })
        .catch((error) => {
          dispatch(failureAction(params, error));
          throw error;
        });
    } catch (error) {
      // catch errors from components...
      console.error(error);

      dispatch(failureAction(params, error));
      throw error;
    }
  }
}

/**
 *
 * @param {Model} model
 * @return {Object}
 */
export function createActions(model) {
  const modelMethods = normalizeMethods(model.config().methods);
  const mixinsMethods = flatten(values(model._mixinsMethods))
    .filter((method) => !find(modelMethods, modelMethod => modelMethod.name === method));

  const modelActions = modelMethods
    .reduce((actions, method) => ({
      ...actions, [method.name || method]: createActionCreator(model, method)
    }), {});

  return {
    ...modelActions,
    ...mixinsMethods
      .reduce((actions, method) => {
        if (modelActions[method.name || method]) {
          return actions;
        }

        return {
          ...actions, [method.name || method]: createActionCreator(model, method)
        };
      }, {})
  }
}
