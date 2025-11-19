import { Component, signal, WritableSignal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import {
    catchError,
    concat,
    concatMap,
    delay,
    filter,
    forkJoin,
    from,
    interval,
    map,
    mergeMap,
    Observable,
    of,
    retry,
    scan,
    Subject,
    switchMap,
    take,
    takeUntil,
    throwError,
    timer,
    withLatestFrom
} from 'rxjs'
import { tap } from 'rxjs/operators'

/**
 * Impossible Angular v20.x.x
 * An example of common usage of RxJS functions.
 * Author: Sergii Lutchyn
 *
 * Usage:
 * <ia-rxjs></ia-rxjs>
 */

@Component({
    selector: 'ia-rxjs-container',
    template: `
        <h2>Uncomment the function you want to use in the constructor and check the Console output.</h2>

        <p>* <b>of</b>: emits an array as a single value and as separate values as well.</p>
        <p>* <b>from</b>: emits contents of array as separate values.</p>
        <p>* <b>retry</b>: an error handling operator that resubscribes to the source observable if it throws an error.</p>
        <p>* <b>catchError</b>: an error handling operator that intercepts an error in the observable stream.</p>
        <p>* <b>higher order mapping</b>: to get the result from one Observable and send it to another. Using switchMap, mergeMap, concatMap depends on the incoming stream.</p>
        <p>* <b>switchMap</b> - takes last one and cancels any previous inner observable subscriptions that are still in progress.</p>
        <p>* <b>mergeMap</b> - subscribes to all inner observables concurrently.</p>
        <p>* <b>concatMap</b> - subscribes to inner observables one at a time.</p>
        <p>* <b>forkJoin</b> - runs all observables in parallel and waits for all of them to complete, return array of values.</p>
        <p>* <b>concat</b> - chains observables together, running them sequentially, one-by-one manner.</p>
        <p>* <b>take</b> - take n values from stream.</p>
        <p>* <b>takeUntil</b> - cancel subscription with teardown subject.</p>
        <p>* <b>takeWhile</b> - cancel subscription when condition is false.</p>
        <p>* <b>scan</b> - handling continuous accumulation and emission of values, similar to .reduce((acc, cur)) function in array.</p>
        <p>* <b>withLatestFrom</b> - combine main stream with one or more others.</p>
        <p>* <b>tap</b> - execute function sequentially.</p>
    `
})
export class RxjsContainerComponent {
    constructor() {
        static_of_from()
        // map_retry_catchError()
        // higherOrderMapping()
        // map_switchMap()
        // map_mergeMap()
        // map_concatMap()
        // static_forkJoin()
        // static_concat()
        // tick() // take, takeWhile
        // takeUntil_Signal()
        // takeUntil_Subject()
        // takeUntil_timer()
        // static_scan()
        // map_withLatestFrom()
        // timerTap()
    }
}


const static_of_from = () => {
    title('rxjs functions: of, from')
    tick()
    of([1, 2, 3]).pipe(delay(1000), tap(value => console.warn('of([1,2,3]) - from array => ', value))).subscribe()
    of(1, 2, 3).pipe(delay(2000), tap(value => console.warn('of(1,2,3) - by commas separated => ', value))).subscribe()
    from([1, 2, 3]).pipe(delay(3000), tap(value => console.warn('from([1,2,3]) - from array => ', value))).subscribe()
}


const map_retry_catchError = () => {
    title('retry: resubscribes to the source after failure')
    title('catchError: intercepts an error in the observable stream')
    let attemptCount = 0
    // Observable simulating a request that fails most of the time
    const unstableRequest = new Observable<Array<number>>(subscriber => {
        attemptCount++
        console.log(`--- Attempt #${attemptCount} initiated ---`)
        // Simulate an error on the first three attempts
        if (attemptCount < 4) {
            const err = `Simulate failed on attempt ${attemptCount}`
            console.error(err)
            subscriber.error(new Error(err))
        } else {
            // Succeed on the fourth attempt
            subscriber.next([1, 2, 3])
            subscriber.complete()
        }
    })

    // --- Execution ---
    setTimeout(() =>
            unstableRequest.pipe(
                // 1. Log the error before retry kicks in
                catchError(err => {
                    console.error(`Error detected: ${err.message}`)
                    // Re-throw the error to trigger the retry mechanism
                    return throwError(() => err)
                }),
                // 2. The core mechanism: Retry the Observable up to 3 times with delay 1s
                // retry(3),
                retry({count: 3, delay: 1000}),
                map(value => console.warn('Get data after 3 retry', value)),
                catchError(() => {
                    console.error('Operation failed after all retries.')
                    return of(false)
                })
            ).subscribe()
        , 100)
}


const title = (values: string) => setTimeout(() => console.warn(values), 100)

const obs = (val: number) => of(val).pipe(
    delay(val * 1000),
    tap(value => console.warn(`obs[${value}$:${value}s]=>${value}`))
)

const tick = () => {
    interval(1000)
        // .pipe(takeWhile((val) => val < 10)) // cancel subscription when condition is false.
        .pipe(take(10)) // take n values from stream
        .subscribe({next: (value) => console.log(`tick: ${value + 1}s`)})
}


const higherOrderMapping = () => {
    title('Higher order mapping - to get the result from one Observable and send it to another. Using switchMap')
    tick()
    return obs(1)
        .pipe(
            tap((value) => console.warn(`[${value}] => obs([${value}]+1) => ${value + 1}`)),
            switchMap(value => obs(value + 1)),
            tap((value) => console.warn(`[${value}] => obs([${value}]+1) => ${value + 1}`)),
            switchMap(value => obs(value + 1)),
            tap((value) => console.warn(`[${value}] => obs([${value}]+1) => ${value + 1}`))
        ).subscribe()
}

const map_switchMap = () => {
    title('switchMap - take last one and cancels any previous inner observable subscriptions that are still in progress')
    tick()
    return of(obs(3), obs(1), obs(2))
        .pipe(
            switchMap(value => value),
            tap(value => console.warn(`[3s]$, [1s]$, [2s]$ - switchMap => ${value}`))
        ).subscribe()
}

const map_mergeMap = () => {
    title('mergeMap - subscribes to all inner observables CONCURRENTLY')
    tick()
    return of(obs(3), obs(1), obs(2))
        .pipe(
            mergeMap(value => value),
            tap((value) => console.warn(`[3s]$, [1s]$, [2s]$ - mergeMap - ${value}`))
        ).subscribe()
}

const map_concatMap = () => {
    title('concatMap - subscribes to inner observables one at a time (CONSECUTIVELY)')
    tick()
    return of(obs(3), obs(1), obs(2))
        .pipe(
            concatMap(value => value),
            tap((value) => console.warn(`[3s]$, [1s]$, [2s]$ - concatMap - ${value}`))
        ).subscribe()
}

const static_forkJoin = () => {
    title('forkJoin [3$, 1$, 2$] - runs all observables in parallel and waits for all of them to complete')
    tick()
    forkJoin([obs(3), obs(1), obs(2)])
        .pipe(
            tap((value) => console.warn(`[3s]$, [1s]$, [2s]$ - forkJoin => [${value}]`))
        ).subscribe()
}

const static_concat = () => {
    title('concat [3$, 1$, 2$] - chains observables together, running them SEQUENTIALLY, one-by-one manner')
    tick()
    concat(obs(3), obs(1), obs(2))
        .pipe(
            tap((value) => console.warn(`concat ${value}s`))
        ).subscribe()
}

const takeUntil_Signal = () => {
    title('To stop stream used takeUntil which triggered by signal')
    tick()
    const stopSignal: WritableSignal<boolean> = signal(false)
    // convert signal to observable
    const stopSignalToObservable = toObservable(stopSignal)
        .pipe(
            // signal act like BehaviorsSubject
            // use filter to let just 'true' values pass through
            filter(isStopped => isStopped === true),
            tap((value) => console.warn(`STOP SIGNAL EMITTED ${value}!`))
        )
    // stream interval
    interval(1000) // Emits 0, 1, 2, ... every 1 second
        .pipe(
            takeUntil(stopSignalToObservable)
        )
        .subscribe({
            next: (value) => console.warn(value),
            complete: () => console.warn('Observable stopped by Signal!')
        })
    // send stop signal
    setTimeout(() => stopSignal.set(true), 5000)
}

const takeUntil_Subject = () => {
    title('To stop stream used takeUntil which triggered by Subject')
    tick()
    const stopSubject: Subject<boolean> = new Subject<boolean>()
    // stream interval
    interval(1000) // Emits 0, 1, 2, ... every 1 second
        .pipe(
            takeUntil(stopSubject)
        )
        .subscribe({
            next: (value) => console.warn(value),
            complete: () => console.warn('Observable stopped by Subject!')
        })
    // send stop signal
    setTimeout(() => stopSubject.next(true), 5000)
}

const takeUntil_timer = () => {
    title('To stop stream used takeUntil which triggered by timer')
    tick()
    interval(1000)
        .pipe(
            takeUntil(timer(5000))
        )
        .subscribe({
            next: (value) => console.warn('takeUntil=>', value),
            complete: () => console.warn('Observable stopped by Timer 5s!')
        })
}

const static_scan = () => {
    title('scan - handling continuous accumulation and emission of values.')
    tick()
    // sum elements
    of(obs(1), obs(2), obs(3))
        .pipe(
            delay(110),
            tap(() => console.warn('scan((acc, curr) => acc + curr, 0) to sum elements')),
            mergeMap((value) => value),
            tap(value => console.warn('value: ', value)),
            scan((acc, curr) => acc + curr, 0),
            tap(value => console.warn('scan (acc + curr) from (1,2,3)', value))
        ).subscribe()
    // build array
    of(obs(1), obs(2), obs(3))
        .pipe(
            delay(5000),
            tap(() => console.warn('scan((acc, curr) => [...acc, curr], []) to build array')),
            mergeMap((value) => value),
            tap(value => console.warn('value: ', value)),
            scan((acc, curr) => [...acc, curr], [] as number[]),
            tap(value => console.warn('scan [...acc, curr] from (1,2,3)', value))
        ).subscribe()
}

const map_withLatestFrom = () => {
    title('withLatestFrom - combine main stream with one ore more other')
    tick()
    // const clicks = fromEvent(document, 'click');
    const clicks = interval(2000)
    const timer = interval(1000)
    clicks.pipe(
        withLatestFrom(timer),
        tap((value) => console.warn(`click ${value[0]}s`, `stream data ${value[1]}, `))
    ).subscribe()
}

// execute function sequentially with daley
const timerTap = () => {
    timer(100).pipe(
        tap(() => console.warn('Call function in tap')),
        delay(2000),
        tap(() => console.warn('Call after 2s')),
        delay(2000),
        tap(() => console.warn('Call after another 2s'))
    ).subscribe()
}
