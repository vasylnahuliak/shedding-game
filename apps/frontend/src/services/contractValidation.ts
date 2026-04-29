import {
  type JsonInputSource,
  parseJsonInput,
  type Schema,
  type SchemaOutput,
} from '@shedding-game/shared';

import { LoggingService } from './LoggingService';

type ResponseLike = JsonInputSource & {
  status?: number;
  url?: string;
};

export const parseApiResponse = async <const TSchema extends Schema>(
  response: ResponseLike,
  schema: TSchema,
  requestLabel: string
): Promise<SchemaOutput<TSchema>> => {
  try {
    return await parseJsonInput(schema, response);
  } catch (error) {
    LoggingService.apiError(`${requestLabel} returned an invalid contract payload`, error, {
      status: response.status,
      url: response.url,
    });
    throw error;
  }
};
