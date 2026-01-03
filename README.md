# Thyme Bot

A Microsoft Teams bot that reminds users to fill in their timesheets at 5pm each day. Built with the Teams Toolkit and Microsoft Bot Framework.

**By [KnowAll AI](https://knowall.ai)**

## Features

- **Daily Reminders**: Proactive messages sent at 5pm (user's local timezone)
- **Adaptive Cards**: Beautiful, interactive cards for reminders and status
- **Custom Reminder Times**: Set your preferred reminder time
- **Embedded Tabs**: Direct access to Thyme timesheet, timer, and reports
- **Quick Status**: Check your logged hours without leaving Teams

## Bot Commands

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `subscribe` | Opt-in to daily reminders |
| `unsubscribe` | Opt-out of reminders |
| `status` | Show today's logged hours |
| `remind me at [time]` | Set a custom reminder time (e.g., `remind me at 4:30pm`) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Teams Toolkit |
| Language | TypeScript |
| Bot Framework | Microsoft Bot Framework SDK 4.x |
| Tabs | Embedded from thyme.knowall.ai |
| Hosting | Azure App Service |
| Scheduling | Azure Functions Timer Trigger |
| Storage | Azure Table Storage |
| Auth | Microsoft Entra ID |

## Project Structure

```
thyme-bot/
├── .github/
│   └── AGENTS.md              # AI assistant personas
├── .vscode/
│   └── launch.json            # VS Code debug configuration
├── appPackage/
│   ├── manifest.json          # Teams app manifest
│   ├── outline.png            # 32x32 icon
│   └── color.png              # 192x192 icon
├── env/
│   ├── .env.dev               # Development environment
│   └── .env.local             # Local environment
├── infra/
│   ├── azure.bicep            # Azure resources
│   ├── azure.parameters.json
│   └── botRegistration/
├── src/
│   ├── index.ts               # Entry point
│   ├── bot.ts                 # Bot activity handler
│   ├── config.ts              # Configuration
│   ├── commands/              # Command handlers
│   ├── cards/                 # Adaptive Cards
│   └── services/              # Business logic
├── functions/
│   └── dailyReminder/         # Azure Function timer trigger
├── tabs/
│   └── README.md              # Tab documentation
├── tests/                     # Unit tests
├── teamsapp.yml               # Teams Toolkit config
├── teamsapp.local.yml         # Local dev config
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) VS Code extension
- Azure subscription
- Microsoft 365 tenant with Teams

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd thyme-bot
   npm install
   ```

2. **Start local development**

   Using VS Code:
   - Press `F5` to start debugging
   - Teams Toolkit will provision local resources and open Teams

   Using CLI:
   ```bash
   npm run dev
   ```

3. **Test the bot**
   - The bot will be available in Teams
   - Send `help` to see available commands

### Deploy to Azure

1. **Provision Azure resources**
   ```bash
   teamsapp provision --env dev
   ```

2. **Deploy the application**
   ```bash
   teamsapp deploy --env dev
   ```

3. **Preview in Teams**
   ```bash
   teamsapp preview --env dev
   ```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BOT_ID` | Azure AD App Registration ID |
| `BOT_PASSWORD` | Azure AD App secret |
| `BOT_DOMAIN` | Bot hosting domain |
| `BOT_ENDPOINT` | Bot messages endpoint URL |
| `THYME_APP_URL` | Thyme web app URL |
| `THYME_API_URL` | Thyme API URL |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage for subscriptions |

### Tabs Configuration

The app includes three tabs that embed the Thyme web application:

| Tab | URL |
|-----|-----|
| Timesheet | https://thyme.knowall.ai/timesheet |
| Timer | https://thyme.knowall.ai/timer |
| Reports | https://thyme.knowall.ai/reports |

## Architecture

### Bot Flow

```
User Message → Bot Framework → ThymeBot.onMessage()
                                    ↓
                            Command Handler
                                    ↓
                            Adaptive Card Response
```

### Proactive Messaging Flow

```
Azure Function Timer (hourly)
        ↓
Get subscriptions for current hour
        ↓
For each user at 5pm local time:
        ↓
Send proactive reminder via Bot Framework
```

### Storage Schema

Subscriptions are stored in Azure Table Storage:

```typescript
interface Subscription {
  partitionKey: "subscriptions";
  rowKey: string;              // User ID
  userPrincipalName: string;   // Email
  timezone: string;            // e.g., "Europe/London"
  reminderTime: string;        // e.g., "17:00"
  isActive: boolean;
  conversationReference: string; // For proactive messaging
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Contributing

See [AGENTS.md](.github/AGENTS.md) for AI assistant personas that can help with development:

- `/pennie` - Requirements Analyst
- `/teddie` - QA Engineer
- `/archie` - Solution Architect

## Resources

- [Teams Toolkit Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
- [Bot Framework SDK](https://github.com/microsoft/botbuilder-js)
- [Adaptive Cards Designer](https://adaptivecards.io/designer/)
- [Proactive Messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## License

MIT

---

Built with care by [KnowAll AI](https://knowall.ai)
