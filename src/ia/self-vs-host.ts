import {Component, Directive, inject, Injectable, input} from '@angular/core';

/**
 * Impossible Angular v20.x.x
 * @Host vs @Self
 * Author: Sergii Lutchyn
 *
 * One crucial difference between `self` and `host` parameters for service injection.
 * It is projection!
 *
 * Usage:
 * <ia-self-host-container></ia-self-host-container>
 */


@Injectable()
export class TestService {
  readonly ID: string

  constructor() {
    this.ID = 'ID-' + Math.random().toString(36).substring(2, 7).toUpperCase()
  }
}

@Directive({
  selector: '[iaTestService]',
  providers: [TestService]
})
export class TestServiceDirective {
}

@Component({
  selector: 'ia-item',
  template: `
    <div [style.background]="color()">
      <h2>{{ label() }}</h2>
      <h3>Self: {{ self?.ID ?? 'NULL' }}</h3>
      <h3>Host: {{ host?.ID ?? 'NULL' }}</h3>
      @if (isParent()) {
        <ia-item label="Child" [isParent]="false"></ia-item>
      }
      <ng-content></ng-content>
    </div>
  `,
  imports: [],
  styles: `
    h2, h3 {
      margin: 2px;
    }

    div {
      padding: 10px;
      margin: 10px;
      border: 2px gray solid;
    }
  `
})
export class ItemComponent {
  label = input('')
  color = input('white')
  isParent = input(true)

  self = inject(TestService, {self: true, optional: true})
  host = inject(TestService, {host: true, optional: true})
}

@Component({
    selector: 'ia-self-host-container',
    imports: [
        ItemComponent,
        TestServiceDirective
    ],
    template: `
        <ia-item iaTestService label="Parent" color="grey">
            <ia-item [isParent]="false" label="Projected 1st level" color="skyblue">
                <ia-item [isParent]="false" label="Projected 2nd level" color="lime">
                </ia-item>
            </ia-item>
            <ia-item iaTestService [isParent]="false" label="Projected with own providers" color="lightcoral">
                <ia-item [isParent]="false" label="Projected 2nd level" color="lightgreen">
                </ia-item>
            </ia-item>
        </ia-item>
    `
})
export class SelfHostContainerComponent {
}
