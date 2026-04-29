import * as v from 'valibot';

export type Schema<TInput = unknown, TOutput = TInput> = v.GenericSchema<
  TInput,
  TOutput,
  v.BaseIssue<unknown>
>;

export type SchemaInput<TSchema extends Schema> = v.InferInput<TSchema>;
export type SchemaOutput<TSchema extends Schema> = v.InferOutput<TSchema>;

export type SchemaMap = Record<string, Schema>;
export type SchemaMapOutput<TSchemas extends SchemaMap> = {
  [TKey in keyof TSchemas]: SchemaOutput<TSchemas[TKey]>;
};

export interface JsonInputSource {
  json(): Promise<unknown>;
}

export const parseWithSchema = <const TSchema extends Schema>(
  schema: TSchema,
  input: unknown
): SchemaOutput<TSchema> => {
  return v.parse(schema, input);
};

export const safeParseWithSchema = <const TSchema extends Schema>(
  schema: TSchema,
  input: unknown
) => {
  return v.safeParse(schema, input);
};

export const parseJsonInput = async <const TSchema extends Schema>(
  schema: TSchema,
  source: JsonInputSource
): Promise<SchemaOutput<TSchema>> => {
  return parseWithSchema(schema, await source.json());
};
