import {
    AfterContentChecked,
    AfterContentInit,
    afterEveryRender,
    afterNextRender,
    AfterViewChecked,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    contentChild,
    DoCheck,
    effect,
    ElementRef,
    input,
    OnChanges,
    OnDestroy,
    OnInit,
    signal,
    SimpleChanges,
    viewChild
} from '@angular/core'
import { interval, map, take, timer } from 'rxjs'
import { AsyncPipe } from '@angular/common'

/**
 * Impossible Angular v21.x.x
 * Lifecycle hooks and Signals
 * Author: Sergii Lutchyn
 *
 * The Signal-based queries resolve earlier is due to their design philosophy of being synchronous
 * and immediately available as part of the component's setup.
 *
 * Component reference from contentChild(), viewChild() are available in ngOnInit hook.
 * - Correct for Signal-based queries
 * - Incorrect for the traditional decorator-based queries @ViewChild()
 *
 * ngOnChanges still triggered when input<number>() (signal) parameter changed the value probably for some legacy compatibility,
 * but it is not recommend use it in Signal-base environment, use effect() or computed()
 *
 * Usage:
 * <ia-lifecycle-hooks-container></ia-lifecycle-hooks-container>
 */

@Component({
    selector: 'ia-content',
    template: '<h4>{{label()}}</h4>',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentComponent {
    label = signal('PROJECTED CONTENT AVAILABLE')
}

@Component({
    selector: 'ia-view',
    template: '<h4>{{label()}}</h4>',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewComponent {
    label = signal('VIEW COMPONENT AVAILABLE')
}

@Component({
    selector: 'ia-lifecycle-hooks',
    template: `<h3>LifecycleHooks: see logs</h3>
    <h4>Input: {{ param() }}</h4>
    <hr>
    <ia-view></ia-view>
    <hr>
    <ng-content></ng-content>
    <hr>
    <div #divRef style="width: 300px; height: 150px; border: 1px solid #ccc;"></div>
    `,
    imports: [
        ViewComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifecycleHooksComponent implements OnInit, OnChanges, DoCheck, AfterViewInit, AfterContentChecked, AfterContentInit, AfterViewChecked, OnDestroy {

    param = input<number>()
    readonly projected = contentChild(ContentComponent)
    readonly viewChild = viewChild(ViewComponent)
    private divRef = viewChild.required<ElementRef<HTMLDivElement>>('divRef')

    constructor() {
        console.debug(`constructor contentChild: ${this.projected()?.label()}`)
        console.debug(`constructor viewChild: ${this.viewChild()?.label()}`)

        effect(() => {
            console.debug(`constructor effect param:`, this.param())
        })

        afterNextRender({
            // Use the `Write` phase to write to a geometric property.
            write: () => {
                console.debug('afterNextRender write border before:', this.divRef().nativeElement.style.border)
                this.divRef().nativeElement.style.border = 'double red'
                return this.divRef().nativeElement
            },
            // Use the `Read` phase to read geometric properties after all writes have occurred.
            read: (afterWrite) => {
                console.debug(`afterNextRender read afterWrite:`, afterWrite)
            }
        })
        afterEveryRender({
            write: () => {
                console.debug('afterEveryRender write')
            },
            read: (res) => {
                console.debug('afterEveryRender read')
            }
        })
    }

    ngOnInit() {
        console.debug(`ngOnInit contentChild: ${this.projected()?.label()}`)
        console.debug(`ngOnInit viewChild: ${this.viewChild()?.label()}`)
    }

    ngOnChanges(changes: SimpleChanges) {
        console.warn('ngOnChanges')
        console.debug('ngOnChanges', changes)
    }

    ngDoCheck() {
        console.debug('ngDoCheck')
    }

    ngAfterContentInit() {
        console.debug(`ngAfterContentInit contentChild: ${this.projected()?.label()}`)
        console.debug(`ngAfterContentInit viewChild: ${this.viewChild()?.label()}`)
    }

    ngAfterContentChecked() {
        console.debug('ngAfterContentChecked')
    }

    ngAfterViewInit() {
        console.debug(`ngAfterViewInit contentChild: ${this.projected()?.label()}`)
        console.debug(`ngAfterViewInit viewChild: ${this.viewChild()?.label()}`)
    }

    ngAfterViewChecked() {
        console.debug('ngAfterViewChecked')
    }

    ngOnDestroy() {
        console.debug('ngOnDestroy')
    }

}

@Component({
    selector: 'ia-lifecycle-hooks-container',
    template: `
        @if ((isShow | async) === null) {
            <ia-lifecycle-hooks [param]="param()">
                <ia-content></ia-content>
            </ia-lifecycle-hooks>
        }`,
    imports: [
        LifecycleHooksComponent,
        AsyncPipe,
        ContentComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifecycleHooksContainerComponent {
    readonly param = signal(0)
    readonly isShow = timer(10000).pipe(map(() => false))

    constructor() {
        interval(1000)
            .pipe(
                take(3),
                map((tick) => this.param.update(value => value = tick)))
            .subscribe()
    }
}
