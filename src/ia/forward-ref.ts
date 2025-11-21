import { Component, forwardRef, inject, InjectionToken } from '@angular/core'

/**
 * Impossible Angular v21.x.x
 * forwardRef & circular dependency
 * Author: Sergii Lutchyn
 *
 * Get parent's method from child component
 *
 * Usage:
 * <ia-parent></ia-parent>
 */

export const IA_PARENT_COMPONENT = new InjectionToken<ParentComponent>('Parent Component Instance')

@Component({
    selector: 'ia-child',
    template: `<code>Child call parent's method => <b>.greet('ChildComponent')</b>. Check Console.</code>`
})
export class ChildComponent {
    // Inject parent component throw InjectionToken
    private parent = inject<ParentComponent>(IA_PARENT_COMPONENT)

    constructor() {
        this.parent.greet('ChildComponent')
    }

}

@Component({
    selector: 'ia-parent',
    template: `
        <h3>Parent Component</h3>
        <ia-child></ia-child>
    `,
    imports: [ChildComponent],
    providers: [
        {
            // *** This is where the circular reference occurs ***
            provide: IA_PARENT_COMPONENT,
            // Alias: Use the existing instance of ParentComponent (the component itself)
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
