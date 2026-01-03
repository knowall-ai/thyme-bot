# Bot Registration

This folder contains the Bicep template for registering the bot with Azure Bot Service.

## Resources Created

- **Azure Bot Service**: The bot registration that connects your bot to Microsoft Teams
- **Teams Channel**: Enables the bot to communicate via Microsoft Teams

## Usage

This template is automatically deployed as part of the main `azure.bicep` template during provisioning.

For standalone bot registration, you can deploy this template directly:

```bash
az deployment group create \
  --resource-group <your-resource-group> \
  --template-file azurebot.bicep \
  --parameters botServiceName=thyme-bot-service \
               botId=<your-bot-id> \
               botEndpoint=https://<your-app>.azurewebsites.net/api/messages
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| botServiceName | Name of the Bot Service resource | Yes |
| botId | Azure AD App Registration ID | Yes |
| botEndpoint | URL where the bot receives messages | Yes |
| botDisplayName | Display name shown in Teams | No (default: "Thyme Bot") |
