import type { Component, Type } from '@angular/core';
import type { Course } from 'app/data/course';
import type { Routes } from '@angular/router';
import { RequestProcessComponent } from '../request-process/request-process.component';
import { TokenOptionConfigurationComponent } from '../token-option-configuration/token-option-configuration.component';
import { StudentListComponent } from '../student-list/student-list.component';

export interface CourseConfigurable {
    configureCourse(course: Course): Promise<void>;
}

type CourseConfigurableComponent = CourseConfigurable & Component;

export type TokenATMDashboardRoute = {
    name: string;
    path: string;
    component: Type<CourseConfigurableComponent>;
};

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
    }
];

const DEFAULT_ROUTING = 'process-request';

export function getDashboardRoutes(): Routes {
    return [
        ...TOKEN_ATM_DASHBOARD_ROUTES.map((route: TokenATMDashboardRoute) => {
            return { path: route.path, component: route.component };
        }),
        {
            path: '',
            redirectTo: DEFAULT_ROUTING,
            pathMatch: 'full'
        }
    ];
}
