import { ChangeDetectorRef, Component, signal } from '@angular/core'

/**
 * Impossible Angular v20.x.x
 * Behaviours in Zoneless application with Default and OnPush change detection strategy.
 * Author: Sergii Lutchyn
 *
 * Usage:
 * <ia-zoneless-container></ia-zoneless-container>
 */


@Component({
    selector: 'ia-level-3',
    template: ` L3 => [{{ value }}]`
    // , changeDetection: ChangeDetectionStrategy.OnPush
})
export class Level3Component {
    value = 0

    constructor() {
        setTimeout(() => this.value = 3, 1000)
    }
}

@Component({
    selector: 'ia-level-2',
    imports: [
        Level3Component
    ],
    template: `L2 => [{{ valueSig() }}]
    <!--    L2 => [{{ valueObs | async }}]-->
    <hr>
    <ia-level-3></ia-level-3>`
    // , changeDetection: ChangeDetectionStrategy.OnPush
})
export class Level2Component {
    value = 0
    valueSig = signal(0)

    // valueObs = interval(1000)

    constructor(cdr: ChangeDetectorRef) {
        setTimeout(() => {
            console.warn('Trigger change detector!')
            this.value = 2
            this.valueSig.set(2)
            // cdr.markForCheck()
            // cdr.detectChanges()
        }, 3000)
    }
}

@Component({
    selector: 'ia-level-1',
    imports: [
        Level2Component
    ],
    template: ` L1 => [{{ value }}]
    <hr>
    <ia-level-2></ia-level-2>`
    // , changeDetection: ChangeDetectionStrategy.OnPush
})
export class Level1Component {
    value = 0

    constructor() {
        setTimeout(() => this.value = 1, 1000)
    }
}


@Component({
    selector: 'ia-zoneless-container',
    imports: [
        Level1Component
    ],
    template: '<ia-level-1></ia-level-1>'
})
export class ZoneLessContainerComponent {
}
