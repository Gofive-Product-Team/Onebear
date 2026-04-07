using '../main.bicep'

param environment = 'prod'
param apiImageTag = 'prod-latest'
param workerImageTag = 'prod-latest'
param mongoDbDatabaseName = 'OneBear'
param keycloakAuthority = 'https://auth.gofive.co.th/auth/realms/onebear-prod'
// Secrets — pass via CLI
param mongoDbConnectionString = ''
param rabbitMqConnectionString = ''
param keycloakClientSecret = ''
