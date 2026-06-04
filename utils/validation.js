const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

module.exports = { isPositiveInteger };