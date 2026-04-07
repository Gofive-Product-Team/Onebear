param name string
param location string
param skuName string = 'Basic'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: name
  location: location
  sku: { name: skuName }
  properties: { adminUserEnabled: true }
}

output loginServer string = acr.properties.loginServer
output name string = acr.name
