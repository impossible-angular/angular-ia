import { Component, Directive, effect, forwardRef, inject, InjectionToken, input, signal, WritableSignal } from '@angular/core'
import { FormsModule } from '@angular/forms'

/**
 * Impossible Angular v20.x.x
 * Simplified implementation of ControlValueAccessor (CVA)
 * Author: Sergii Lutchyn
 *
 * This example is designed to illustrate key Angular concepts,
 * such as Dependency Injection, and core JavaScript techniques, including closures and callback functions.
 *
 * How it works.
 *      The component registered a provider that references itself (using forwardRef and useExisting),
 * allowing it to serve as the value accessor and implement the necessary functions for form change tracking.
 *      The directive uses the host component's reference to inject it, to apply FormControl's value to the host component
 * and register callback functions (base on interface implementation) for change detection and validation.
 *
 * Usage:
 * <ia-cva-container></ia-cva-container>
 */


// This token is used within the directive to inject the component that implements ControlValueAccessor,
// and to register a provider for that component.
export const IA_FORM_CONTROL = new InjectionToken<IValueControlAccessor>('CVA')

// simplified IValueControlAccessor interface
export interface IValueControlAccessor {
    value: any
    writeValue: (value: any) => void

    registerOnChange(fn: (_: any) => void): void
}

// simplified ValidatorFn
type IaValidatorFn = (control: IaFormControl) => boolean | null

// simplified FormControl with simple validator validate()
export class IaFormControl {

    readonly validatorFn?: IaValidatorFn
    private value: WritableSignal<any> = signal(null)
    isValid: WritableSignal<boolean> = signal(false)

    constructor(value: any, validatorFn?: IaValidatorFn) {
        this.value.set(value)
        this.validatorFn = validatorFn
    }

    get getValue() {
        return this.value.asReadonly()
    }

    setValue(value: any) {
        this.value.set(value)
    }

    validate() {
        if (this.validatorFn) {
            this.isValid.set(this.validatorFn(this) ?? false)
        }
    }
}

// simplified FormControl directive
// all magic here
@Directive({
    selector: '[iaFormControl]'
})
export class IaFormControlDirective {

    // data object that will be modified
    formControlItem = input.required<IaFormControl>({alias: 'iaFormControl'})
    // host ValueControlAccessor component
    private componentAccessor = inject<IValueControlAccessor>(IA_FORM_CONTROL)

    constructor() {
        // Override onChange(value: any) function inside host component
        // and .bind(this) is used to bind its context to the directive.
        // Now, the overridden onChange() function that is called in the host component will execute the directive's onChange() method.
        this.componentAccessor.registerOnChange(this.onChange.bind(this))
        // Sets the initial value and updates it within the host component
        effect(() => {
            console.warn('effect compare', this.formControlItem().getValue(), '!==', this.componentAccessor.value)
            // change logic
            // if changes came from host component by calling onChange() within .writeValue() its prevent run it again
            // but call writeValue() if changes originate from the data model by calling setValue(...) on the form FormControl instance
            if (this.formControlItem().getValue() !== this.componentAccessor.value) {
                console.warn('effect writeValue to accessor', this.formControlItem().getValue())
                this.componentAccessor.writeValue(this.formControlItem().getValue())
            }
        })
    }

    // The callback function that is registered and executed within the CVA component,
    // apply changes to the FormControl and triggers validation.
    onChange(value: any) {
        console.warn('onChange FormControl', value)
        this.formControlItem().setValue(value)
        this.formControlItem().validate()
    }

}

// The CVA component has a circular dependency declaration.
// that allow to inject this component into directive plus the onChange() registration
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

// The example component creates a FormControl instance and uses the [iaFormControl] directive
// to link it to the accessor component, applying the necessary change and validation rules.
@Component({
    selector: 'ia-cva-container',
    imports: [
        IaCvaInputComponent,
        IaFormControlDirective
    ],
    template: `
        <p>Value from control: {{ iaForm.getValue() }}</p>
        <p [style.color]="iaForm.isValid() ? 'blue': 'red'">Validator: value < 5 is {{ iaForm.isValid() }}</p>
        <ia-cva-input [iaFormControl]="iaForm"></ia-cva-input>
        <button (click)="click()">set to default</button>
    `
})
export class CvaContainerComponent {

    private minValidator = (minValue: number): IaValidatorFn => {
        return (control: IaFormControl) => {
            return control.getValue() < minValue
        }
    }
    iaForm = new IaFormControl(0, this.minValidator(5))

    click() {
        this.iaForm.setValue(0)
    }

}
