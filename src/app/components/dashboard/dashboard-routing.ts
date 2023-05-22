import type { Component, Type } from '@angular/core';
import type { Course } from 'app/data/course';
import type { Route, Routes } from '@angular/router';
import { RequestProcessComponent } from '../request-process/request-process.component';
import { TokenOptionConfigurationComponent } from '../token-option-configuration/token-option-configuration.component';
import { StudentListComponent } from '../student-list/student-list.component';
import { DEV_GUARD } from 'app/utils/dev-guard';
import { DevTestComponent } from '../dev-test/dev-test.component';

export interface CourseConfigurable {
    configureCourse(course: Course): Promise<void>;
}

type CourseConfigurableComponent = CourseConfigurable & Component;

export type TokenATMDashboardRouteSpecific = {
    name: string;
    path: string;
    component: Type<CourseConfigurableComponent>;
    isDev?: boolean;
};

export type TokenATMDashboardRoute = TokenATMDashboardRouteSpecific & Route;

export const TOKEN_ATM_DASHBOARD_ROUTES: TokenATMDashboardRoute[] = [
    {
        name: 'Process Request',
        path: 'process-request',
        component: RequestProcessComponent
    },
    {
        name: 'Token Options',
        path: 'configure-token-options',
        component: TokenOptionConfigurationComponent
    },
    {
        name: 'Students',
        path: 'students',
        component: StudentListComponent
    },
    {
        name: 'Dev-Test',
        path: 'dev-test',
        component: DevTestComponent,
        canActivate: [DEV_GUARD],
        isDev: true
    }
];

const DEFAULT_ROUTING = 'process-request';

export function getDashboardRoutes(): Routes {
    return [
        ...TOKEN_ATM_DASHBOARD_ROUTES.map((route: TokenATMDashboardRoute) => {
            return {
                ...route,
                name: undefined
            };
        }),
        {
            path: '',
            redirectTo: DEFAULT_ROUTING,
            pathMatch: 'full'
        }
    ];
}
