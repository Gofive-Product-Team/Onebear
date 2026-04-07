using '../main.bicep'

param environment = 'uat'
param apiImageTag = 'uat-latest'
param workerImageTag = 'uat-latest'
param mongoDbDatabaseName = 'OneBear-UAT'
param keycloakAuthority = 'https://auth-nonprod.gofive.co.th/auth/realms/onebear-uat'
// Secrets — pass via CLI
param mongoDbConnectionString = ''
param rabbitMqConnectionString = ''
param keycloakClientSecret = ''
