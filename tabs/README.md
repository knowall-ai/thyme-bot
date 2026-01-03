# Thyme Bot Tabs

The Thyme Bot uses **embedded tabs** that load content from the hosted Thyme web application at `https://thyme.knowall.ai`.

## Tab Configuration

The following tabs are configured in the Teams app manifest:

| Tab | URL | Purpose |
|-----|-----|---------|
| Timesheet | `https://thyme.knowall.ai/timesheet?context=teams` | Weekly time entry grid |
| Timer | `https://thyme.knowall.ai/timer?context=teams` | Active timer view |
| Reports | `https://thyme.knowall.ai/reports?context=teams` | Weekly summary reports |

## How It Works

Instead of building separate tab applications, Thyme Bot embeds the existing Thyme web application pages directly within Microsoft Teams using the `staticTabs` configuration in the manifest.

### Benefits

- **Single source of truth**: Users interact with the same interface whether on the web or in Teams
- **Automatic updates**: When the Thyme web app is updated, Teams users see changes immediately
- **Consistent experience**: Familiar UI across all platforms
- **Reduced maintenance**: No need to maintain separate codebases for tabs

### Context Parameter

Each tab URL includes `?context=teams` which allows the Thyme web application to:

- Detect it's running inside Microsoft Teams
- Adjust UI elements if needed (e.g., hide redundant navigation)
- Use the Teams SDK for SSO if implemented
- Apply Teams-specific styling

## Authentication

Tabs can leverage Microsoft Teams SSO (Single Sign-On) to authenticate users automatically. The Thyme web application should:

1. Include the Microsoft Teams JavaScript SDK
2. Call `microsoftTeams.authentication.getAuthToken()` to get an SSO token
3. Exchange the token for a Thyme API access token on the backend

## Local Development

For local development, you can test the tabs by:

1. Running the Thyme web application locally
2. Updating the manifest URLs to point to your local server (with ngrok or similar)
3. Using Teams Toolkit to preview the app

## Customization

If you need to customize the tab experience:

1. The Thyme web app should detect the `context=teams` parameter
2. Use the Teams SDK to get theme information: `microsoftTeams.getContext()`
3. Apply appropriate styling for light/dark/high-contrast themes

## Resources

- [Microsoft Teams Tabs Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/what-are-tabs)
- [Teams JavaScript SDK](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/using-teams-client-sdk)
- [SSO for Tabs](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-overview)
