import { Component, Inject, inject, Injectable, InjectionToken, input, ViewEncapsulation } from '@angular/core'


/**
 * Impossible Angular v21.x.x
 * Dependency injection.
 * The inject() method's options.
 * Author: Sergii Lutchyn
 *
 * Usage:
 * <ia-di-container></ia-di-container>
 */


export interface IDiService {
    id: string
    location: string
}

export const DI_LOCATION = new InjectionToken<string>('DI_LOCATION')
export const DI_SERVICE = new InjectionToken<IDiService>('DI_SERVICE')

@Injectable()
export class DiService implements IDiService {
    readonly id: string
    readonly location: string

    constructor(@Inject(DI_LOCATION) location: string) {
        this.id = Math.random().toString(36).substring(2, 9)
        this.location = location
        console.warn(`DiService created (ID: ${this.id}), location: ${location}`)
    }

}


// skipSelf, self


@Component({
    selector: 'ia-di-local',
    template: `<h2>Local - WITH providers</h2>
    <h3>Standard injection searches the entire hierarchy from current component up to the root</h3>
    <h3>skipSelf - skip service that provided locally and start search from parent component up to the root</h3>
    <h3>self - limits the search to the current element's injector</h3>
    <code>inject (standard) - location:[<b>{{ standard.location }}</b>] id:[<b>{{ standard.id }}</b>]</code><br>
    <code>inject (skipSelf: true) - location:[<b>{{ skipSelf?.location }}</b>] id:[<b>{{ skipSelf?.id }}</b>]</code><br>
    <code>inject (self: true) - location:[<b>{{ self?.location }}</b>] id:[<b>{{ self?.id }}</b>]</code><br>
    <code>inject (host: true) - location:[<b>{{ host?.location }}</b>] id:[<b>{{ host?.id }}</b>]</code><br>
    `,
    providers: [
        {provide: DI_SERVICE, useFactory: ()=>new DiService('local')}
    ]
})
export class DiLocalComponent {
    standard = inject(DI_SERVICE)
    skipSelf = inject(DI_SERVICE, {optional: true, skipSelf: true})
    self = inject(DI_SERVICE, {optional: true, self: true})
    host = inject(DI_SERVICE, {optional: true, host: true})
}


// host


@Component({
    selector: 'ia-di-child',
    template: `<h2>Child - NO providers</h2>
    <h3>host - limits the search to the current element's injector and ...</h3>
    <code>inject (standard) - location:[<b>{{ standard.location }}</b>] id:[<b>{{ standard.id }}</b>]</code><br>
    <code>inject (host: true) - location:[<b>{{ host?.location }}</b>] id:[<b>{{ host?.id }}</b>]</code><br>
    `
})
export class DiChildComponent {
    standard = inject(DI_SERVICE)
    host = inject(DI_SERVICE, {optional: true, host: true})
}

@Component({
    selector: 'ia-di-parent',
    template: `<h2>Parent - WITH providers</h2>
    <ia-di-child></ia-di-child>
    `,
    imports: [
        DiChildComponent
    ],
    providers: [
        {provide: DI_LOCATION, useValue: 'parent'},
        {provide: DI_SERVICE, useClass: DiService}
    ]

})
export class DiParentComponent {
}


// Self vs Host


@Component({
    selector: 'ia-di-projected',
    template: `<h2>Child (projected) - NO providers</h2>
    <h3>host option - limits the search to its direct PROJECTED parent with ng-content NOT regular parent</h3>
    <code>inject (self: true) - location:[<b>{{ self?.location }}</b>] id:[<b>{{ self?.id }}</b>]</code><br>
    <code>inject (host: true) - location:[<b>{{ host?.location }}</b>] id:[<b>{{ host?.id }}</b>]</code><br>
    `
})
export class DiChildHostComponent {
    self = inject(DI_SERVICE, {optional: true, self: true})
    host = inject(DI_SERVICE, {optional: true, host: true})
}

@Component({
    selector: 'ia-di-host',
    template: `<h2>Parent projected (ng-content) - WITH providers</h2>
    <ng-content></ng-content>
    `,
    providers: [
        {provide: DI_LOCATION, useValue: 'projected parent'},
        {provide: DI_SERVICE, useClass: DiService}
    ]
})
export class DiHostComponent {
}

@Component({
    selector: 'ia-di-container',
    imports: [
        DiLocalComponent,
        DiParentComponent,
        DiHostComponent,
        DiChildHostComponent
    ],
    template: `
        <ia-di-local></ia-di-local>
        <hr>
        <ia-di-parent></ia-di-parent>
        <hr>
        <ia-di-host>
            <ia-di-projected></ia-di-projected>
        </ia-di-host>
    `,
    styles: [`code {
      font-size: 16px
    }`],
    providers: [
        {provide: DI_LOCATION, useValue: 'root'},
        {provide: DI_SERVICE, useClass: DiService}
    ],
    encapsulation: ViewEncapsulation.None
})
export class DiContainerComponent {
}