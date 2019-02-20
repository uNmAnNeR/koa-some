const clone = require('clone');


function cloneObject (obj) {
  if (!obj) return;

  return Object
    .keys(obj)
    .reduce((copy, k) => {
      copy[k] = obj[k];
      return copy;
    }, {});
}

function cloneContext (ctx) {
  return {
    response: cloneObject(ctx.response),  // `clone` is not working for koa
    state: clone(ctx.state) || ctx.state,
  };
}

function assignContext (ctx, copy) {
  if (ctx.response) Object.assign(ctx.response, copy.response);
  ctx.state = copy.state;
}


/**
 * Returns new middleware which select
 * first one of passed.
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function some (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
  }

  /**
   * @param {Object} ctx
   * @return {Promise}
   * @api public
   */

  return function (ctx, next) {
    // HACK: explicitly set to false to include in state
    if (ctx.response && ctx.response._explicitStatus == null) ctx.response._explicitStatus = false;

    // to handle only first successfull case
    let resolved = false;
    let initState = cloneContext(ctx);
    const wrapResolve = (...args) => {
      resolved = true;
      // save first success next
      if (next) next = next.bind(null, ...args);
    };

    return new Promise(async (resolve, reject) => {
      let error;
      let errorState;
      let hasError = false;

      for (let i=0; i < middleware.length; ++i) {
        try {
          await middleware[i](ctx, wrapResolve);
          if (resolved) break;
        } catch (e) {
          if (!hasError) {
            error = e;
            hasError = true;
          }
        }

        if (!errorState) errorState = cloneContext(ctx);
        // restore state after error
        assignContext(ctx, initState);
      }

      if (resolved) return resolve(next && next());
      if (errorState) assignContext(ctx, errorState);
      if (hasError) return reject(error);

      resolve();
    });
  };
}


module.exports = some;
