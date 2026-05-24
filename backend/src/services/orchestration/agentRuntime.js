import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { systemTools } from './toolRegistry.js';

export const agentRuntime = {
  executeCommand: async ({ userId, command, userContext = {} }) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Gemini API key is not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY in your env file.'
      );
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey,
      modelName: 'gemini-1.5-flash',
      temperature: 0.2,
      maxOutputTokens: 1024,
    });

    const tools = systemTools(userId, userContext);

    // Initialize modern LangGraph agent
    const agent = createReactAgent({
      llm: model,
      tools,
    });

    // Run the agent
    const result = await agent.invoke({
      messages: [{ role: 'user', content: command }],
    });

    const messages = result.messages || [];
    const lastMessage = messages[messages.length - 1];
    const output = lastMessage ? lastMessage.content : '';

    // Extract tool calls as intermediate steps
    const intermediateSteps = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const toolCall = msg.tool_calls[0];
        const nextMsg = messages[i + 1];
        const observation = nextMsg && nextMsg.role === 'tool' ? nextMsg.content : '';

        intermediateSteps.push({
          action: {
            tool: toolCall.name,
            toolInput: toolCall.args,
          },
          observation,
        });
      }
    }

    return {
      output,
      intermediateSteps,
    };
  },
};
