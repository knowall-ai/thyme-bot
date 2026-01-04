@description('The name suffix for all resources')
@minLength(3)
@maxLength(17) // Ensures storage account name (resourceBaseName + 'storage') stays under 24 chars
param resourceBaseName string

@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('The Bot ID from Azure AD app registration')
param botId string

@description('The Bot Password (client secret)')
@secure()
param botPassword string

@description('The Thyme App URL')
param thymeAppUrl string = 'https://thyme.knowall.ai'

@description('The Thyme API URL')
param thymeApiUrl string = 'https://thyme.knowall.ai/api'

// Storage Account for subscriptions
// Name must be 3-24 chars, lowercase alphanumeric only
var storageAccountName = take(toLower(replace('${resourceBaseName}storage', '-', '')), 24)

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Table Service for subscription storage
resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

// Subscriptions table
resource subscriptionsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'subscriptions'
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${resourceBaseName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service for Bot
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: '${resourceBaseName}-bot'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'BOT_ID'
          value: botId
        }
        {
          name: 'BOT_PASSWORD'
          value: botPassword
        }
        {
          name: 'BOT_DOMAIN'
          value: '${resourceBaseName}-bot.azurewebsites.net'
        }
        {
          name: 'BOT_ENDPOINT'
          value: 'https://${resourceBaseName}-bot.azurewebsites.net/api/messages'
        }
        {
          name: 'THYME_APP_URL'
          value: thymeAppUrl
        }
        {
          name: 'THYME_API_URL'
          value: thymeApiUrl
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
      alwaysOn: true
      cors: {
        allowedOrigins: [
          'https://teams.microsoft.com'
          'https://*.teams.microsoft.com'
          thymeAppUrl
        ]
      }
    }
    httpsOnly: true
  }
}

// Function App for scheduled reminders
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: '${resourceBaseName}-func'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'BOT_ID'
          value: botId
        }
        {
          name: 'BOT_PASSWORD'
          value: botPassword
        }
        {
          name: 'THYME_API_URL'
          value: thymeApiUrl
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
      ]
    }
    httpsOnly: true
  }
}

// Bot Service
resource botService 'Microsoft.BotService/botServices@2023-09-15' = {
  name: '${resourceBaseName}-bot-service'
  location: 'global'
  kind: 'azurebot'
  sku: {
    name: 'F0'
  }
  properties: {
    displayName: 'Thyme Bot'
    description: 'Timesheet reminder bot for Microsoft Teams'
    endpoint: 'https://${appService.properties.defaultHostName}/api/messages'
    msaAppId: botId
    msaAppType: 'MultiTenant'
  }
}

// Teams Channel for Bot Service
resource teamsChannel 'Microsoft.BotService/botServices/channels@2023-09-15' = {
  parent: botService
  name: 'MsTeamsChannel'
  location: 'global'
  properties: {
    channelName: 'MsTeamsChannel'
  }
}

// Outputs
output BOT_AZURE_APP_SERVICE_RESOURCE_ID string = appService.id
output BOT_DOMAIN string = appService.properties.defaultHostName
output AZURE_STORAGE_ACCOUNT_NAME string = storageAccount.name
output FUNCTION_APP_NAME string = functionApp.name
