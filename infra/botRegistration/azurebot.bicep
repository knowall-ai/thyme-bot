@description('The name of the Bot Service')
param botServiceName string

@description('The Bot ID from Azure AD app registration')
param botId string

@description('The Bot endpoint URL')
param botEndpoint string

@description('The display name for the bot')
param botDisplayName string = 'Thyme Bot'

// Bot Service Registration
resource botService 'Microsoft.BotService/botServices@2022-09-15' = {
  name: botServiceName
  location: 'global'
  kind: 'azurebot'
  sku: {
    name: 'F0'
  }
  properties: {
    displayName: botDisplayName
    description: 'Timesheet reminder bot for Microsoft Teams - by KnowAll AI'
    endpoint: botEndpoint
    msaAppId: botId
    msaAppType: 'MultiTenant'
    developerAppInsightsApplicationId: ''
    developerAppInsightKey: ''
    luisAppIds: []
    isCmekEnabled: false
    isStreamingSupported: false
  }
}

// Teams Channel
resource teamsChannel 'Microsoft.BotService/botServices/channels@2022-09-15' = {
  parent: botService
  name: 'MsTeamsChannel'
  location: 'global'
  properties: {
    channelName: 'MsTeamsChannel'
    properties: {
      isEnabled: true
    }
  }
}

output botServiceId string = botService.id
