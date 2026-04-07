param name string
param location string
param skuName string = 'Basic'
param skuCapacity int = 0

resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: name
  location: location
  properties: {
    sku: { name: skuName, family: skuName == 'Basic' ? 'C' : 'C', capacity: skuCapacity }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

output connectionString string = '${redis.properties.hostName}:${redis.properties.sslPort},password=${redis.listKeys().primaryKey},ssl=True,abortConnect=False'
