import { Attribute, Component, Directive, effect, ElementRef, HostListener, inject, Injectable, input, Renderer2, signal, TemplateRef, ViewContainerRef } from '@angular/core'
import { interval, map } from 'rxjs'
import { AsyncPipe } from '@angular/common'
import { tap } from 'rxjs/operators'

/**
 * Impossible Angular v20.x.x
 * Attribute and structural directives
 * Author: Sergii Lutchyn
 *
 * Usage:
 * <ia-directives-container></ia-directives-container>
 */


/**
 * Color attribute for h1 selector
 * Usage:
 * <h1 ia-h1-color="red">Attribute directive for H1 selector</h1>
 */
@Directive({
    selector: 'h1'
})
export class H1ColorDirective {

    readonly elementRef = inject(ElementRef)
    readonly renderer = inject(Renderer2)

    // @ts-ignore
    constructor(@Attribute('ia-h1-color') private color: string) {
        this.renderer.setStyle(this.elementRef.nativeElement, 'color', this.color)
    }

}

/**
 * Color attribute for any selector
 * Usage:
 * <h3 ia-color="green">Attribute directive for any selector</h3>
 */
@Directive({
    selector: '[ia-color]'
})
export class AnyColorDirective {

    readonly color = input.required<string>({alias: 'ia-color'})

    readonly elementRef = inject(ElementRef)
    readonly renderer = inject(Renderer2)

    constructor() {
        effect(() => {
            this.renderer.setStyle(this.elementRef.nativeElement, 'color', this.color())
        })
    }

}

/**
 * Highlight on hover attribute for any selector
 * Usage:
 * <h2 ia-highlight>Highlight on hover</h2>
 */
@Directive({
    selector: '[ia-highlight]'
})
export class HighlightDirective {

    @HostListener('mouseenter') onMouseEnter() {
        this.renderer.setStyle(this.elementRef.nativeElement, 'background-color', 'yellow')
    }

    @HostListener('mouseleave') onMouseLeave() {
        this.renderer.setStyle(this.elementRef.nativeElement, 'background-color', this.previousColor)
    }

    readonly elementRef = inject(ElementRef)
    readonly renderer = inject(Renderer2)
    readonly previousColor?: string

    constructor() {
        this.previousColor = this.elementRef.nativeElement.style.color
    }

}

/**
 * *ia-show structural directive similar to @if control flow
 * Usage:
 * <h3 *ia-show="false">Structural directive similar @if, show me after 1s</p>
 */
@Directive({
    selector: '[ia-show]'
})
export class ShowDirective {

    readonly isShow = input.required<boolean | null>({alias: 'ia-show'})
    readonly templateRef = inject<any>(TemplateRef)
    readonly viewContainer = inject(ViewContainerRef)

    constructor() {
        effect(() => {
            if (this.isShow()) {
                this.viewContainer.createEmbeddedView(this.templateRef)
            } else {
                this.viewContainer.clear()
            }
        })
    }

}

/**
 * *ia-msg structural directive similar to @if with "as"
 * using $implicit parameter
 * Usage:
 * <h4 [style.color]="'blue'" *ia-msg="let msg">Type: {{ msg().type }}</h4>
 * <h4 [style.color]="'blue'" *ia-msg="let msg">Count: {{ msg().cnt }}</h4>
 *
 * readonly message = inject(MessageState)
 * private changeMessage = interval(1000)
 *     .pipe(tap(value => this.message.setMsg({type: 'type-' + value, cnt: value})))
 *     .subscribe()
 */
export type Msg = { type: string, cnt: number }

@Injectable({providedIn: 'root'})
export class MessageState {
    readonly message = signal<Msg | null>(null)
    getMsg = this.message.asReadonly()
    setMsg = (value: Msg) => {
        this.message.update(obj => ({...obj, ...value}))
    }
    clearMsg = () => this.message.set(null)
}

@Directive({
    selector: '[ia-msg]'
})
export class ShowMessageCountDirective {

    readonly templateRef = inject(TemplateRef<{ $implicit: Msg }>)
    readonly viewContainer = inject(ViewContainerRef)
    readonly messageState = inject(MessageState)

    private hasShown: boolean = false

    constructor() {
        effect(() => {
                if (this.messageState.getMsg() && !this.hasShown) {
                    this.hasShown = true
                    this.viewContainer.createEmbeddedView(this.templateRef,
                        {$implicit: this.messageState.getMsg})
                } else if (this.messageState.getMsg() === null && this.hasShown) {
                    this.hasShown = false
                    this.viewContainer.clear()
                }
            }
        )
    }

}


// Show all directives example
@Component({
    selector: 'ia-directives-container',
    imports: [
        AsyncPipe,
        H1ColorDirective,
        AnyColorDirective,
        HighlightDirective,
        ShowDirective,
        ShowMessageCountDirective
    ],
    template: `
        <h1 ia-h1-color="red">Attribute directive - color for H1 tag</h1>
        <h3 ia-color="green">Attribute directive - color for any selector</h3>
        <h2 ia-highlight>Attribute directive - highlight on hover</h2>

        <div [style.height]="'25px'">
            <h3 *ia-show="showHide | async">Structural directive: custom &#64;if, SHOW / HIDE</h3>
        </div>

        <h3>Structural directive: custom &#64;if within async service</h3>
        <h4 [style.color]="'blue'" *ia-msg="let msg">Type: {{ msg().type }}</h4>
        <h4 [style.color]="'blue'" *ia-msg="let msg">Count: {{ msg().cnt }}</h4>

        <h3>Same but without directive. Check code and decide which one looks better?</h3>
        @if (message.getMsg(); as msg) {
            <h4 [style.color]="'green'">Type:  {{ msg?.type }}</h4>
        }
        @if (message.getMsg(); as msg) {
            <h4 [style.color]="'green'">Count:  {{ msg?.cnt }}</h4>
        }
    `
})
export class DirectivesContainerComponent {
    showHide = interval(2000).pipe(map(value => (value % 2) === 0))

    readonly message = inject(MessageState)
    private changeMessage = interval(1000)
        .pipe(tap(value => this.message.setMsg({type: 'type-' + value, cnt: value})))
        .subscribe()
}
