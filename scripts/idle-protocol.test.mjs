import assert from 'node:assert/strict';
import { encodePacket, decodePacket, isNewer, delivery } from '../src/lib/idle-protocol.mjs';

const packet = { sequence: 65535, objectId: 42n, instrument: 0, mask: 1, flags: 1, serverTime: 1000.125 };
const bytes = encodePacket(packet);
// Independent wire vector: ITM1, v2, performing, ushort, ulong, two bytes, IEEE754 double.
assert.equal(Buffer.from(bytes).toString('hex'), '49544d310201ffff2a0000000000000000010000000000418f40');
assert.deepEqual(decodePacket(bytes), packet);
const padded = new Uint8Array(40); padded.set(bytes, 7);
assert.deepEqual(decodePacket(padded.subarray(7, 33)), packet);
for (const offset of [0, 4, 5]) {
  const invalid = bytes.slice(); invalid[offset] = 255;
  assert.equal(decodePacket(invalid), null);
}
assert.equal(decodePacket(bytes.subarray(0, 25)), null);
const invalidTime = bytes.slice(); new DataView(invalidTime.buffer).setFloat64(18, NaN, true);
assert.equal(decodePacket(invalidTime), null);
assert.throws(() => encodePacket({ ...packet, flags: 0 }), RangeError);
assert(isNewer(0, 65535));
assert(!isNewer(65535, 0));
assert(!isNewer(7, 7));
assert(!isNewer(32768, 0));
assert.equal(delivery(10).nearPlay, delivery(10).farPlay);
assert.equal(delivery(180).farPlay, 190);
console.log('Instrument packet: wire bytes, slice offsets, invalid input, sequence wrap and delayed delivery passed.');
