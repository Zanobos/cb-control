/** InfluxDB v2 URL */
const url = process.env['INFLUX_URL'] || 'http://localhost:8086'
/** InfluxDB authorization token */
const token = process.env['INFLUX_TOKEN'] || 'JTZDkRGHqj9YNB-dBypjBV9Ei9HQq-RumCA9yZrdRSM7M39j9-B0cplpbyjbMzzVphRPt-QZv3LGGTS3gbco9w=='
/** Organization within InfluxDB  */
const org = process.env['INFLUX_ORG'] || 'polar'
/**InfluxDB bucket used in examples  */
const bucket = 'telemetry'
const adminBucket = 'tlm-hr'
// ONLY onboarding example
/**Admin password  */
const password = 'montini'

module.exports = {
  url,
  token,
  org,
  bucket,
  adminBucket,
  password,
}