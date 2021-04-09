/** InfluxDB v2 URL */
const url = process.env['INFLUX_URL'] || 'http://109.238.125.105:8086'
/** InfluxDB authorization token */
const token = process.env['INFLUX_TOKEN'] || '3aUreoYqk6zPzfL2ryl-pqWZhIUVdaILWX6gLskL7uasgIJQSCTjySdLsGPbyOOv5nY4cN085tyWh8FBiSXt-Q=='
/** Organization within InfluxDB  */
const org = process.env['INFLUX_ORG'] || 'polar'
/** InfluxDB bucket used in examples  */
const bucket = 'telemetry'
const adminBucket = 'tlm-hr'
/** Admin password  */
const password = 'montini'
/** Config file for bms alias */
const aliasFile = '/alias.yaml'
/** CB presence lookback timespan in recharge room */
const presenceLookbackTime = '10m'

module.exports = {
  url,
  token,
  org,
  bucket,
  adminBucket,
  password,
  aliasFile,
  presenceLookbackTime
}