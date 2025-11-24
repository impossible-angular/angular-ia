import { Component, inject, Injectable } from '@angular/core'
import { ActivatedRoute, NavigationEnd, ResolveFn, Router, RouterLink, RouterOutlet, Routes } from '@angular/router'
import { AsyncPipe, JsonPipe } from '@angular/common'
import { filter, Observable, of } from 'rxjs'

/**
 * Impossible Angular v21.x.x
 * Angular Routing: 4 ways to send data through the router and 3 ways to access the current URL and state/history.
 * Author: Sergii Lutchyn
 *
 * Angular Router Data Flow:
 * 4 Ways to Pass Data:
 *      URL parameters
 *      Query parameters
 *      Router state data
 *      Router resolver data
 *
 * 3 Ways to Get URL/History:
 *      Using the Router service (.events/observables)
 *      Using the Router service (.url property)
 *      ActivatedRoute service (snapshots/observables).
 *
 * Usage:
 * <ia-routes-container></ia-routes-container>
 */

@Injectable({providedIn: 'root'})
export class NavHistoryService {
    readonly navHistory: Array<string> = []

    constructor(router: Router) {
        router.events
            .pipe(
                filter(event => event instanceof NavigationEnd)
            )
            .subscribe((event: any) => {
                console.debug('NavigationEnd', event.url, event)
                this.navHistory.push(event.url)
            })
    }

}

@Component({
    selector: 'ia-home',
    template: `HOME COMPONENT`
})
export class HomeComponent {
}

@Component({
    selector: 'ia-lazy-child',
    template: `LAZY CHILD COMPONENT`,
    styles: [':host{display: block; background: bisque};']
})
export class LazyChildComponent {
}

@Component({
    selector: 'ia-lazy',
    imports: [
        RouterOutlet,
        RouterLink
    ],
    template: `LAZY COMPONENT
    <hr>
    <a [routerLink]="'lazy-child'">Lazy child</a>
    <hr>
    Child router-outlet
    <hr>
    <router-outlet></router-outlet>`,
    styles: [':host{display: block; background: lightblue}; hr{border-top: 1px solid blue}']
})
export class LazyComponent {
}

@Component({
    selector: 'ia-page',
    imports: [
        AsyncPipe,
        JsonPipe
    ],
    template: `
        <h3>Details page</h3>
        @let params = activatedRoute.params | async | json;
        @if (params !== '{}') {
            <h4>activatedRoute.params: {{ params }}</h4>
            <h4>static router data: {{ activatedRoute.data | async | json }}</h4>
        }
        @let query = activatedRoute.queryParams | async | json;
        @if (query !== '{}') {
            <h4>activatedRoute.queryParams: {{ query }}</h4>
            <h4>resolver router data: {{ activatedRoute.data | async | json }}</h4>
        }
        Router: url => {{ router.url }}<br>
        ActivatedRoute: snapshot.url => {{ activatedRoute.snapshot.url }}
    `
})
export class PageComponent {
    activatedRoute = inject(ActivatedRoute)
    router = inject(Router)
}

@Component({
    selector: 'ia-routes-container',
    imports: [
        RouterOutlet,
        RouterLink
    ],
    template: `
        <a [routerLink]="'home'">Home</a>
        <a [routerLink]="'details/id-1'">params (id-1)</a>
        <a [routerLink]="'details'" [queryParams]="{q:'id-2'}">queryParams (id-2)</a>
        <a [routerLink]="'lazy'">LAZY routes</a>
        <hr>
        <router-outlet></router-outlet>
        <hr>
        <h4>Navigation history from Router.events</h4>
        <p>
            @for (url of nav.navHistory; track $index) {
                <code>{{ $index }} => {{ url }}</code><br>
            }
        </p>
    `,
    styles: [`
      a {
        margin: 10px;
      }
    `]
})
export class RoutesContainerComponent {
    nav = inject(NavHistoryService)
}

export const detailsResolver: ResolveFn<Observable<any>> = () => {
    return of('Hello from router resolver')
}

// root routers
export const routes: Routes = [
    {path: 'home', component: HomeComponent},
    {path: 'details/:id', component: PageComponent, data: {title: 'Hello data router'}},
    {path: 'details', component: PageComponent, resolve: {title: detailsResolver}},
    // import('@ia/routes').then(mod => mod.lazyRoutes)
    {path: 'lazy', loadChildren: () => lazyRoutes},
    {path: '', redirectTo: '/home', pathMatch: 'full'}
]

// lazy loaded routers
export const lazyRoutes: Routes = [
    // import('@ia/routes').then(c => c.LazyComponent)
    {
        path: '', loadComponent: () => LazyComponent,
        children: [
            {path: 'lazy-child', component: LazyChildComponent}
        ]
    },
    {path: '', redirectTo: '/', pathMatch: 'full'}
]