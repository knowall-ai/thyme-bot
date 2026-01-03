import { config } from "../config";

export interface UserStatus {
  hoursToday: number;
  hoursThisWeek: number;
  lastEntry?: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project?: string;
  description?: string;
}

export class ThymeApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.thymeApiUrl;
  }

  async getUserStatus(userEmail: string): Promise<UserStatus> {
    if (!userEmail) {
      return { hoursToday: 0, hoursThisWeek: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${encodeURIComponent(userEmail)}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add auth headers as needed
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { hoursToday: 0, hoursThisWeek: 0 };
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        hoursToday: data.hoursToday || 0,
        hoursThisWeek: data.hoursThisWeek || 0,
        lastEntry: data.lastEntry,
      };
    } catch (error) {
      console.error("Error fetching user status from Thyme API:", error);
      // Return default values if API is unavailable
      return { hoursToday: 0, hoursThisWeek: 0 };
    }
  }

  async getTodayEntries(userEmail: string): Promise<TimeEntry[]> {
    if (!userEmail) {
      return [];
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `${this.baseUrl}/users/${encodeURIComponent(userEmail)}/entries?date=${today}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.entries || [];
    } catch (error) {
      console.error("Error fetching time entries from Thyme API:", error);
      return [];
    }
  }

  async getWeekEntries(userEmail: string): Promise<TimeEntry[]> {
    if (!userEmail) {
      return [];
    }

    try {
      // Get start of week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const startDate = monday.toISOString().split("T")[0];

      const response = await fetch(
        `${this.baseUrl}/users/${encodeURIComponent(userEmail)}/entries?startDate=${startDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.entries || [];
    } catch (error) {
      console.error("Error fetching week entries from Thyme API:", error);
      return [];
    }
  }
}
