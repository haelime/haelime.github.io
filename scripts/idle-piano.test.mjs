import assert from 'node:assert/strict';
import { pianoExample, maskAt } from '../src/lib/idle-piano.mjs';

const jitter = pianoExample();
assert.deepEqual(jitter.arrivals.map(e => e.time), [30, 195, 265, 420]);
assert.deepEqual(jitter.buffered.map(e => e.time), [80, 200, 320, 440]);
const late = pianoExample({ network: 'late' });
assert.deepEqual(late.arrivals.map(e => e.time), [30, 350, 350, 420]);
assert.deepEqual(late.buffered.map(e => e.time), [80, 350, 470, 590]);
assert.equal(maskAt(late.arrivals, 350), 1); // Release disappears in an immediate batch update.
assert.equal(maskAt(late.buffered, 350), 0);
assert.equal(maskAt(late.buffered, 470), 1); // The second press remains a distinct action.
for (const network of ['stable', 'jitter', 'late']) {
  for (const delay of [20, 80, 200]) {
    const example = pianoExample({ chord: true, network, delay });
    assert.deepEqual(example.buffered.map(e => e.mask), [21, 0, 21, 0]);
    assert(example.buffered.every((e, i) => e.time >= example.arrivals[i].time));
    assert.equal(maskAt(example.buffered, example.duration), 0);
  }
}
assert.throws(() => pianoExample({ delay: NaN }), RangeError);
console.log('Piano timing: jitter, late ordered batches, repeated notes and chords passed.');
