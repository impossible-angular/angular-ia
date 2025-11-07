import {Component, effect, inject, input, model, signal, ViewContainerRef, WritableSignal} from '@angular/core';

/**
 * Impossible Angular v20.x.x
 * Dynamic @Input base on signal
 * Author: Sergii Lutchyn
 *
 * When applying @Input to a component created via ViewContainerRef, you need to use the setInput() method.
 * However, this approach does not dynamically update the @Input properties in the same way that template-based bindings do.
 *
 * Usage:
 * <ia-dyn-input></ia-dyn-input>
 */

/**
 * The `CountLabelComponent` has a `count` signal input property that uses the model() function,
 * which allows modifying the binding value directly within this component.
 * The `count$: WritableSignal` is used to maintain a signal reference from the parent component.
 */
@Component({
  selector: 'ia-count-label',
  template: `Created in <b>{{ label() }}</b>: Count: {{ count() }}`,
  styles: `:host {
    display: block;
  }`
})
export class CountLabelComponent {
  label = input('Template')
  count = model(0)

  count$: WritableSignal<number> = signal(0)

  constructor() {
    effect(() => {
      this.count.set(this.count$())
    })
  }
}


/**
 * Consider `ia-dyn-input` component, where `ia-count-label` is created within the template
 * and separately through `ViewContainerRef.createComponent` method.
 * The `dynCount` signal property is assigned to both of these instances.
 */
@Component({
  selector: 'ia-dyn-input',
  imports: [
    CountLabelComponent
  ],
  template: `
    <button (click)="countClick()">Count ++</button>
    <ia-count-label [count]="dynCount()"></ia-count-label>
    <button (click)="addLabelClick()">Add label dynamically with input</button>
  `
})
export class DynInputComponent {

  dynCount = signal(0)
  readonly viewContainerRef = inject(ViewContainerRef)

  countClick() {
    this.dynCount.update(v => ++v)
  }

  addLabelClick() {
    const comp = this.viewContainerRef.createComponent(CountLabelComponent)
    comp.setInput('label', 'ViewContainerRef')
    comp.instance.count$ = this.dynCount
  }

}
