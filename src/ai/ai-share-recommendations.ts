'use server';

/**
 * @fileOverview Analyzes a user's social network connections and provides
 * recommendations on how to customize product sharing messages to maximize engagement.
 *
 * - getShareRecommendations - A function that handles the social share recommendations process.
 * - ShareRecommendationsInput - The input type for the getShareRecommendations function.
 * - ShareRecommendationsOutput - The return type for the getShareRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShareRecommendationsInputSchema = z.object({
  socialNetworkData: z
    .string()
    .describe(
      'A data dump of the user social network connections and their interests.'
    ),
  productDescription: z.string().describe('The description of the product.'),
  messageTemplate: z.string().describe('The original message to be shared.'),
});
export type ShareRecommendationsInput = z.infer<typeof ShareRecommendationsInputSchema>;

const ShareRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe(
      'A list of recommendations on how to customize the share message to maximize engagement.'
    ),
});
export type ShareRecommendationsOutput = z.infer<typeof ShareRecommendationsOutputSchema>;

export async function getShareRecommendations(
  input: ShareRecommendationsInput
): Promise<ShareRecommendationsOutput> {
  return shareRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shareRecommendationsPrompt',
  input: {schema: ShareRecommendationsInputSchema},
  output: {schema: ShareRecommendationsOutputSchema},
  prompt: `You are an expert in social media marketing. Given a user's social
network data, product description, and a message template, you will provide
recommendations on how to customize the message to maximize engagement.

Social Network Data: {{{socialNetworkData}}}
Product Description: {{{productDescription}}}
Message Template: {{{messageTemplate}}}

Provide a list of recommendations.`,
});

const shareRecommendationsFlow = ai.defineFlow(
  {
    name: 'shareRecommendationsFlow',
    inputSchema: ShareRecommendationsInputSchema,
    outputSchema: ShareRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
