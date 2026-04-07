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

@description('External MongoDB connection string (Azure DocumentDB / Cosmos DB)')
@secure()
param mongoDbConnectionString string

@description('External RabbitMQ connection string')
@secure()
param rabbitMqConnectionString string

@description('Keycloak realm URL')
param keycloakAuthority string = 'https://auth-nonprod.gofive.co.th/auth/realms/onebear-dev'

@description('Keycloak API client secret')
@secure()
param keycloakClientSecret string = ''

@description('MongoDB database name')
param mongoDbDatabaseName string = 'OneBear'

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
      // Database
      { name: 'ConnectionStrings__MongoDb', secretRef: 'mongodb-conn' }
      { name: 'MongoDb__DatabaseName', value: mongoDbDatabaseName }
      { name: 'ConnectionStrings__Redis', secretRef: 'redis-conn' }
      { name: 'ConnectionStrings__RabbitMq', secretRef: 'rabbitmq-conn' }
      // Azure services
      { name: 'Azure__SignalR__ConnectionString', secretRef: 'signalr-conn' }
      { name: 'Azure__BlobStorage__ConnectionString', secretRef: 'storage-conn' }
      // Auth
      { name: 'Authentication__Authority', value: keycloakAuthority }
      { name: 'Authentication__Audience', value: 'account' }
      { name: 'Authentication__RequireHttpsMetadata', value: environment == 'prod' ? 'true' : 'false' }
      { name: 'Keycloak__ClientSecret', secretRef: 'keycloak-secret' }
      { name: 'Keycloak__ClientId', value: 'onebear-api' }
      { name: 'Keycloak__AdminBaseUrl', value: '${keycloakAuthority}/../../../admin/realms/${last(split(keycloakAuthority, '/'))}' }
      { name: 'Keycloak__TokenUrl', value: '${keycloakAuthority}/protocol/openid-connect/token' }
    ]
    secrets: [
      { name: 'mongodb-conn', value: mongoDbConnectionString }
      { name: 'redis-conn', value: redis.outputs.connectionString }
      { name: 'rabbitmq-conn', value: rabbitMqConnectionString }
      { name: 'signalr-conn', value: signalr.outputs.connectionString }
      { name: 'storage-conn', value: storage.outputs.connectionString }
      { name: 'keycloak-secret', value: keycloakClientSecret }
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
      // Database
      { name: 'ConnectionStrings__MongoDb', secretRef: 'mongodb-conn' }
      { name: 'MongoDb__DatabaseName', value: mongoDbDatabaseName }
      { name: 'ConnectionStrings__Redis', secretRef: 'redis-conn' }
      { name: 'ConnectionStrings__RabbitMq', secretRef: 'rabbitmq-conn' }
    ]
    secrets: [
      { name: 'mongodb-conn', value: mongoDbConnectionString }
      { name: 'redis-conn', value: redis.outputs.connectionString }
      { name: 'rabbitmq-conn', value: rabbitMqConnectionString }
    ]
    keyVaultName: keyVault.outputs.name
  }
}

output apiUrl string = api.outputs.fqdn
output keyVaultName string = keyVault.outputs.name
