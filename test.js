const koaSome = require('.');
const assert = require('assert');
const { spy } = require('sinon');


describe('Koa Some', function () {
  it('should select first success result', async function () {
    const middleware = [
      async (ctx, next) => {
        throw new Error('e1');
      },
      async (ctx, next) => {
        return next('good');
      },
      async (ctx, next) => {
        throw new Error('e2');
      },
    ]

    const nextcb = spy();
    await koaSome(middleware)({}, nextcb);

    assert(nextcb.calledWith('good'), 'Next callback is not resolved');
  });

  it('should return first error', async function () {
    const middleware = Array.from({ length: 5 }, (_, i) =>
      async (ctx, next) => {
        throw new Error(String(i));
      }
    );

    const nextcb = spy();
    try {
      await koaSome(middleware)({}, nextcb);
    } catch (e) {
      assert(e.message === '0', 'Error is not the first one');
    }

    assert(!nextcb.called, 'Next is called on Error');
  });

  it('should restore ctx after error', async function () {
    const ctx = { state: 1 };

    const middleware = [
      async (ctx, next) => {
        ctx.state = 2;
        throw new Error('e1');
      },
      async (ctx, next) => {
        return next('good');
      },
      async (ctx, next) => {
        ctx.state = 3;
        throw new Error('e2');
      },
    ]

    await koaSome(middleware)({});

    assert(ctx.state === 1, 'Context state is not ');
  });
});
