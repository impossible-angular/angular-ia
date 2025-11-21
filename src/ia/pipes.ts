import { ChangeDetectionStrategy, Component, inject, LOCALE_ID, Pipe, PipeTransform, signal } from '@angular/core'
import { interval, Observable, Subscription } from 'rxjs'
import { DatePipe } from '@angular/common'


/**
 * Impossible Angular v21.x.x
 * Examples of Custom `async` Pipe and Extensions of Angular Core Pipes
 * Author: Sergii Lutchyn
 *
 * Usage:
 * <ia-pipes-container></ia-pipes-container>
 */


@Pipe({
    name: 'iaAsync',
    pure: false
})
export class IaAsyncPipe implements PipeTransform {

    returnValue = signal(null)
    private subscription: Subscription | null = null
    private observable: Observable<any> | null = null

    transform(obs: Observable<any> | null): any {
        if (!obs) {
            return this.returnValue()
        }
        if (obs !== this.observable) {
            // If the Observable is new, unsubscribe from the old one
            if (this.subscription) {
                this.subscription.unsubscribe()
            }
            this.observable = obs
            this.subscription = obs.subscribe(value => {
                this.returnValue.set(value)
            })
        }
        return this.returnValue()
    }

}

@Pipe({
    name: 'iaDate'
})
export class IaDatePipe implements PipeTransform {

    readonly datePipe: DatePipe = new DatePipe(inject(LOCALE_ID))

    transform(value: Date | string, isIso: boolean = false) {
        if (isIso) {
            return new Date(value).toISOString()
        }
        return this.datePipe.transform(value, 'yyyy-MM-dd')
    }
}


@Component({
    selector: 'ia-pipes-container',
    imports: [
        IaAsyncPipe,
        IaDatePipe
    ],
    template: `
        <h2>Custom, Non-Pure Pipe Based on Signals</h2>
        <h3><code>Get async value => {{ value | iaAsync }}</code></h3>

        <hr>
        <h2>Extended Angular DatePipe</h2>
        <h3><code>Angular Pipe => {{ '2025-06-20' | iaDate }}</code></h3>
        <h3><code>Extended toISOString => {{ '2025-06-20' | iaDate:true }}</code></h3>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipesContainerComponent {
    value = interval(1000)
}