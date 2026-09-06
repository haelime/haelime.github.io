// Mirrors InstrumentRealtimeProtocol.cs wire encoding. Transport timing below is illustrative.
export function encodePacket({ sequence, objectId = 42n, instrument = 0, mask = 1, flags = 1, serverTime = 1000 }) {
  const integer = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
  if (!integer(sequence, 65535) || typeof objectId !== 'bigint' || objectId < 0n || objectId > 0xffffffffffffffffn ||
      !integer(instrument, 255) || !integer(mask, 255) || !integer(flags, 1) || (!flags && mask) ||
      !Number.isFinite(serverTime) || serverTime < 0) throw new RangeError('Invalid packet');
  const bytes = new Uint8Array(26);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x314d5449, true);
  view.setUint8(4, 2);
  view.setUint8(5, flags);
  view.setUint16(6, sequence, true);
  view.setBigUint64(8, objectId, true);
  view.setUint8(16, instrument);
  view.setUint8(17, mask);
  view.setFloat64(18, serverTime, true);
  return bytes;
}

export function decodePacket(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 26) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x314d5449 || view.getUint8(4) !== 2) return null;
  const packet = { sequence: view.getUint16(6, true), objectId: view.getBigUint64(8, true), instrument: bytes[16], mask: bytes[17], flags: bytes[5], serverTime: view.getFloat64(18, true) };
  if ((packet.flags & ~1) || (!packet.flags && packet.mask) || !Number.isFinite(packet.serverTime) || packet.serverTime < 0) return null;
  return packet;
}

export function isNewer(candidate, previous) {
  const distance = (candidate - previous) & 0xffff;
  return distance !== 0 && distance < 0x8000;
}

// One valid input packet. Host processing, loss, keepalives and clock error are omitted.
export function delivery(farLeg = 90) {
  if (!Number.isFinite(farLeg) || farLeg < 10 || farLeg > 180) throw new RangeError('Invalid path delay');
  return { host: 10, near: 20, far: 10 + farLeg, nearPlay: 80, farPlay: Math.max(80, 10 + farLeg) };
}
