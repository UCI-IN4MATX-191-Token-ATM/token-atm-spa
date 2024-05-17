import type { Duration as Duration_date_fns } from 'date-fns';
import type { DurationData } from './date-fns-duration';
import { assert } from 'spec.ts';

// Use spec.ts to check original and io-ts types are equivalent at compile time
const _: unknown = {};
assert(_ as Duration_date_fns, _ as DurationData);
