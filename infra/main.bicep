targetScope = 'resourceGroup'

@description('Environment name')
@allowed(['dev', 'uat', 'prod'])
param environment string

@description('Location')
param location string = resourceGroup().location

@description('Container Registry name')
param acrName string = 'onebearacr'

@description('API image tag')
param apiImageTag string = 'latest'

@description('Worker image tag')
param workerImageTag string = 'latest'

// Naming convention
var prefix = 'onebear'
var envSuffix = environment

// Container App Environment
module containerAppEnv 'modules/container-app-env.bicep' = {
  name: 'container-app-env'
  params: {
    name: '${prefix}-${envSuffix}-env'
    location: location
    logAnalyticsName: '${prefix}-logs-${envSuffix}'
    appInsightsName: '${prefix}-ai-${envSuffix}'
  }
}

// Key Vault
module keyVault 'modules/key-vault.bicep' = {
  name: 'key-vault'
  params: {
    name: '${prefix}-kv-${envSuffix}'
    location: location
  }
}

// Redis
module redis 'modules/redis.bicep' = {
  name: 'redis'
  params: {
    name: '${prefix}-redis-${envSuffix}'
    location: location
    skuName: environment == 'prod' ? 'Standard' : 'Basic'
    skuCapacity: environment == 'prod' ? 1 : 0
  }
}

// SignalR
module signalr 'modules/signalr.bicep' = {
  name: 'signalr'
  params: {
    name: '${prefix}-signalr-${envSuffix}'
    location: location
    skuName: environment == 'prod' ? 'Standard_S1' : 'Free_F1'
  }
}

// Blob Storage
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    name: '${prefix}st${envSuffix}'
    location: location
  }
}

// API Container App
module api 'modules/container-app.bicep' = {
  name: 'api'
  params: {
    name: '${prefix}-api-${envSuffix}'
    location: location
    environmentId: containerAppEnv.outputs.environmentId
    acrName: acrName
    imageName: '${acrName}.azurecr.io/onebear-api:${apiImageTag}'
    targetPort: 8080
    isExternal: true
    minReplicas: environment == 'prod' ? 2 : 1
    maxReplicas: environment == 'prod' ? 10 : 4
    cpu: '0.5'
    memory: '1Gi'
    envVars: [
      { name: 'ASPNETCORE_ENVIRONMENT', value: environment == 'prod' ? 'Production' : 'Development' }
      { name: 'ASPNETCORE_URLS', value: 'http://+:8080' }
    ]
    keyVaultName: keyVault.outputs.name
  }
}

// Worker Container App
module worker 'modules/container-app.bicep' = {
  name: 'worker'
  params: {
    name: '${prefix}-worker-${envSuffix}'
    location: location
    environmentId: containerAppEnv.outputs.environmentId
    acrName: acrName
    imageName: '${acrName}.azurecr.io/onebear-worker:${workerImageTag}'
    targetPort: 0
    isExternal: false
    minReplicas: 1
    maxReplicas: environment == 'prod' ? 4 : 2
    cpu: '0.25'
    memory: '0.5Gi'
    envVars: [
      { name: 'DOTNET_ENVIRONMENT', value: environment == 'prod' ? 'Production' : 'Development' }
    ]
    keyVaultName: keyVault.outputs.name
  }
}

output apiUrl string = api.outputs.fqdn
output keyVaultName string = keyVault.outputs.name
