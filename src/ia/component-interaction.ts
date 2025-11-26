import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    Directive,
    forwardRef,
    Host,
    inject,
    Injectable,
    InjectionToken,
    input,
    OnInit,
    output,
    OutputEmitterRef,
    signal,
    Type,
    viewChild,
    ViewContainerRef,
    WritableSignal
} from '@angular/core'
import { interval, map, take } from 'rxjs'
import { NgTemplateOutlet } from '@angular/common'
import { FormsModule } from '@angular/forms'


/**
 * Impossible Angular v21.x.x
 * 7 methods of component interaction
 * Author: Sergii Lutchyn
 *
 * Usage:
 * <ia-interaction-container></ia-interaction-container>
 */


// 1. input/output interaction: using parameters with two-way binding [name]: input, [name]Change: output.


@Component({
    selector: 'ia-io-child',
    template: `<h3>{{ title() }}</h3>
    <input [ngModel]="text()" (ngModelChange)="handleChange($event)">`,
    imports: [
        FormsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IOChildComponent {
    text = input<string>()
    textChange = output<string>()

    title = computed(() => {
        console.log('child computed(): text =>', this.text())
        return `Child text: ${this.text()}`
    })

    handleChange(value: string) {
        this.textChange.emit(value)
    }
}


@Component({
    selector: 'ia-io-parent',
    template: `
        <h2>1. input/output parameters</h2>
        <h3>{{ title() }}</h3>
        <ia-io-child [(text)]="textValue"></ia-io-child>
    `,
    imports: [
        IOChildComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IOParentComponent {
    textValue = signal('two-way binding => input 0')

    title = computed(() => {
        console.log('parent computed(): textValue =>', this.textValue())
        return `Parent Text: ${this.textValue()}`
    })
}


// 2. Service interaction with `Signals`.


@Injectable()
export class StoreService {
    private message_ = signal<string>('')
    message = computed(() => {
        console.debug('Message computed: ', this.message_())
        return this.message_() + 's.'
    })

    setMessage(text: string) {
        this.message_.set(text)
    }
}

@Component({
    selector: 'ia-service-interaction',
    template: `
        <h2>2. Service interaction</h2>
        <h3>Service message: {{ storage.message() }}</h3>
    `,
    providers: [StoreService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceInteractionComponent {

    storage = inject(StoreService)

    constructor() {
        interval(1000)
            .pipe(
                take(5),
                map((value) => this.storage.setMessage('Message: ' + value))
            )
            .subscribe()
    }
}


// 3. Dialog interaction: `ViewContainerRef.createComponent()` send/receive data through instance.


// abstraction for createComponent
export interface IDialogBase {
    data: WritableSignal<string>
    onOk: OutputEmitterRef<string>
    onDestroy: OutputEmitterRef<any>
}

// base class for all dialogs
@Component({
    selector: '',
    template: ''
})
export class DialogBase implements IDialogBase {

    data = signal('')
    onOk = output<string>()
    onDestroy = output()

    okClick(value: string = ''): void {
        this.onOk.emit(value)
        this.onDestroy.emit()
    }
}

// Marks the DOM location where Angular should inject dynamic content.
// Used to access the ViewContainerRef for dynamic component creation.
@Directive({
    selector: '[iaDialog]'
})
export class DialogDirective {

    constructor(
        viewContainer: ViewContainerRef,
        dialog: DialogService
    ) {
        dialog.setTemplate(viewContainer)
    }

}


// Service that dynamically creates dialog component
@Injectable({
    providedIn: 'root'
})
export class DialogService {

    private dialogTemplateRef!: ViewContainerRef

    setTemplate(template: ViewContainerRef) {
        this.dialogTemplateRef = template
    }

    open<T extends IDialogBase>(component: Type<T>, data?: WritableSignal<string>): T {
        const ref = this.dialogTemplateRef.createComponent<T>(component)
        if (data) ref.instance.data = data
        ref.instance.onDestroy.subscribe(() => ref.destroy())
        return ref.instance
    }

}

// This dialog component will be created dynamically.
@Component({
    selector: 'ia-dialog-component',
    template: `
        <h3>Data: {{ data() }}</h3>
        <hr>
        <button (click)="okClick('Return dialog result')">Ok</button>
    `,
    styles: [`
      :host {
        position: fixed;
        right: 20%;
        top: 40%;
        left: 20%;
        bottom: 40%;
        border: double black;
        background: lightcyan;
        box-shadow: 6px 4px 4px rgba(0, 0, 0, 0.5);
        text-align: center;
      }

      button {
        height: 40px;
        width: 80px;
      }
    `]
})
export class DialogComponentComponent extends DialogBase {
}

// This is an example of dialog usage
@Component({
    selector: 'ia-dialog-interaction',
    imports: [
        DialogDirective
    ],
    template: `
        <h2>3. Dialog interaction</h2>
        <button (click)="openDialog()">Open dialog</button>
        <h3>dialogResult: {{ dialogResult() }}</h3>
        <ng-template iaDialog></ng-template>`
})
export class DialogInteractionComponent {
    readonly dialog = inject(DialogService)
    data = signal('send data via component instance')
    dialogResult = signal<string>('')

    openDialog() {
        this.dialogResult.set('')
        const ref = this.dialog.open(DialogComponentComponent, this.data)
        ref.onOk.subscribe(value => {
            this.dialogResult.set(value)
            console.debug('Dialog return OK with value: ', value)
        })
    }
}


// 4. Template interaction: using `*ngTemplateOutlet context:{ $implicit }` and send it to `ng-template`.


@Component({
    selector: 'ia-template-interaction',
    imports: [
        NgTemplateOutlet
    ],
    template: `
        <h2>4. Template interaction</h2>
        <ng-container *ngTemplateOutlet="iaTemplate; context:{ $implicit: {title: 'context: $implicit'} }">
        </ng-container>

        <ng-template #iaTemplate let-item>
            <h3>Get context through ngTemplateOutlet : {{ item.title }}</h3>
        </ng-template>
    `
})
export class TemplateInteractionComponent {
}


// 5. viewChild(): looks for child component within own template.


@Component({
    selector: 'ia-view-child',
    template: '<h3>childProperty: {{childProperty()}}</h3>'
})
export class ViewChildComponent {
    childProperty = signal('')
}

@Component({
    selector: 'ia-view-parent',
    imports: [
        ViewChildComponent
    ],
    template: `
        <h2>5. viewChild() reference</h2>
        <ia-view-child></ia-view-child>`
})
export class ViewParentComponent implements OnInit {
    readonly child = viewChild(ViewChildComponent)

    ngOnInit() {
        this.child()?.childProperty.set('Modified from parent, injected via viewChild()')
    }
}


// 6. Projected content: using **contentChild()** to inject child or **@Host()**: to inject parent component.

// 🔑 Use @Host to ensure we ONLY look for ProjectedParentComponent
@Component({
    selector: 'ia-projected-child',
    template: '<h3>childProperty: {{childProperty()}}</h3>'
})
export class ProjectedChildComponent {
    childProperty = signal('')

    constructor(
        @Host() parent: ProjectedParentComponent
    ) {
        parent.parentProperty.set('Modified from child, injected via @Host()')
    }
}

@Component({
    selector: 'ia-projected-parent',
    template: `
        <h2>6. Projected content: using contentChild() to inject child or &#64;Host(): to inject parent component</h2>
        <h3>parentProperty: {{ parentProperty() }}</h3>
        <ng-content></ng-content>`
})
export class ProjectedParentComponent implements OnInit {
    parentProperty = signal('')
    readonly child = contentChild(ProjectedChildComponent)

    ngOnInit() {
        this.child()?.childProperty.set('Modified from parent, injected via contentChild()')
    }
}


// 7. ForwardRef: using `InjectionToken` and `forwardRef` to resolve circular dependency. To get parent component from child component with abstraction.


// Use an InjectionToken and forwardRef to allow a child component to inject an abstraction
// (like an interface) of its parent component, thus avoiding tight coupling.
export const PARENT_TOKEN = new InjectionToken('PARENT_TOKEN')

export interface IParent {
    parentProperty: WritableSignal<string>
}

@Directive({
    selector: '[iaForwardChild]'
})
export class ForwardChildComponent {
    parent = inject<IParent>(PARENT_TOKEN)

    constructor() {
        this.parent.parentProperty.set('Modified from host directive, injected via InjectionToken & forwardRef')
    }
}

@Component({
    selector: 'ia-forward-parent',
    template: `
        <h2>7. forwardRef reference</h2>
        <h3>parentProperty: {{ parentProperty() }}</h3>`,
    providers: [
        {
            provide: PARENT_TOKEN,
            useExisting: forwardRef(() => ForwardParentComponent)
        }
    ]
})
export class ForwardParentComponent implements IParent {
    parentProperty = signal('')
}


// container


@Component({
    selector: 'ia-interaction-container',
    template: `
        <ia-io-parent></ia-io-parent>
        <hr>
        <ia-service-interaction></ia-service-interaction>
        <hr>
        <ia-dialog-interaction></ia-dialog-interaction>
        <hr>
        <ia-template-interaction></ia-template-interaction>
        <hr>
        <ia-view-parent></ia-view-parent>
        <hr>
        <ia-projected-parent>
            <ia-projected-child></ia-projected-child>
        </ia-projected-parent>
        <hr>
        <ia-forward-parent iaForwardChild></ia-forward-parent>
    `,
    imports: [
        IOParentComponent,
        ServiceInteractionComponent,
        DialogInteractionComponent,
        TemplateInteractionComponent,
        ProjectedParentComponent,
        ProjectedChildComponent,
        ViewParentComponent,
        ForwardParentComponent,
        ForwardChildComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractionContainerComponent {
}