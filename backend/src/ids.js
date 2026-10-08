// Public registration IDs shown to participants, e.g. MF26-T0007 / MF26-S0012.
const pad = (id) => String(id).padStart(4, '0');

module.exports = {
  teamRegId: (id) => `MF26-T${pad(id)}`,
  soloRegId: (id) => `MF26-S${pad(id)}`,
};
