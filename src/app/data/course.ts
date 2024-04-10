import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';
import { chain } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { CanvasIdentifier, CanvasIdentifierDataDef } from './canvas-identifier';

export const CourseDataDef = t.intersection([
    CanvasIdentifierDataDef,
    t.strict({
        term: CanvasIdentifierDataDef,
        timeZone: t.string
    })
]);

export type CourseData = t.TypeOf<typeof CourseDataDef>;
export type RawCourseData = t.OutputOf<typeof CourseDataDef>;

export class Course implements CourseData {
    public id = '';
    public name = '';
    public term = new CanvasIdentifier();
    public timeZone = '';
}

export const CourseDef = new t.Type<Course, unknown, unknown>(
    'Assignment',
    (v): v is Course => v instanceof Course,
    (v, ctx) =>
        chain((v: CourseData) => t.success(Object.assign(new Course(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            CourseDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => decamelizeKeys(CourseDataDef.encode(v))
);
