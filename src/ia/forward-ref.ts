import { Component, forwardRef, inject, InjectionToken } from '@angular/core'

/**
 * Impossible Angular v20.x.x
 * forwardRef & circular dependency
 * Author: Sergii Lutchyn
 *
 * Get parent's method from child component
 *
 * Usage:
 * <ia-parent></ia-parent>
 */

export const PARENT_COMPONENT = new InjectionToken<ParentComponent>('Parent Component Instance')

@Component({
    selector: 'ia-child',
    template: `<h3>Child call parent's method. <u>this.parent.greet('ChildComponent')</u>. Check Console</h3>`
})
export class ChildComponent {
    // Inject parent component throw InjectionToken
    private parent = inject<ParentComponent>(PARENT_COMPONENT)

    constructor() {
        this.parent.greet('ChildComponent')
    }

}

@Component({
    selector: 'ia-parent',
    template: `
        <h2>Parent Component</h2>
        <ia-child></ia-child>
    `,
    imports: [ChildComponent],
    // *** This is where the circular reference occurs ***
    providers: [
        {
            provide: PARENT_COMPONENT,
            // 2. Alias: Use the existing instance of ParentComponent (the component itself)
            //    This is where we must use forwardRef, as ParentComponent is not fully
            //    defined yet when the providers array is evaluated.
            useExisting: forwardRef(() => ParentComponent)
        }
    ]
})
export class ParentComponent {
    // Simple method for the child to call
    greet(name: string): void {
        console.warn(`Hello, ${name}! I am your Parent component.`)
    }
}
