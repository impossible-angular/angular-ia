# Impossible Angular

- [Quick start](#quick-start)
- [Impossible Angular - Youtube chanel](#impossible-angular-youtube-chanel)
    - [Dynamic Providers](#dynamic-providers)
    - [Dynamic Injector](#dynamic-injector)
    - [Dynamic @Input](#dynamic-input)
    - [@Self vs @Host](#self-vs-host)
- [Angular examples](#angular-examples)
    - [Directives](#directives)
    - [Pipes](#pipes)
    - [Routes](#routes)
    - [RxJS](#rxjs)
    - [Circular dependency with forwardRef](#circular-dependency-with-forwardref)
    - [Simplified implementation of ControlValueAccessor (CVA)](#simplified-implementation-of-controlvalueaccessor-cva)
    - [NgRx install](#ngrx)
    - [NgRx vs Signal](#ngrx-vs-signal)
    - [ZoneLess & OnPush](#zoneless--onpush)
- [Angular FAQ](#angular-faq)
    - [ng commands](#ng-commands)
    - [Environment & App Initializer](#environment--app-initializer)

### Quick start

All projects can be executed using the `npm run [project name]` script in package.json.

Example: for `Dynamic Providers`
```shell
npm install
npm run dynamic-providers
```

## Impossible Angular - Youtube chanel

### Dynamic Providers

[**Source file:** dynamic-providers.ts](src/ia/dynamic-providers.ts)

**Briefly**

Directives-based pattern for dynamic providers. Directives can share providers with a component.
Furthermore, `createComponent()` method can dynamically attach a directive to that component at runtime.

**Usage**
```HTML
<ia-widget-container></ia-widget-container>`
```

**Details**

Use `InjectionToken` as a general interface or abstraction for services.
```TypeScript
export const FOOD_TOKEN = new InjectionToken<IFood>('FoodToken')
```

For every service you want to inject dynamically, you need to create a directive.
```TypeScript
@Directive({
  providers: [{provide: FOOD_TOKEN, useFactory: () => new FruitsService()}]
})
export class FruitsDirective {}
```

Inject the token within the component that receives the dynamic provider.
```TypeScript
export class WidgetComponent {
  food = inject(FOOD_TOKEN)
}
```

When dynamically creating a component, use `ViewContainerRef.createComponent` and include the directive—which carries the desired service—in the `directives` option.
```TypeScript
export class WidgetContainerComponent {
  private widget = inject(ViewContainerRef)

  fruitClick() {
    this.widget.createComponent(WidgetComponent, {directives: [FruitsDirective]})
  }
}
```


### Dynamic Injector

[**Source file:** dynamic-injector.ts](src/ia/dynamic-injector.ts)

**Briefly**

Service injection inside function.
Assign `ApplicationRef.injector` to global variable inside `bootstrapApplication(...)`.

**Usage**

```HTML
<!--add to main.ts-->
.then((app) => setAppInjector(app.injector))
<!--use example container-->
<ia-injector-container></ia-injector-container>
```

**Details**

`bootstrapApplication` return `ApplicationRef` which has `injector` property.

```TypeScript
bootstrapApplication(App, appConfig)
    .then((app) => setAppInjector(app.injector))
```

Assign `ApplicationRef.injector` to a global variable and use it in any function. 
```TypeScript
let APP_INJECTOR: Injector

export function setAppInjector(injector: Injector) {
  APP_INJECTOR = injector
}

export { APP_INJECTOR }
```

The application's root injector can only resolve services that are `providedIn: 'root'`. 
```TypeScript
@Injectable(
  {providedIn: 'root'}
)
export class MessagesService {
  count = 0
}

const setMessageCount = (cnt: number) => {
  APP_INJECTOR.get(MessagesService).count += cnt
}
```

We can now use the helper function, `setMessageCount(N)`, which utilizes dynamic injection, anywhere in the application.
```TypeScript
export class AddMessageComponent {
  click() {
    setMessageCount(1)
  }
}
```


### Dynamic @Input

[**Source file:** dynamic-input.ts](src/ia/dynamic-input.ts)

**Briefly**

When applying `@Input` to a component created via `ViewContainerRef`,
you need to use the `setInput()` method. However, this approach does not dynamically update
the `@Input` properties in the same way that template-based bindings do.
How to make it possible?

**Usage**

```HTML
<ia-dyn-input></ia-dyn-input>
```

**Details**

The `CountLabelComponent` has a `count` signal input property that uses the model() function,
which allows modifying the binding value directly within this component.
The `count$: WritableSignal` is used to maintain a signal reference from the parent component.

```TypeScript
@Component({
  selector: 'app-count-label',
})
export class CountLabelComponent {

  count = model(0)

  count$: WritableSignal<number> = signal(0)

  constructor() {
    effect(() => {
      this.count.set(this.count$())
    })
  }
}
```

Consider `ia-dyn-input` component, where `ia-count-label` is created within the template
and separately through `ViewContainerRef.createComponent` method.
The `dynCount` signal property is assigned to both of these instances.

```TypeScript
@Component({
  selector: 'ia-dyn-input',
  template: `
    <button (click)="countClick()">Count ++</button>
    <ia-count-label [count]="dynCount()"></app-count-label>
    <button (click)="addLabelClick()">Add label dynamically</button>
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
```


### @Self vs @Host

[**Source file:** self-vs-host.ts](src/ia/self-vs-host.ts)

**Briefly**

One crucial difference between `self` and `host` parameters for service injection, it is projection.

**Usage**
```HTML
<ia-self-host-container></ia-self-host-container>
```

**Details**

`TestService` that generates an ID for each instance and `aiTestService` directive for dynamic provider.

```ts
@Injectable()
export class TestService {}

@Directive({
  selector: '[appTestService]',
  providers: [TestService]
}) export class TestServiceDirective {}
```

The `ItemComponent` with `ng-content` for projection.

```ts
@Component({
  selector: 'ia-item',
  template: `
      <h3>Self: {{ self?.ID ?? 'NULL' }}</h3>
      <h3>Host: {{ host?.ID ?? 'NULL' }}</h3>
      ...
      <ng-content></ng-content>
  `
})
export class ItemComponent {
  self = inject(TestService, {self: true, optional: true})
  host = inject(TestService, {host: true, optional: true})
}
```

Projected component doesn't inject service from parent component with `self: true` option.
```html
    <ia-item iaTestService label="Parent">
        <ia-item label="Projected component">
        </ia-item>
    </ia-item>
```

## Angular examples

### Directives

[**Source file:** directives.ts](src/ia/directives.ts)

**Briefly**

Examples of attribute and structural directives.

**Usage**
```HTML
<ia-directives-container></ia-directives-container>
```
**Details**

* **Attribute directives** use `ElementRef.nativeElement` and `Renderer2` to change element attributes.
* **Structural directives** use `TemplateRef` and `ViewContainerRef.createEmbeddedView` to create and manipulate elements in the DOM.


### Pipes

[**Source file:** pipes.ts](src/ia/pipes.ts)

**Briefly**

Examples of Custom `async` Pipe and Extensions of Angular Core Pipes

**Usage**

```HTML
<ia-pipes-container></ia-pipes-container>
```
**Details**

* The **Async** Pipe uses the pure: `false option` and a `Signal` instead of a regular value and the `detectChanges()` function. 
* The **Extension** Pipe utilizes the `base Angular` pipe class for standard invocation while accepting additional arguments to produce a custom result.

The **Angular async** pipe cannot get a value from an **Observable that is wrapped** within a function call in the template because of how the pipe manages its subscription and,
crucially, how change detection works.

```js

@Component({
    template: `Does not work! {{value | async}}`
})
export class AsyncComponent {
    // Observable that is wrapped within function
    value = () => interval(1000)
}
```

```js

@Component({
    template: `Works! {{value | async}}`
})
export class AsyncComponent {
    // Observable that assigned direct to value
    value = interval(1000)
}
```


### Routes

[**Source file:** routes.ts](src/ia/routes.ts)

**Briefly**

Angular Routing: 4 ways to send data through the router and 3 ways to access the current URL and state/history.

Lazy routes & components.

**Usage**

```HTML
<ia-routes-container></ia-routes-container>
```
**Details**

Angular Router Data Flow:

4 Ways to Pass Data:
* URL parameters
* Query parameters
* Router state data
* Router resolver data

3 Ways to Get URL/History:
* Using the Router service (.events/observables)
* Using the Router service (.url property)
* ActivatedRoute service (snapshots/observables).


### RxJS

[**Source file:** rxjs.ts](src/ia/rxjs.ts)

**Briefly**

An example of common usage of RxJS functions.

**Usage**

In the constructor uncomment the function that you want to run.
```angular2html
<ia-rxjs-container></ia-rxjs-container>
```

**Details**
* **of**: emits an array as a single value and as separate values as well.
* **from**: emits contents of array as separate values.
* **retry**: an error handling operator that resubscribes to the source observable if it throws an error.
* **catchError**: an error handling operator that intercepts an error in the observable stream.
* **Higher order mapping**: to get the result from one Observable and send it to another. Using switchMap, mergeMap, concatMap depends on the incoming stream.
* **switchMap** - cancels any previous inner observable subscriptions that are still in progress.
* **mergeMap** - subscribes to all inner observables concurrently.
* **concatMap** - subscribes to inner observables one at a time.
* **forkJoin** - runs all observables in parallel and waits for all of them to complete, return array of values.
* **concat** - chains observables together, running them sequentially, one-by-one manner.
* **take** - take n values from stream.
* **takeUntil** - cancel subscription with teardown subject.
* **takeWhile** - cancel subscription when condition is false.
* **scan** - handling continuous accumulation and emission of values, similar to .reduce((acc, cur)) function in array.
* **withLatestFrom** - combine main stream with one or more others.
* **tap** - call function sequentially


### Circular dependency with forwardRef

[**Source file:** forward-ref.ts](src/ia/forward-ref.ts)

**Briefly**

To resolve circular dependency use `forwardRef`. To get parent's method from child component.

**Usage**
```HTML
<ia-parent></ia-parent>`
```

InjectionToken for parent component `PARENT_COMPONENT`

```TypeScript
export const PARENT_COMPONENT = new InjectionToken<ParentComponent>('Parent Component Instance')
```

Child component where we inject and call parent's method `greet()`

```TypeScript
@Component({})
export class ChildComponent {
    private parent = inject<ParentComponent>(PARENT_COMPONENT)

    constructor() {
        this.parent.greet('ChildComponent')
    }

}
```

Parent component where we defined a provider to itself.

```TypeScript
@Component({
    template: `<app-child></app-child>`,
    imports: [ChildComponent],
    providers: [
        {
            provide: PARENT_COMPONENT,
            useExisting: forwardRef(() => ParentComponent)
        }
    ]
})
export class ParentComponent {
    greet(name: string): void {
        console.log(`Hello, ${name}! I am your Parent component.`)
    }
}
```

### Simplified implementation of ControlValueAccessor (CVA)

[**Source file:** cva.ts](src/ia/cva.ts)

**Briefly**

This example is designed to illustrate key Angular concepts, such as Dependency Injection, and core JavaScript techniques, including closures and callback functions.

**Usage**

```HTML
<ia-cva-container></ia-cva-container>
```

**Hot it works.**

The component that wants to be CVA registered a InjectionToken `IA_FORM_CONTROL` that references to itself using forwardRef.

That allows directive use same InjectionToken `IA_FORM_CONTROL` to inject host component.

Also implement and register the necessary callback functions from `IValueControlAccessor` interface for change tracking and validation.

All change detection and validation functionality located within directive.

**Details**

InjectionToken for host component and directive.

```ts
export const IA_FORM_CONTROL = new InjectionToken<IValueControlAccessor>('CVA')
```

Simplified `IValueControlAccessor` interface
```ts
export interface IValueControlAccessor {}
```

Simplified `FormControl` with simple validator validate()
```ts
export class IaFormControl {}
```

Simplified `FormControl` directive. **All magic here.**

```ts

@Directive({
    selector: '[iaFormControl]'
})
export class IaFormControlDirective {
    formControlItem = input.required<IaFormControl>({alias: 'iaFormControl'})
    // host ValueControlAccessor component
    private componentAccessor = inject<IValueControlAccessor>(IA_FORM_CONTROL)

    constructor() {
        // Overide onChange(value: any) function inside host component
        // and .bind(this) is used to bind its context to the directive.
        // Now, the overridden onChange() function that is called in the host component will execute the directive's onChange() method. 
        this.componentAccessor.registerOnChange(this.onChange.bind(this))
        // ........
    }

    onChange(value: any) {
        console.warn('onChange FormControl', value)
        this.formControlItem().setValue(value)
        this.formControlItem().validate()
    }
}
```

The CVA component has a circular dependency declaration that allow to inject this component into directive.
```ts
@Component({
    selector: 'ia-cva-input',
    template: `<input [ngModel]="value" (ngModelChange)="writeValue($event)">`,
    imports: [
        FormsModule
    ],
    providers: [
        {
            provide: IA_FORM_CONTROL,
            useExisting: forwardRef(() => IaCvaInputComponent)
        }
    ]
})
export class IaCvaInputComponent implements IValueControlAccessor {
    value: any

    writeValue(value: any): void {
        this.value = value
        this.onChange(value)
    }

    registerOnChange(fn: any): void {
        this.onChange = fn
    }
    
    // This function will be overridden by the directive using the registerOnChange() method.
    onChange: any = () => {
    }
}
```

The example component creates a `FormControl` instance and uses the [iaFormControl] directive
to link it to the accessor component, applying the necessary change and validation rules.
```ts
@Component({
    selector: 'ia-cva-container',
    template: `
        <ia-cva-input [iaFormControl]="iaForm"></ia-cva-input>
    `
})
export class CvaContainerComponent {
    iaForm = new IaFormControl(0, this.minValidator(5))
}
```


### NgRx

Install NgRx store
```shell
ng add @ngrx/store@latest
```

Install NgRx store devtools in project. In Chrome add extension `Redux DevTools`
```shell
ng add @ngrx/store-devtools@latest
```

### NgRx vs Signal

[**Source file:** ngrx-vs-signal.ts](src/ia/ngrx-vs-signal.ts)

**Briefly**

Compare the implementation of CRUD operations using the `NgRx store` versus a `Service with Signals`.

**Usage**
```HTML
<ia-ngrx-signal></ia-ngrx-signal>
```

**Details**

For your consideration, here are two ways for implementing state management.

For the Signals implementation, the `freezeArgs` decorator is used; it freezes the object in the same way that NgRx does.

### ZoneLess & OnPush

[**Source file:** zoneless.ts](src/ia/zoneless.ts)

**Briefly**

Behaviours in `Zoneless` application with `Default` and `OnPush` change detection strategy.

**Usage**

```HTML
<ia-zoneless-container></ia-zoneless-container>
```

**Details**

Behaviors of Change Detection with `ChangeDetectorRef` (`markForCheck`, `detectChanges`)

* `async` Pipe calls `ChangeDetectorRef.markForCheck` automatically.

```code
[level-1](Default):                 -> update
[level-2](Default): markForCheck()  -> update
[level-3](Default):                 -> update
```

```code
[level-1](Default):                 -> NOT update
[level-2](Default): detectChanges() -> update
[level-3](Default):                 -> update
```

```code
[level-1](OnPush):                 -> update
[level-2](OnPush): markForCheck()  -> update
[level-3](OnPush):                 -> NOT update
```

```code
[level-1](OnPush):                  -> NOT update
[level-2](OnPush): detectChanges()  -> update
[level-3](OnPush):                  -> NOT update
```

The **Asymmetric Change Detection** error occurs when a parent component using the `Default` strategy
updates a simple bound value in its template during the same change detection cycle in which a child component
updates a `Signal` that is `read within the template`.

```code
[level-1](Default):                 -> ExpressionChangedAfterItHasBeenChecked
[level-2](Default): signal.set()    -> update
[level-3](Default):                 -> update
```

```code
[level-1](OnPush):                 -> NOT update
[level-2](OnPush): signal.set()    -> update
[level-3](OnPush):                 -> NOT update
```

**It's recommended to move the application to a `zoneless` and `OnPush` strategy with reactive values (`Signals` or `Observables`).**

Calls change detection automatically:

* `async` Pipe calls `ChangeDetectorRef.markForCheck`
* Updating a `signal` that's `read in a template`

Untested yet

* `ComponentRef.setInput`
* Bound host or template listeners callbacks
* Attaching a view that was marked dirty by one of the above

## Angular FAQ

### ng commands

Install latest `angular cli`

``` shell
npm install --location=global @angular/cli@latest
```

The new minimalistic `test` project.
```shell
ng new test --minimal --zoneless --style scss --ssr false --ai-config none
```

Check updates
```shell
ng update
```

Update angular packages
```shell
ng update @angular/cli @angular/core
```

Update some packages to with old peer dependency
```shell
npm install --legacy-peer-deps @ngrx/store
```

### Environment & App Initializer

Both `provideEnvironmentInitializer` and `provideAppInitializer` are functions used in Angular to run setup logic before the application fully starts.

* **provideEnvironmentInitializer** 
  * This runs `before` the root application component is created and rendered.
  * `Doesn't block` app bootstrap if injected service returns Observable.
  * Ideal for setting up `environment-level` services like `logging`, `feature flags`, or `theme services`.
  * It has access to **any providers** defined in the current environment scope.
* **provideAppInitializer** 
  * This runs `after` the environment and all providers are configured, but `before` the application's main bootstrap process can complete.
  * `Block` app bootstrap if injected service returns an Observable; Angular waits until it completes.
  * Primarily used for loading critical, asynchronous data like `user session details`, necessary `configuration files`, or `feature flags from an API`.
  * It can safely depend on any service that is provided in the **root injector**.

```angular2html
@Components(...)
exports components AppComponent {
    // Don't use dummy injection or comments: "Don't remove this line"
    dummyService = inject(SomeDummyService)
}
```
Use `provideEnvironmentInitializer` or `provideAppInitializer`
```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideEnvironmentInitializer(() => {
        inject(SomeDummyService)
    }),
    provideAppInitializer(...)
  ]
}
```