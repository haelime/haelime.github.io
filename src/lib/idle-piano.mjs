// Explanatory model in milliseconds: ordered delivery, fixed buffer, late-batch shift.
// Clock estimation, periodic state packets and Unity frame timing are omitted.
export function pianoExample({ note = 0, chord = false, network = 'jitter', delay = 80 } = {}) {
  if (!Number.isInteger(note) || note < 0 || note > 6 || !Number.isFinite(delay) || delay < 20 || delay > 200)
    throw new RangeError('Invalid piano example settings');
  const profiles = { stable: [30, 30, 30, 30], jitter: [30, 75, 25, 60], late: [30, 230, 25, 60] };
  if (!Object.hasOwn(profiles, network)) throw new RangeError('Unknown network profile');
  const mask = chord ? 0b0010101 : 1 << note;
  const inputs = [0, 120, 240, 360].map((time, index) => ({ time, mask: index % 2 ? 0 : mask, sequence: index + 1 }));
  let previousArrival = 0;
  const arrivals = inputs.map((input, index) => {
    previousArrival = Math.max(previousArrival, input.time + profiles[network][index]);
    return { ...input, sent: input.time, time: previousArrival };
  });
  const buffered = [];
  const pending = [];
  let next = 0;
  let shift = 0;
  for (let time = 0; time <= 1500; time++) {
    while (next < arrivals.length && arrivals[next].time <= time) {
      const packet = arrivals[next++];
      if (!pending.length) shift = Math.max(0, time - packet.sent - delay);
      pending.push(packet);
    }
    while (pending.length && pending[0].sent + delay + shift <= time) {
      buffered.push({ ...pending.shift(), time });
    }
  }
  return { inputs, arrivals, buffered, duration: buffered.at(-1).time + 180 };
}

export function maskAt(events, time) {
  return events.findLast(event => event.time <= time)?.mask ?? 0;
}
