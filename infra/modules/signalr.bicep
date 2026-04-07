param name string
param location string
param skuName string = 'Free_F1'

resource signalr 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name: name
  location: location
  sku: { name: skuName, capacity: 1 }
  kind: 'SignalR'
  properties: {
    features: [
      { flag: 'ServiceMode', value: 'Default' }
    ]
    cors: { allowedOrigins: ['*'] }
  }
}

output connectionString string = signalr.listKeys().primaryConnectionString
