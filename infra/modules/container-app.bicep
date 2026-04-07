param name string
param location string
param environmentId string
param acrName string
param imageName string
param targetPort int
param isExternal bool
param minReplicas int
param maxReplicas int
param cpu string
param memory string
param envVars array = []
param secrets array = []
param keyVaultName string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource app 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: targetPort > 0 ? {
        external: isExternal
        targetPort: targetPort
        transport: 'auto'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['*']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      } : null
      secrets: secrets
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: name
          image: imageName
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: envVars
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: targetPort > 0 ? [
          {
            name: 'http-rule'
            http: { metadata: { concurrentRequests: '100' } }
          }
        ] : []
      }
    }
  }
}

// Grant Key Vault access
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource keyVaultPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: app.identity.principalId
        permissions: { secrets: ['get', 'list'] }
      }
    ]
  }
}

output fqdn string = targetPort > 0 ? app.properties.configuration.ingress.fqdn : ''
