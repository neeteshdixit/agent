import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { localAutomationService } from '../localAutomation.service.js';
import { browserAutomationService } from '../browserAutomation.service.js';
import { messagingAutomationService } from '../messagingAutomation.service.js';
import { systemCommandService } from '../systemCommand.service.js';

export const systemTools = (userId, userContext = {}) => [
  new DynamicStructuredTool({
    name: 'flight_search',
    description: 'Search for available flights based on source, destination, and travel date.',
    schema: z.object({
      source: z.string().describe('Origin city'),
      destination: z.string().describe('Destination city'),
      date: z.string().describe('Travel date in YYYY-MM-DD format'),
    }),
    func: async ({ source, destination, date }) => {
      // Simulate/mock flight search with preference awareness
      const priceModifier = userContext.budgetPreference === 'low' ? 0.85 : 1.0;
      const basePrice = Math.floor(Math.random() * 5000 + 4000) * priceModifier;
      return JSON.stringify({
        status: 'success',
        flights: [
          { flightNumber: 'AI-102', carrier: 'Air India', price: Math.floor(basePrice), departure: '08:00 AM' },
          { flightNumber: '6E-5321', carrier: 'IndiGo', price: Math.floor(basePrice - 500), departure: '02:30 PM' },
        ],
        message: `Found flights from ${source} to ${destination} on ${date}.`,
      });
    },
  }),

  new DynamicStructuredTool({
    name: 'hotel_recommendation',
    description: 'Recommend hotels in a specific city, filtering by price, rating, or budget preference.',
    schema: z.object({
      city: z.string().describe('Destination city'),
      checkIn: z.string().optional().describe('Check-in date (YYYY-MM-DD)'),
    }),
    func: async ({ city }) => {
      const budget = userContext.budgetPreference || 'low';
      let hotels = [
        { name: 'Hotel Grand Residency', price: 6500, rating: '4.5/5', category: 'premium' },
        { name: 'StayEasy Inn', price: 2200, rating: '4.1/5', category: 'budget' },
        { name: 'Urban Comforts', price: 3500, rating: '4.2/5', category: 'mid-range' },
      ];

      if (budget === 'low') {
        hotels = hotels.filter((h) => h.price < 4000);
      }
      return JSON.stringify({
        status: 'success',
        city,
        recommendations: hotels,
        message: `Fetched hotel recommendations for ${city} matching user's ${budget} budget preference.`,
      });
    },
  }),

  new DynamicStructuredTool({
    name: 'cab_booking_recommendation',
    description: 'Provide cab recommendations and pricing options between Uber, Ola, and Rapido.',
    schema: z.object({
      pickup: z.string().describe('Pickup location'),
      drop: z.string().describe('Dropoff location'),
    }),
    func: async ({ pickup, drop }) => {
      // Preference matching (e.g. prefer Rapido over Uber)
      const preferences = userContext.cabPreference || 'Rapido';
      const options = [
        { provider: 'Rapido Cab', type: 'Economy', price: 180, duration: '12 mins' },
        { provider: 'Uber Go', type: 'Economy', price: 210, duration: '15 mins' },
        { provider: 'Ola Prime', type: 'Sedan', price: 290, duration: '14 mins' },
      ];

      // Sort by preference first
      options.sort((a, b) => {
        if (a.provider.toLowerCase().includes(preferences.toLowerCase())) return -1;
        if (b.provider.toLowerCase().includes(preferences.toLowerCase())) return 1;
        return 0;
      });

      return JSON.stringify({
        status: 'success',
        pickup,
        drop,
        options,
        recommended: options[0].provider,
        message: `Cab recommendations generated. User prefers ${preferences}.`,
      });
    },
  }),

  new DynamicStructuredTool({
    name: 'email_summarization',
    description: 'Summarize unread or recent emails received.',
    schema: z.object({
      limit: z.number().default(5).describe('Number of emails to fetch and summarize'),
    }),
    func: async ({ limit }) => {
      return JSON.stringify({
        status: 'success',
        summary: [
          { from: 'Recruiter <jobs@amazon.com>', subject: 'Interview Confirmation', summary: 'Interview scheduled for Tuesday 10am' },
          { from: 'GitHub', subject: '[GitHub] Security Alert', summary: 'Dependabot alerted alert in repo frontend' },
        ],
        message: `Fetched and summarized the top ${limit} unread emails.`,
      });
    },
  }),

  new DynamicStructuredTool({
    name: 'reminder_scheduling',
    description: 'Schedule a task reminder with a description and trigger time.',
    schema: z.object({
      title: z.string().describe('Title of the reminder'),
      time: z.string().describe('ISO string or trigger time representation'),
    }),
    func: async ({ title, time }) => {
      return JSON.stringify({
        status: 'success',
        title,
        scheduledAt: time,
        message: `Reminder scheduled: "${title}" at ${time}.`,
      });
    },
  }),

  new DynamicStructuredTool({
    name: 'app_launcher',
    description: 'Launch a local application installed on the user\'s computer (e.g. vscode, notepad, chrome).',
    schema: z.object({
      appName: z.string().describe('The name of the application to open'),
    }),
    func: async ({ appName }) => {
      try {
        const res = await localAutomationService.openKnownApp({ appName });
        return JSON.stringify({ status: res.status, result: res.result });
      } catch (err) {
        return JSON.stringify({ status: 'failed', error: err.message });
      }
    },
  }),

  new DynamicStructuredTool({
    name: 'search_engine',
    description: 'Search the web using Google for a query and return results.',
    schema: z.object({
      query: z.string().describe('The search query to lookup on Google'),
    }),
    func: async ({ query }) => {
      try {
        const res = await browserAutomationService.googleSearch({ query });
        return JSON.stringify({ status: res.status, result: res.result });
      } catch (err) {
        return JSON.stringify({ status: 'failed', error: err.message });
      }
    },
  }),

  new DynamicStructuredTool({
    name: 'whatsapp_assistant',
    description: 'Send an automated WhatsApp Web message to a contact.',
    schema: z.object({
      contact: z.string().describe('The name of the contact as saved in WhatsApp'),
      message: z.string().describe('The message content to send'),
    }),
    func: async ({ contact, message }) => {
      try {
        const res = await browserAutomationService.sendWhatsAppWebMessage({ contact, message });
        return JSON.stringify({ status: res.status, result: res.result });
      } catch (err) {
        return JSON.stringify({ status: 'failed', error: err.message });
      }
    },
  }),

  new DynamicStructuredTool({
    name: 'notification_management',
    description: 'Adjust Focus settings, Focus mode, driving mode, or quiet mode filters.',
    schema: z.object({
      mode: z.enum(['focus', 'driving', 'meeting', 'none']).describe('Select the notification filtering mode'),
    }),
    func: async ({ mode }) => {
      return JSON.stringify({
        status: 'success',
        activeMode: mode,
        message: `Notification focus mode set to "${mode}".`,
      });
    },
  }),

  new DynamicStructuredTool({
    name: 'browser_automation',
    description: 'Execute basic web tab actions such as opening Gmail, YouTube, or WhatsApp Web.',
    schema: z.object({
      target: z.enum(['gmail', 'youtube', 'whatsapp']).describe('Target web application'),
    }),
    func: async ({ target }) => {
      try {
        let res;
        if (target === 'gmail') res = await browserAutomationService.openGmail();
        if (target === 'youtube') res = await browserAutomationService.openYouTube();
        if (target === 'whatsapp') res = await browserAutomationService.openWhatsAppWeb();
        return JSON.stringify({ status: res.status, result: res.result });
      } catch (err) {
        return JSON.stringify({ status: 'failed', error: err.message });
      }
    },
  }),

  new DynamicStructuredTool({
    name: 'create_text_file',
    description: 'Create a local text file with specific content (e.g., notes, letters, memos, applications) and optionally open it.',
    schema: z.object({
      fileName: z.string().describe('The name of the file to create, e.g., application.txt'),
      content: z.string().describe('The text content to write into the file'),
      openFile: z.boolean().default(true).describe('Whether to automatically open the created file using the default editor (Notepad)'),
    }),
    func: async ({ fileName, content, openFile }) => {
      try {
        let desktopDir = path.join(os.homedir(), 'Desktop');
        try {
          await fs.access(desktopDir);
        } catch {
          const oneDriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
          try {
            await fs.access(oneDriveDesktop);
            desktopDir = oneDriveDesktop;
          } catch {
            desktopDir = os.homedir();
          }
        }
        const filePath = path.join(desktopDir, fileName);
        await fs.writeFile(filePath, content, 'utf8');
        
        if (openFile) {
          await systemCommandService.openTarget(filePath);
        }
        
        return JSON.stringify({
          status: 'success',
          filePath,
          message: `Successfully created text file "${fileName}" on your Desktop.${openFile ? ' Opening it in Notepad.' : ''}`,
        });
      } catch (err) {
        return JSON.stringify({ status: 'failed', error: err.message });
      }
    },
  }),
];
