import { Component, inject, Injectable, Injector } from '@angular/core'

/**
 * Impossible Angular v20.x.x
 * Dynamic Injector
 * Author: Sergii Lutchyn
 *
 * Service injection inside function.
 * Using global variable and ApplicationRef.injector inside bootstrapApplication(...)
 *
 * Usage:
 * add to main.ts
 * .then((app) => setAppInjector(app.injector))
 *
 * add to app.ts
 * <ia-injector-container></ia-injector-container>
 */


// Add to separate file app-injector.ts in production
let APP_INJECTOR: Injector
export function setAppInjector(injector: Injector) {
    APP_INJECTOR = injector
}
export { APP_INJECTOR }
// ***************************************************

@Injectable(
    {providedIn: 'root'}
)
export class MessagesService {
    count = 0
}

// injection inside function
const setMessageCount = (cnt: number) => {
    APP_INJECTOR.get(MessagesService).count += cnt
}


@Component({
    selector: 'ia-toolbar',
    template: `
        <hr>
        <h1>Message count: {{ messages?.count }}</h1>
        <hr>
    `
})
export class ToolbarComponent {
    readonly messages = inject(MessagesService)
}

@Component({
    selector: 'ia-add-message',
    template: `<button (click)="click()">Add Message</button>`
})
export class AddMessageComponent {
    click() {
        setMessageCount(1)
    }
}

@Component({
    selector: 'ia-del-message',
    template: `<button (click)="click()">Del Message</button>`
})
export class DelMessageComponent {
    click() {
        setMessageCount(-1)
    }
}


@Component({
    selector: 'ia-injector-container',
    imports: [
        ToolbarComponent,
        AddMessageComponent,
        DelMessageComponent
    ],
    template: `
        <ia-toolbar></ia-toolbar>
        <ia-add-message></ia-add-message>
        <ia-del-message></ia-del-message>`
})
export class InjectorContainerComponent {
}
