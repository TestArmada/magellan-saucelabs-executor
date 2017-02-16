

const RAND_MAX = 9999999999999999;
const STRNUM_BASE = 16;

export default () => Math.round(Math.random() * RAND_MAX).toString(STRNUM_BASE);
