import { TableClient, TableEntity } from "@azure/data-tables";
import { ConversationReference } from "botbuilder";
import { config } from "../config";

export interface Subscription extends TableEntity {
  partitionKey: string;
  rowKey: string;
  userPrincipalName: string;
  conversationId: string;
  serviceUrl: string;
  timezone: string;
  reminderTime: string;
  isActive: boolean;
  conversationReference: string;
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionStore {
  private tableClient: TableClient | null = null;
  private inMemoryStore: Map<string, Subscription> = new Map();

  constructor() {
    if (config.azureStorageConnectionString) {
      this.tableClient = TableClient.fromConnectionString(
        config.azureStorageConnectionString,
        "subscriptions"
      );
      this.initializeTable();
    }
  }

  private async initializeTable(): Promise<void> {
    if (this.tableClient) {
      try {
        await this.tableClient.createTable();
      } catch (error) {
        // Table may already exist - ignore error (409 Conflict)
        const err = error as { statusCode?: number };
        if (err?.statusCode !== 409) {
          console.error("Error creating subscriptions table:", error);
        }
      }
    }
  }

  async createSubscription(subscription: Subscription): Promise<void> {
    if (this.tableClient) {
      try {
        await this.tableClient.upsertEntity(subscription, "Replace");
      } catch (error) {
        console.error("Error creating subscription in Azure Table:", error);
        throw error;
      }
    } else {
      // Use in-memory store for local development
      this.inMemoryStore.set(subscription.rowKey, subscription);
    }
  }

  async getSubscription(userId: string): Promise<Subscription | null> {
    if (this.tableClient) {
      try {
        const entity = await this.tableClient.getEntity<Subscription>("subscriptions", userId);
        return entity as Subscription;
      } catch (error) {
        const err = error as { statusCode?: number };
        if (err?.statusCode === 404) {
          return null;
        }
        console.error("Error getting subscription from Azure Table:", error);
        throw error;
      }
    } else {
      return this.inMemoryStore.get(userId) || null;
    }
  }

  async deactivateSubscription(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId);
    if (subscription) {
      subscription.isActive = false;
      subscription.updatedAt = new Date().toISOString();
      await this.createSubscription(subscription);
    }
  }

  async updateReminderTime(
    userId: string,
    reminderTime: string,
    conversationReference: ConversationReference
  ): Promise<void> {
    let subscription = await this.getSubscription(userId);

    if (subscription) {
      subscription.reminderTime = reminderTime;
      subscription.updatedAt = new Date().toISOString();
      subscription.conversationReference = JSON.stringify(conversationReference);
    } else {
      // Create new subscription if doesn't exist
      subscription = {
        partitionKey: "subscriptions",
        rowKey: userId,
        userPrincipalName: "",
        conversationId: conversationReference.conversation?.id || "",
        serviceUrl: conversationReference.serviceUrl || "",
        timezone: "UTC",
        reminderTime,
        isActive: true,
        conversationReference: JSON.stringify(conversationReference),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    await this.createSubscription(subscription);
  }

  async getActiveSubscriptionsForTime(hour: number, minute: number = 0): Promise<Subscription[]> {
    const targetTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const subscriptions: Subscription[] = [];

    if (this.tableClient) {
      try {
        const iterator = this.tableClient.listEntities<Subscription>({
          queryOptions: {
            filter: `isActive eq true and reminderTime eq '${targetTime}'`,
          },
        });

        for await (const entity of iterator) {
          subscriptions.push(entity as Subscription);
        }
      } catch (error) {
        console.error("Error listing subscriptions:", error);
      }
    } else {
      // In-memory fallback
      for (const sub of this.inMemoryStore.values()) {
        if (sub.isActive && sub.reminderTime === targetTime) {
          subscriptions.push(sub);
        }
      }
    }

    return subscriptions;
  }

  async getAllActiveSubscriptions(): Promise<Subscription[]> {
    const subscriptions: Subscription[] = [];

    if (this.tableClient) {
      try {
        const iterator = this.tableClient.listEntities<Subscription>({
          queryOptions: {
            filter: "isActive eq true",
          },
        });

        for await (const entity of iterator) {
          subscriptions.push(entity as Subscription);
        }
      } catch (error) {
        console.error("Error listing all subscriptions:", error);
      }
    } else {
      for (const sub of this.inMemoryStore.values()) {
        if (sub.isActive) {
          subscriptions.push(sub);
        }
      }
    }

    return subscriptions;
  }
}
