import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseSelectionComponent } from './components/course-selection/course-selection.component';
import { getDashboardRoutes } from './components/dashboard/dashboard-routing';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { AUTH_GUARD } from './utils/auth-guard';
import { GridViewExternalAccessComponent } from './components/grid-view-external-access/grid-view-external-access.component';

const routes: Routes = [
    { path: 'grid-view', component: GridViewExternalAccessComponent },
    { path: 'login', component: LoginComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        children: getDashboardRoutes(),
        canActivate: [AUTH_GUARD],
        canActivateChild: [AUTH_GUARD]
    },
    { path: 'select-course', component: CourseSelectionComponent, canActivate: [AUTH_GUARD] },
    { path: '', pathMatch: 'full', redirectTo: '/login' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
