import { Component, Directive, inject, Injectable, InjectionToken, ViewContainerRef } from '@angular/core'

/**
 * Impossible Angular v20.x.x
 * Dynamic Providers
 * Author: Sergii Lutchyn
 *
 * Services dynamically injected into providers
 * Directive share providers with a component and
 * createComponent method can add directive to component in runtime
 *
 * Usage:
 * <ia-widget-container></ia-widget-container>
 */

export interface IFood {
  label: string
  list: Array<string>
}

export const FOOD_TOKEN = new InjectionToken<IFood>('FoodToken')

@Injectable()
export class FruitsService implements IFood {
  label = 'Fruits'
  list = ['Mango', 'Chery', 'Grape']
}

@Directive({
  providers: [{provide: FOOD_TOKEN, useFactory: () => new FruitsService()}]
})
export class FruitsDirective {
}


@Injectable()
export class VegetablesService implements IFood {
  label = 'Vegetables'
  list = ['Carrot', 'Avocado', 'Onion']
}

@Directive({
  providers: [{provide: FOOD_TOKEN, useFactory: () => new VegetablesService()}]
})
export class VegetablesDirective {
}

@Component({
  selector: 'ia-widget',
  template: `
    <h1>{{ food.label }}</h1>
    @for (item of food.list; track item) {
      <p>{{ item }}</p>
    }
`,
  styles: `
    :host {
      display: block;
      border: 2px solid black;
      width: 200px
    }`
})
export class WidgetComponent {
  food = inject(FOOD_TOKEN)
}

@Component({
  selector: 'ia-widget-container',
  template: `
    <button (click)="fruitClick()">Fruit</button>
    <button (click)="vegetablesClick()">Vegetables</button>
  `
})
export class WidgetContainerComponent {
  private widget = inject(ViewContainerRef)

  fruitClick() {
    this.widget.createComponent(WidgetComponent, {directives: [FruitsDirective]})
  }

  vegetablesClick() {
    this.widget.createComponent(WidgetComponent, {directives: [VegetablesDirective]})
  }

}
