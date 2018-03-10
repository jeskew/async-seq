import { take, range } from '.';
import { collect } from './collect';
import { asyncFibonacci, fibonacci } from './testIterators.fixture';
import * as test from 'tape';

test('collect', async t => {
    t.plan(3)

    t.deepEqual(
        [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
        await collect(take(10, fibonacci()))
    )

    t.deepEqual(
        [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
        await collect(take(10, asyncFibonacci()))
    )

    t.deepEqual(
        [0, 1, 2, 3, 4, 5],
        await collect(range(6))
    )
});

test('collect error handling', async t => {
    t.plan(2);

    class ExplosiveIterator {
        [Symbol.asyncIterator]() {
            return this;
        }

        next(): Promise<IteratorResult<void>> {
            return Promise.reject(new Error('PANIC'));
        }
    }

    try {
        await collect(new ExplosiveIterator);
    } catch {
        t.pass('Error encountered while collecting is forwarded to caller');
    }

    class CloseHandlingIterator extends ExplosiveIterator {
        returnCalled = false;

        return(): Promise<IteratorResult<void>> {
            this.returnCalled = true;
            return Promise.resolve({done: true} as IteratorResult<void>);
        }
    }

    const iter = new CloseHandlingIterator;
    try {
        await collect(iter);
    } catch {
        t.ok(iter.returnCalled, '.return should have been called');
    }
});
