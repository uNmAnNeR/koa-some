const clone = require('clone');


const cloneKeys = ['request', 'response', 'state'];
function cloneContext (ctx) {
  return cloneKeys.reduce((copy, k) => {
    if (ctx[k]) copy[k] = clone(ctx[k]);
    return copy;
  }, {});
}

function assignContext (ctx, copy) {
  Object.keys(copy).forEach(k => {
    if (ctx[k]) Object.assign(ctx[k], copy[k]);
    else ctx[k] = copy[k];
  })
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

    return new Promise(async (resolve, reject) => {
      // to handle only first successfull case
      let resolved = false;
      let state = cloneContext(ctx);
      const wrapResolve = (...args) => {
        if (resolved) return;

        resolved = true;
        // save first success state
        state = cloneContext(ctx);
        // save first success next
        if (next) next = next.bind(null, ...args);
      };

      let error;
      let errorState;
      let hasError = false;

      for (let i=0; i < middleware.length; ++i) {
        try {
          await middleware[i](ctx, wrapResolve);
          // restore state after error
          assignContext(ctx, state);
        } catch (e) {
          if (resolved || hasError) break;
          error = e;
          hasError = true;
          errorState = cloneContext(ctx);
        }
      }

      if (resolved) return resolve(next && next());

      assignContext(ctx, errorState);
      if (hasError) return reject(error);

      resolve();
    });
  };
}


module.exports = some;
