import { TurnContext, TeamsInfo, CardFactory, MessageFactory } from "botbuilder";
import { createStatusCard } from "../cards/statusCard";
import { ThymeApiClient } from "../services/thymeApiClient";

// Singleton instance for efficiency
const thymeClient = new ThymeApiClient();

export async function handleStatusCommand(context: TurnContext): Promise<void> {
  try {
    // Get user information
    let userEmail = "";

    try {
      const member = await TeamsInfo.getMember(context, context.activity.from.id);
      userEmail = member.userPrincipalName || member.email || "";
    } catch {
      // Could not get user info
    }

    // Try to get hours from Thyme API
    let hoursToday = 0;
    let hoursThisWeek = 0;

    try {
      const status = await thymeClient.getUserStatus(userEmail);
      hoursToday = status.hoursToday;
      hoursThisWeek = status.hoursThisWeek;
    } catch {
      // API not available or user not found - show placeholder
      hoursToday = 0;
      hoursThisWeek = 0;
    }

    const statusCard = createStatusCard(hoursToday, hoursThisWeek);
    const message = MessageFactory.attachment(CardFactory.adaptiveCard(statusCard));
    await context.sendActivity(message);
  } catch (error) {
    console.error("Error in status command:", error);
    await context.sendActivity("Sorry, I could not get your status. Please try again later.");
  }
}
