'use server';
/**
 * @fileOverview An AI flow for parsing natural language commands to record a golf shot.
 *
 * - parseShotCommand - A function that handles parsing the command.
 * - ShotCommandInput - The input type (the text transcript).
 * - ShotCommandOutput - The structured output type (lie, distance, units, club).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CLUBS, ShotCommandInputSchema, type ShotCommandInput, ShotCommandOutputSchema, type ShotCommandOutput } from '@/lib/types';


export async function parseShotCommand(command: ShotCommandInput): Promise<ShotCommandOutput> {
    return parseShotCommandFlow(command);
}

const shotParserPrompt = ai.definePrompt({
    name: 'shotParserPrompt',
    input: { schema: ShotCommandInputSchema },
    output: { schema: ShotCommandOutputSchema },
    prompt: `
        You are an expert golf assistant. Your task is to parse a user's spoken command about their last shot and extract the relevant information.

        The user will provide a string of text. You need to determine the following:
        1.  **Lie**: Where the shot was taken from. It must be one of: Tee, Fairway, Rough, Sand, Green.
        2.  **Distance**: The distance to the pin.
        3.  **Units**: Whether the distance is in "yards" or "feet". If the lie is "Green", the units are almost always "feet". Otherwise, they are "yards".
        4.  **Club**: The club used. This is optional. If mentioned, identify it.

        Here are the valid clubs: ${CLUBS.join(', ')}. Map common names like 'driver' to 'Dr' or 'sand wedge' to 'SW'. If a specific iron is mentioned (e.g., '7 iron'), just use '7i'.

        Analyze the following command and return the data in the requested JSON format.

        Command: {{{prompt}}}
    `,
});

const parseShotCommandFlow = ai.defineFlow(
    {
        name: 'parseShotCommandFlow',
        inputSchema: ShotCommandInputSchema,
        outputSchema: ShotCommandOutputSchema,
    },
    async (command) => {
        const { output } = await shotParserPrompt(command);
        if (!output) {
            throw new Error('Failed to parse the shot command.');
        }
        return output;
    }
);
