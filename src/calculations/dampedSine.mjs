/** Signal envelope utility; Q is deliberately unavailable until the scan is verified. */
export const dampedSineCurrent = (time, initialCurrent, frequencyHz, dampingPerSecond) =>
  initialCurrent * Math.exp(-dampingPerSecond * time) * Math.sin(2 * Math.PI * frequencyHz * time);

// TODO: verify damping coefficient Q formula against original standard before production use.
